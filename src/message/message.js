/*!
 * A message.
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
class Message {
    constructor() {
        this.lines = [];
        this.EOL = "\r\n";
        this.variables = {};
    }

    marshall() {
        let output = "";
        for (const [key, value] of Object.entries(this)) {
            if (key !== 'variables' && key !== 'lines' && key !== 'EOL' && typeof value !== 'function') {
                output += `${key}: ${value}${this.EOL}`;
            }
        }
        for (const [key, value] of Object.entries(this.variables)) {
            output += `Variable: ${key}=${value}${this.EOL}`;
        }
        return output + this.EOL;
    }

    unmarshall(data) {
        this.lines = data.split(this.EOL);
        for (const line of this.lines) {
            const parts = line.split(":");
            const key = parts.shift().replace(/-/, '_').toLowerCase();
            const value = parts.join(':').trim();
            if (key.includes('variable') && value.includes('=')) {
                const [varKey, varValue] = value.split("=");
                this.variables[varKey.trim()] = varValue.trim();
            } else {
                this.set(key, value);
            }
        }
    }

    set(name, value) {
        this[name] = value;
    }

    get(name) {
        return this[name];
    }
}

module.exports = { Message };

