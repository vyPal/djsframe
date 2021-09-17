import { Collection } from 'discord.js';
import FrameCommand from './commands/command.js';
import path from 'path';
import fs from 'fs';
import FrameGroup from './commands/group.js';

/**
 * Class for registering and searching for commands and groups
 * @class FrameRegistry
 */
class FrameRegistry {
  /**
   * Creates a registry
   * @constructor
   * @param {FrameClient} [client] - The client to initialise the registery with
   */
  constructor(client) {
    /**
     * The client that this registry will be for
     * @name FrameRegistry#client
     * @type {FrameClient}
     * @readonly
     */
    Object.defineProperty(this, 'client', { value: client });

    /**
     * All registered commands, mapped by their name
     * @type {Collection<string, FrameCommand>}
     */
    this.commands = new Collection();

    /**
     * All registered groups, mapped by their ID
     * @type {Collection<string, CommandGroup>}
     */
    this.groups = new Collection();

    /**
     * Full path to bot's command folder
     * @type {?string}
     */
    this.commandsPath = null;

    /**
     * Command that will be run when an unkwnown command is used
     * @type {?FrameCommand}
     */
    this.unknownCommand = null;
  }

  /**
   * Adds a new group to the registry
   * @param {String} id The ID of the group (must be lowercase)
   * @param {String} name The name of the group
   * @returns {FrameRegistry} registry
   * @see {@link FrameRegistry#registerGroup}
   */
  registerGroup(id, name, rcmds = true) {
    let group = new FrameGroup(id, name);
    if(this.groups.has(id)) {
      this.client.emit('warn', `Group already registered: ${id}, skipping.`);
    }else {
      this.groups.set(id, group);

      /**
       * Emmited when a new group is registered
       * @event FrameClient#groupRegister
       * @param {FrameGroup} group - The group that was registered
       * @param {FrameRegistry} registry - The registry in which the group was registered
       */
      this.client.emit('groupRegister', group, this);
      if(rcmds) this.registerCommandsInDir(id);
    }
    return this;
  }

  /**
   * Adds multiple groups to the registry with one command
   * @param {Array} groups - The groups to add to the registry
   * @returns {FrameRegistry} registry
   */
  registerGroups(groups) {
    if(!Array.isArray(groups)) throw new TypeError('groups must be an array');
    groups.forEach(group => {
      if(!Array.isArray(group)) throw new TypeError('groups must be an array of arrays. example: [[id1, name1], [id2, name2]]');
      this.registerGroup(group[0], group[1]);
    })
    return this;
  }

  /**
   * Adds a single command to the registry
   * @param {FrameCommand} command - The command to add to the registry
   * @returns {FrameRegistry} registry
   */
  registerCommand(command) {
    if(!command instanceof FrameCommand) throw new TypeError('command must be a Command');
    let cmd = new command(this.client);
    this.commands.set(cmd.name, cmd);

    /**
     * Emmited when a new command is registered
     * @event FrameClient#commandRegister
     * @param {FrameCommand} command - The command that was registered
     * @param {FrameRegistry} registry - The registry in which the command was registered
     */
    this.client.emit('commandRegister', cmd, this);
    return this;
  }

  /**
   * Adds multiple commands to the registry with one command
   * @param {Array} commands - The command to add to the registry
   * @returns {FrameRegistry} registry
   */
  registerCommands(commands) {
    if(!Array.isArray(commands)) throw new TypeError('commands must be an array');
    commands.forEach(command => {
      this.registerCommand(command);
    })
    return this;
  }

  /**
   * Adds all the commands in the folder specified to the registry
   * @param {String} dir - The folder to register commands in
   * @returns {FrameRegistry} registry
   */
  registerCommandsInDir(dir) {
    if(typeof dir !== 'string') throw new TypeError('dir must be a string');
    fs.readdir(path.join(__dirname, this.commandsPath, dir), (err, files) => {
      if(err) throw new Error('Error during reading directory: ' + dir);
      files.forEach(file => {
        let cmd = require(path.join(__dirname, this.commandsPath, dir, file));
        this.registerCommand(cmd);
      })
    })
    return this;
  }

  /**
   * Sets the folder in which all the command files are
   * @param {String} dir - The folder to set as the command folder
   * @returns {FrameRegistry} registry
   */
  setCommandDir(dir) {
    if(typeof dir !== 'string') throw new TypeError('dir must be a string');
    let dirfull = path.join(__dirname, dir);
    this.commandsPath = dirfull;

    /**
     * Emmited when the command folder is changed
     * @event FrameClient#setCommandDir
     * @param {String} dir - The folder to set as the command folder
     * @param {FrameRegistry} registry - The registry in which the command folder was changed
     */
    this.client.emit('setCommandDir', dirfull, this);
    return this;
  }

  /**
   * Adds all default commands and command groups to the registry
   * @returns {FrameRegistry} registry
   */
  registerDefaults() {
    this.registerDefaultGroups();
    this.registerDefaultCommands();
    return this;
  }

  /**
   * The options for registering the default groups in the registry
   * @typedef {Object} RegistryDefaultGroupOptions
   * @property {Boolean} [util=true] - Whether to register the Utility group
   */

  /**
   * Adds the default groups to the registry
   * @param {RegistryDefaultGroupOptions} opts - The options for adding the default groups
   * @returns {FrameRegistry} registry
   */
  registerDefaultGroups(opts = {}) {
    let options = Object.assign({}, {
      util: true
    }, {opts});
    let defaultGroups = [['util', 'Utility']];
    defaultGroups.forEach(dg => {
      if(options[dg[0]] == true) {
        this.registerGroup(dg[0], dg[1], false);
      }
    })
    return this;
  }

  /**
   * The options for registering the default commands in the registry
   * @typedef {Object} RegistryDefaultCommandOptions
   * @property {Boolean} [help=true] - Whether to register the Help command
   */

  /**
   * Adds the default commands to the registry
   * @param {RegistryDefaultCommandOptions} opts - The options for adding the default commands
   * @returns {FrameRegistry} registry
   */
  registerDefaultCommands(opts = {}) {
    let options = Object.assign({}, {
      help: true
    }, {opts});
    let defaultCmds = [['util', 'help']];
    defaultCmds.forEach(dcmd => {
      if(options[dcmd[1]] == true) {
        this.registerCommand(require(path.join(__dirname, this.commandsPath, dcmd[0], dcmd[1])));
      }
    })
    return this;
  }
}

export default FrameRegistry;