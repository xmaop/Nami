/*!
 * Action message.
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
 * Action message.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 */

/**
 * @fileoverview Base action class.
 */

const { Message } = require(__dirname + '/message.js');

/**
 * Generates a unique ID for actions.
 */
const ActionUniqueId = (() => {
  let nextId = 0;
  return () => nextId++;
})();

/**
 * Base action class. Every action sent to AMI must be one of these.
 * @extends Message
 */
class Action extends Message {
  constructor(name) {
    super();
    this.id = ActionUniqueId();
    this.set('ActionID', this.id);
    this.set('Action', name);
  }
}

/**
 * Helper function to create action classes dynamically.
 * @param {String} name - The name of the action.
 * @param {Array} params - The parameters for the action.
 * @param {Object} additionalProperties - Additional properties for the action.
 * @returns {Class} - The generated action class.
 */
const createActionClass = (name, params = [], additionalProperties = {}) => {
  return class extends Action {
    constructor(...args) {
      super(name);
      params.forEach((param, index) => {
        if (args[index] !== undefined) {
          this.set(param, args[index]);
        }
      });
      Object.keys(additionalProperties).forEach(key => {
        this.set(key, additionalProperties[key]);
      });
    }
  };
};

const actionsConfig = [
  { name: 'Login', params: ['Username', 'Secret'] },
  { name: 'CoreShowChannels' },
  { name: 'Ping' },
  { name: 'Hangup' },
  { name: 'CoreStatus' },
  { name: 'Status' },
  { name: 'DahdiShowChannels' },
  { name: 'CoreSettings' },
  { name: 'ListCommands' },
  { name: 'Logoff' },
  { name: 'AbsoluteTimeout' },
  { name: 'SIPShowPeer' },
  { name: 'ExtensionStateList' },
  { name: 'SIPShowRegistry' },
  { name: 'SIPQualifyPeer' },
  { name: 'SIPPeers' },
  { name: 'AgentLogoff' },
  { name: 'Agents' },
  { name: 'AttendedTransfer', params: ['Channel', 'Exten', 'Context', 'Priority'] },
  { name: 'ChangeMonitor', params: ['Channel', 'File'] },
  { name: 'Command', params: ['Command'] },
  { name: 'CreateConfig', params: ['Filename'] },
  { name: 'DahdiDialOffHook', params: ['DAHDIChannel', 'Number'] },
  { name: 'DahdiDndOff', params: ['DAHDIChannel'] },
  { name: 'DahdiDndOn', params: ['DAHDIChannel'] },
  { name: 'DahdiHangup', params: ['DAHDIChannel'] },
  { name: 'DahdiRestart' },
  { name: 'DbDel', params: ['Family', 'Key'] },
  { name: 'DbDeltree', params: ['Family', 'Key'] },
  { name: 'DbGet', params: ['Family', 'Key'] },
  { name: 'DbPut', params: ['Family', 'Key', 'Value'] },
  { name: 'ExtensionState', params: ['Exten', 'Context'] },
  { name: 'GetConfig', params: ['Filename', 'Category'] },
  { name: 'GetConfigJson', params: ['Filename'] },
  { name: 'GetVar', params: ['Variable', 'Channel'] },
  { name: 'JabberSend', params: ['Jabber', 'JID', 'Message'] },
  { name: 'ListCategories', params: ['Filename'] },
  { name: 'PauseMonitor', params: ['Channel'] },
  { name: 'UnpauseMonitor', params: ['Channel'] },
  { name: 'StopMonitor', params: ['Channel'] },
  { name: 'LocalOptimizeAway', params: ['Channel'] },
  { name: 'SetVar', params: ['Variable', 'Value', 'Channel'] },
  { name: 'Reload', params: ['Module'] },
  { name: 'PlayDtmf', params: ['Channel', 'Digit'] },
  { name: 'Park', params: ['Channel', 'Channel2', 'Timeout', 'Parkinglot'] },
  { name: 'ParkedCalls', params: ['ParkingLot'] },
  { name: 'Parkinglots' },
  { name: 'Monitor', params: ['Channel', 'Filename'], additionalProperties: { format: 'wav', mix: 'true' } },
  { name: 'ModuleCheck', params: ['Module'] },
  { name: 'ModuleLoad', params: ['Module'], additionalProperties: { LoadType: 'load' } },
  { name: 'ModuleUnload', params: ['Module'], additionalProperties: { LoadType: 'unload' } },
  { name: 'ModuleReload', params: ['Module'], additionalProperties: { LoadType: 'reload' } },
  { name: 'MailboxCount', params: ['Mailbox'] },
  { name: 'MailboxStatus', params: ['Mailbox'] },
  { name: 'VoicemailUsersList' },
  { name: 'Originate', params: ['Channel', 'Exten', 'Priority', 'Application', 'Data', 'Timeout', 'CallerID', 'Account', 'Async', 'Codecs'] },
  { name: 'Redirect', params: ['Channel', 'Exten', 'Context', 'Priority', 'ExtraChannel', 'ExtraExten', 'ExtraContext', 'ExtraPriority'] },
  { name: 'Bridge', params: ['Channel1', 'Channel2', 'Tone'] },
  { name: 'ShowDialPlan', params: ['Context', 'Extension'] },
  { name: 'SendText', params: ['Channel', 'Message'] },
  { name: 'Queues' },
  { name: 'QueueReload', params: ['queue', 'members', 'rules', 'parameters'] },
  { name: 'QueueUnpause', params: ['Interface', 'Queue', 'Reason'], additionalProperties: { paused: 'false' } },
  { name: 'QueuePause', params: ['Interface', 'Queue', 'Reason'], additionalProperties: { paused: 'true' } },
  { name: 'QueueSummary', params: ['Queue'] },
  { name: 'QueueRule', params: ['Rule'] },
  { name: 'QueueStatus', params: ['Queue', 'Member'] },
  { name: 'QueueReset', params: ['Queue'] },
  { name: 'QueueRemove', params: ['Interface', 'Queue'] },
  { name: 'QueueAdd', params: ['Interface', 'Queue', 'Paused', 'MemberName', 'Penalty'] },
  { name: 'QueueLog', params: ['Queue', 'Event', 'Message', 'Interface', 'UniqueId'] },
  { name: 'MeetmeList', params: ['Conference'] },
  { name: 'MeetmeMute', params: ['Meetme', 'Usernum'] },
  { name: 'MeetmeUnmute', params: ['Meetme', 'Usernum'] },
  { name: 'ConfbridgeListRooms' },
  { name: 'ConfbridgeList', params: ['Conference'] },
  { name: 'ConfbridgeKick', params: ['Conference', 'Channel'] },
  { name: 'ConfbridgeLock', params: ['Conference'] },
  { name: 'ConfbridgeUnlock', params: ['Conference'] },
  { name: 'ConfbridgeMute', params: ['Conference', 'Channel'] },
  { name: 'ConfbridgeUnmute', params: ['Conference', 'Channel'] },
  { name: 'AGI', params: ['Channel', 'Command', 'CommandID'] },
  { name: 'BlindTransfer', params: ['Channel', 'Context', 'Extension'] },
  { name: 'Filter', params: ['Operation', 'Filter'] },
  { name: 'UserEvent', params: ['UserEvent'] },
  { name: 'Events', params: ['Eventmask'] },
];

const exportedActions = {};

actionsConfig.forEach(({ name, params, additionalProperties }) => {
  exportedActions[name] = createActionClass(name, params, additionalProperties);
});

module.exports = exportedActions;
