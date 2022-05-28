const { Collection } = require('discord.js');
const FrameCommand = require('./commands/command.js');
const path = require('path');
const fs = require('fs');
const FrameGroup = require('./commands/group.js');
const ArgumentType = require('./types/base.js');
const { isConstructor } = require('./util.js');

/**
 * Class for registering and searching for commands and groups
 */
class FrameRegistry {
  /**
   * Creates a registry
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
     * All registered types, mapped by their ID
     * @type {Collection<string, ArgumentType>}
     */
    this.types = new Collection();

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
  registerGroup(id, name) {
    let group = new FrameGroup(this.client, id, name);
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
		/* eslint-disable new-cap */
		if(isConstructor(command, FrameCommand)) command = new command(this.client);
		else if(isConstructor(command.default, FrameCommand)) command = new command.default(this.client);
		/* eslint-enable new-cap */
		if(!(command instanceof FrameCommand)) throw new Error(`Invalid command object to register: ${command}`);

		// Make sure there aren't any conflicts
		if(this.commands.some(cmd => cmd.name === command.name || cmd.aliases.includes(command.name))) {
			throw new Error(`A command with the name/alias "${command.name}" is already registered.`);
		}
		for(const alias of command.aliases) {
			if(this.commands.some(cmd => cmd.name === alias || cmd.aliases.includes(alias))) {
				throw new Error(`A command with the name/alias "${alias}" is already registered.`);
			}
		}
		const group = this.groups.find(grp => grp.id === command.group);
		if(!group) throw new Error(`Group "${command.group}" is not registered.`);
		if(group.commands.some(cmd => cmd.memberName === command.memberName)) {
			throw new Error(`A command with the member name "${command.memberName}" is already registered in ${group.id}`);
		}
		if(command.unknown && this.unknownCommand) throw new Error('An unknown command is already registered.');

		// Add the command
		command.group = group;
		group.commands.set(command.name, command);
		this.commands.set(command.name, command);
		if(command.unknown) this.unknownCommand = command;

		/**
		 * Emitted when a command is registered
		 * @event FrameClient#commandRegister
		 * @param {FrameCommand} command - Command that was registered
		 * @param {FrameRegistry} registry - Registry that the command was registered to
		 */
		this.client.emit('commandRegister', command, this);
		this.client.emit('debug', `Registered command ${group.id}:${command.memberName}.`);

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
	 * Registers all commands in a directory. The files must export a Command class constructor or instance.
	 * @param {string|RequireAllOptions} options - The path to the directory, or a require-all options object
	 * @return {FrameRegistry}
	 * @example
	 * const path = require('path');
	 * registry.registerCommandsIn(path.join(__dirname, 'commands'));
	 */
	registerCommandsIn(options) {
		const obj = require('require-all')(options);
		const commands = [];
		for(const group of Object.values(obj)) {
			for(let command of Object.values(group)) {
				if(typeof command.default === 'function') command = command.default;
				commands.push(command);
			}
		}
		if(typeof options === 'string' && !this.commandsPath) this.commandsPath = options;
		else if(typeof options === 'object' && !this.commandsPath) this.commandsPath = options.dirname;
		return this.registerCommands(commands, true);
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
	 * Registers a single argument type
	 * @param {ArgumentType|Function} type - Either an ArgumentType instance, or a constructor for one
	 * @return {FrameRegistry}
	 * @see {@link FrameRegistry#registerTypes}
	 */
	registerType(type) {
		/* eslint-disable new-cap */
		if(isConstructor(type, ArgumentType)) type = new type(this.client);
		else if(isConstructor(type.default, ArgumentType)) type = new type.default(this.client);
		/* eslint-enable new-cap */

		if(!(type instanceof ArgumentType)) throw new Error(`Invalid type object to register: ${type}`);

		// Make sure there aren't any conflicts
		if(this.types.has(type.id)) throw new Error(`An argument type with the ID "${type.id}" is already registered.`);

		// Add the type
		this.types.set(type.id, type);

		/**
		 * Emitted when an argument type is registered
		 * @event FrameClient#typeRegister
		 * @param {ArgumentType} type - Argument type that was registered
		 * @param {FrameRegistry} registry - Registry that the type was registered to
		 */
		this.client.emit('typeRegister', type, this);
		this.client.emit('debug', `Registered argument type ${type.id}.`);

		return this;
	}

	/**
	 * Registers multiple argument types
	 * @param {ArgumentType[]|Function[]} types - An array of ArgumentType instances or constructors
	 * @param {boolean} [ignoreInvalid=false] - Whether to skip over invalid objects without throwing an error
	 * @return {FrameRegistry}
	 */
	registerTypes(types, ignoreInvalid = false) {
		if(!Array.isArray(types)) throw new TypeError('Types must be an Array.');
		for(const type of types) {
			const valid = isConstructor(type, ArgumentType) || isConstructor(type.default, ArgumentType) ||
				type instanceof ArgumentType || type.default instanceof ArgumentType;
			if(ignoreInvalid && !valid) {
				this.client.emit('warn', `Attempting to register an invalid argument type object: ${type}; skipping.`);
				continue;
			}
			this.registerType(type);
		}
		return this;
	}

	/**
	 * Registers all argument types in a directory. The files must export an ArgumentType class constructor or instance.
	 * @param {string|RequireAllOptions} options - The path to the directory, or a require-all options object
	 * @return {FrameRegistry}
	 */
	registerTypesIn(options) {
		const obj = require('require-all')(options);
		const types = [];
		for(const type of Object.values(obj)) types.push(type);
		return this.registerTypes(types, true);
	}

  /**
	 * Registers the default argument types, groups, and commands. This is equivalent to:
	 * ```js
	 * registry.registerDefaultTypes()
	 * 	.registerDefaultGroups()
	 * 	.registerDefaultCommands();
	 * ```
	 * @return {FrameRegistry}
	 */
	registerDefaults() {
		this.registerDefaultTypes();
		this.registerDefaultGroups();
		this.registerDefaultCommands();
		return this;
	}

	/**
	 * Registers the default groups ("util" and "commands")
	 * @return {FrameRegistry}
	 */
	registerDefaultGroups() {
		return this.registerGroups([
			['commands', 'Commands', true],
			['util', 'Utility']
		]);
	}

	/**
	 * Registers the default commands to the registry
	 * @param {Object} [commands] - Object specifying which commands to register
	 * @param {boolean} [commands.help=true] - Whether to register the built-in help command
	 * (requires "util" group and "string" type)
	 * @param {boolean} [commands.prefix=true] - Whether to register the built-in prefix command
	 * (requires "util" group and "string" type)
	 * @param {boolean} [commands.eval=true] - Whether to register the built-in eval command
	 * (requires "util" group and "string" type)
	 * @param {boolean} [commands.ping=true] - Whether to register the built-in ping command (requires "util" group)
	 * @param {boolean} [commands.unknownCommand=true] - Whether to register the built-in unknown command
	 * (requires "util" group)
	 * @param {boolean} [commands.commandState=true] - Whether to register the built-in command state commands
	 * (enable, disable, load, unload, reload, list groups - requires "commands" group, "command" type, and "group" type)
	 * @return {FrameRegistry}
	 */
	registerDefaultCommands(commands = {}) {
		commands = Object.assign({}, {
			help: true,
			prefix: true,
			eval: true,
			ping: true,
			unknownCommand: true,
			commandState: true
		}, commands);

		if(commands.help) this.registerCommand(require('./commands/util/help'));
    /*
		if(commands.prefix) this.registerCommand(require('./commands/util/prefix'));
		if(commands.ping) this.registerCommand(require('./commands/util/ping'));
		if(commands.eval) this.registerCommand(require('./commands/util/eval'));
		if(commands.unknownCommand) this.registerCommand(require('./commands/util/unknown-command'));
		if(commands.commandState) {
			this.registerCommands([
				require('./commands/commands/groups'),
				require('./commands/commands/enable'),
				require('./commands/commands/disable'),
				require('./commands/commands/reload'),
				require('./commands/commands/load'),
				require('./commands/commands/unload')
			]);
		}
    */
		return this;
	}

	/**
	 * Registers the default argument types to the registry
	 * @param {Object} [types] - Object specifying which types to register
	 * @param {boolean} [types.string=true] - Whether to register the built-in string type
	 * @param {boolean} [types.integer=true] - Whether to register the built-in integer type
	 * @param {boolean} [types.float=true] - Whether to register the built-in float type
	 * @param {boolean} [types.boolean=true] - Whether to register the built-in boolean type
	 * @param {boolean} [types.user=true] - Whether to register the built-in user type
	 * @param {boolean} [types.member=true] - Whether to register the built-in member type
	 * @param {boolean} [types.role=true] - Whether to register the built-in role type
	 * @param {boolean} [types.channel=true] - Whether to register the built-in channel type
	 * @param {boolean} [types.textChannel=true] - Whether to register the built-in text-channel type
	 * @param {boolean} [types.voiceChannel=true] - Whether to register the built-in voice-channel type
	 * @param {boolean} [types.categoryChannel=true] - Whether to register the built-in category-channel type
	 * @param {boolean} [types.message=true] - Whether to register the built-in message type
	 * @param {boolean} [types.customEmoji=true] - Whether to register the built-in custom-emoji type
	 * @param {boolean} [types.defaultEmoji=true] - Whether to register the built-in default-emoji type
	 * @param {boolean} [types.command=true] - Whether to register the built-in command type
	 * @param {boolean} [types.group=true] - Whether to register the built-in group type
	 * @return {FrameRegistry}
	 */
	registerDefaultTypes(types = {}) {
		types = {
			string: true, integer: true, float: true, boolean: true,
			user: true, member: true, role: true, channel: true, textChannel: true,
			voiceChannel: true, categoryChannel: true, message: true, customEmoji: true,
			defaultEmoji: true, command: true, group: true, ...types
		};
		if(types.string) this.registerType(require('./types/string'));
		if(types.integer) this.registerType(require('./types/integer'));
		if(types.float) this.registerType(require('./types/float'));
		if(types.boolean) this.registerType(require('./types/boolean'));
		if(types.user) this.registerType(require('./types/user'));
		if(types.member) this.registerType(require('./types/member'));
		if(types.role) this.registerType(require('./types/role'));
		if(types.channel) this.registerType(require('./types/channel'));
		if(types.textChannel) this.registerType(require('./types/text-channel'));
		if(types.voiceChannel) this.registerType(require('./types/voice-channel'));
		if(types.categoryChannel) this.registerType(require('./types/category-channel'));
		if(types.message) this.registerType(require('./types/message'));
		if(types.customEmoji) this.registerType(require('./types/custom-emoji'));
		if(types.defaultEmoji) this.registerType(require('./types/default-emoji'));
		if(types.command) this.registerType(require('./types/command'));
		if(types.group) this.registerType(require('./types/group'));
		return this;
	}
}

module.exports = FrameRegistry;