/*!
 * Nami core class.
 *
 * Copyright 2011 Marcelo Gornstein <marcelog@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
/*!
 * Nami core class.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 */

/**
 * @fileoverview Nami client code.
 */

const net = require('net');
const events = require('events');
const action = require(__dirname + '/message/action.js');
const namiResponse = require(__dirname + '/message/response.js');
const util = require('util');
const namiEvents = require(__dirname + '/message/event.js');

/**
 * Nami client.
 * @constructor
 * @param {object} amiData The configuration for ami.
 * @augments EventEmitter
 */
function Nami(amiData) {
    Nami.super_.call(this);
    this.logLevel = 3; // debug level by default.
    this.logger = amiData.logger || this.createLogger();
    this.connected = false;
    this.amiData = amiData;
    this.EOL = "\r\n";
    this.EOM = this.EOL + this.EOL;
    this.welcomeMessage = "Asterisk Call Manager/.*" + this.EOL;
    this.received = "";
    this.responses = {};
    this.callbacks = {};

    this.on('namiRawMessage', this.onRawMessage.bind(this));
    this.on('namiRawResponse', this.onRawResponse.bind(this));
    this.on('namiRawEvent', this.onRawEvent.bind(this));
}
util.inherits(Nami, events.EventEmitter);

Nami.prototype.createLogger = function () {
    const genericLog = (minLevel, fun, msg) => {
        if (this.logLevel >= minLevel) fun(msg);
    };
    return {
        error: msg => genericLog(0, console.error, msg),
        warn: msg => genericLog(1, console.warn, msg),
        info: msg => genericLog(2, console.info, msg),
        debug: msg => genericLog(3, console.log, msg)
    };
};

Nami.prototype.onRawEvent = function (event) {
    this.logger.debug('Got event: ' + util.inspect(event));
    if (event.actionid && this.responses[event.actionid] && this.callbacks[event.actionid]) {
        this.responses[event.actionid].events.push(event);
        if (event.event.includes('Complete') || (event.eventlist && event.eventlist.includes('Complete')) || event.event.includes('DBGetResponse')) {
            this.callbacks[event.actionid](this.responses[event.actionid]);
            delete this.callbacks[event.actionid];
            delete this.responses[event.actionid];
        }
    } else {
        this.emit('namiEvent', event);
        this.emit('namiEvent' + event.event, event);
    }
};

Nami.prototype.onRawResponse = function (response) {
    this.logger.debug('Got response: ' + util.inspect(response));
    if (response.message && response.message.includes('follow')) {
        this.responses[response.actionid] = response;
    } else if (this.callbacks[response.actionid]) {
        this.callbacks[response.actionid](response);
        delete this.callbacks[response.actionid];
        delete this.responses[response.actionid];
    }
};

Nami.prototype.onRawMessage = function (buffer) {
    this.logger.debug('Building raw message: ' + util.inspect(buffer));
    if (buffer.match(/^Event: /)) {
        const event = new namiEvents.Event(buffer);
        this.emit('namiRawEvent', event);
    } else if (buffer.match(/^Response: /)) {
        const response = new namiResponse.Response(buffer);
        this.emit('namiRawResponse', response);
    } else {
        this.logger.warn("Discarded: |" + buffer + "|");
    }
};

Nami.prototype.onData = function (data) {
    this.logger.debug('Got data: ' + util.inspect(data));
    this.received += data;
    let theEOM;
    while ((theEOM = this.received.indexOf(this.EOM)) !== -1) {
        const msg = this.received.substring(0, theEOM);
        this.emit('namiRawMessage', msg);
        const startOffset = theEOM + this.EOM.length;
        let skippedEolChars = 0;
        while (["\r", "\n"].includes(this.received[startOffset + skippedEolChars])) {
            skippedEolChars++;
        }
        this.logger.debug('Skipped ' + skippedEolChars + ' bytes');
        this.received = this.received.substring(startOffset + skippedEolChars);
    }
};

Nami.prototype.onConnect = function () {
    this.connected = true;
};

Nami.prototype.onClosed = function () {
    this.connected = false;
};

Nami.prototype.onWelcomeMessage = function (data) {
    this.logger.debug('Got welcome message: ' + util.inspect(data));
    if (!data.match(new RegExp(this.welcomeMessage))) {
        this.emit('namiInvalidPeer', data);
    } else {
        this.socket.on('data', this.onData.bind(this));
        this.send(new action.Login(this.amiData.username, this.amiData.secret), response => {
            if (response.response !== 'Success') {
                this.emit('namiLoginIncorrect');
            } else {
                this.emit('namiConnected');
            }
        });
    }
};

Nami.prototype.close = function () {
    this.send(new action.Logoff(), () => this.logger.info('Logged out'));
    this.logger.info('Closing connection');
    this.removeAllListeners();
    if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.end();
    }
    this.onClosed();
};

Nami.prototype.open = function () {
    this.logger.debug('Opening connection');
    this.received = "";
    this.initializeSocket();
};

Nami.prototype.initializeSocket = function () {
    this.logger.debug('Initializing socket');
    if (this.socket && !this.socket.destroyed) {
        this.socket.removeAllListeners();
        this.socket.end();
    }
    this.socket = new net.Socket();
    this.socket.setEncoding('ascii');

    const baseEvent = 'namiConnection';
    this.socket.on('connect', () => this.handleSocketEvent('Connect', baseEvent));
    this.socket.on('error', error => this.handleSocketEvent('Error', baseEvent, error));
    this.socket.on('close', had_error => this.handleSocketEvent('Close', baseEvent, had_error));
    this.socket.on('timeout', () => this.handleSocketEvent('Timeout', baseEvent));
    this.socket.on('end', () => this.handleSocketEvent('End', baseEvent));

    this.socket.once('data', data => this.onWelcomeMessage(data));
    this.socket.connect(this.amiData.port, this.amiData.host);
};

Nami.prototype.handleSocketEvent = function (eventType, baseEvent, additionalData) {
    this.logger.debug(`Socket ${eventType.toLowerCase()}`);
    if (eventType === 'Connect') {
        this.onConnect();
    } else if (eventType === 'Close') {
        this.onClosed();
    }
    this.emit(`${baseEvent}${eventType}`, { event: eventType, ...additionalData && { additionalData } });
};

Nami.prototype.reopen = function () {
    this.logger.debug('Reopening connection');
    this.initializeSocket();
};

Nami.prototype.send = function (action, callback) {
    this.logger.debug('Sending: ' + util.inspect(action));
    this.callbacks[action.ActionID] = callback;
    this.responses[action.ActionID] = "";
    this.socket.write(action.marshall());
};

exports.Nami = Nami;
exports.Actions = action;
exports.Event = namiEvents;
exports.Response = namiResponse;
