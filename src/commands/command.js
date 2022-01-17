const path = require('path');
const { escapeMarkdown } = require('discord.js');
const { oneLine, stripIndents } = require('common-tags');
const ArgumentCollector = require('./collector');
const { permissions } = require('../util');

/**
 * Class for creating a new command
 */
class FrameCommand {
  /**
   * The information about the command
   * @typedef {Object} CommandInfo
   * @property {String} name - The name of the command (only lower-case)
   * @property {Array<String>} [aliases=[]] - The aliases for the command
   * @property {boolean} [autoAliases=true] - Whether automatic aliases should be added
   * @property {String} group - The group for the command
   * @property {String} memberName - The display name of the command (can include special characters)
   * @property {String} description - The description of the command
   * @property {String} [details=""] - A detailed description of the command
   * @property {Array<String>} [examples=[]] - A list of examples for the command
   * @property {Array<String>} [clientPermissions=[]] - A list of permissions that the client has to have
   * @property {Array<String>} [userPermissions=[]] - A list of permissions that the user has to have
   * @property {Boolean} [ownerOnly=false] - Whether the command should be restricted to the bot owner
   * @property {boolean} [guildOnly=false] - Whether or not the command should only function in a guild channel
   * @property {boolean} [nsfw=false] - Whether the command is usable only in NSFW channels.
   * @property {ThrottlingOptions} [throttling] - Options for throttling usages of the command.
   * @property {boolean} [defaultHandling=true] - Whether or not the default command handling should be used.
	 * If false, then only patterns will trigger the command.
   * @property {ArgumentInfo[]} [args] - Arguments for the command.
   * @property {number} [argsCount=0] - The number of arguments to parse from the command string.
	 * Only applicable when argsType is 'multiple'. If nonzero, it should be at least 2.
	 * When this is 0, the command argument string will be split into as many arguments as it can be.
	 * When nonzero, it will be split into a maximum of this number of arguments.
   * @property {string} [argsType=single] - One of 'single' or 'multiple'. Only applicable if `args` is not specified.
	 * When 'single', the entire argument string will be passed to run as one argument.
	 * When 'multiple', it will be passed as multiple arguments.
   * @property {boolean} [argsSingleQuotes=true] - Whether or not single quotes should be allowed to box-in arguments
	 * in the command string.
   * @property {RegExp[]} [patterns] - Patterns to use for triggering the command
	 * @property {boolean} [guarded=false] - Whether the command should be protected from disabling
	 * @property {boolean} [hidden=false] - Whether the command should be hidden from the help command
	 * @property {boolean} [unknown=false] - Whether the command should be run when an unknown command is used - there
	 * may only be one command registered with this property as `true`.
   */

  /**
   * Creates the command instance
   * @param {FrameClient} client - The client to bind the command to
   * @param {CommandInfo} info - The info about the command
   */
  constructor(client, info) {
    this.validateInfo(client, info);

    /**
     * The client to be used for this command
     * @name FrameCommand#client
     * @type {FrameClient}
     * @readonly
     */
    Object.defineProperty(this, 'client', {value: client});

    /**
     * The command's information
     * @name FrameCommand#info
     * @type {CommandInfo}
     * @readonly
     */
    Object.defineProperty(this, 'info', {value: info});

    /**
     * The command name
     * @type {String}
     * @readonly
     */
    this.name = info.name;

    /**
     * The command aliases
     * @type {Array<String>}
     * @readonly
     * @default []
     */
    this.aliases = info.aliases || [];

    /**
     * The command group
     * @type {String}
     * @readonly
     */
    this.group = info.group;

    /**
     * The command memberName (the name that is shown for example in the help menu)
     * @type {String}
     * @readonly
     */
    this.memberName = info.memberName;

    /**
     * The command description
     * @type {String}
     * @readonly
     */
    this.description = info.description;

    /**
     * The command details (detailed description displayed in the help menu)
     * @type {String}
     * @readonly
     * @default ''
     */
    this.details = info.details || '';

    /**
     * The command examples (examples of how to use the command)
     * @type {Array<String>}
     * @readonly
     * @default []
     */
    this.examples = info.examples || [];

    /**
		 * Whether the command can only be run in a guild channel
		 * @type {boolean}
		 */
		this.guildOnly = Boolean(info.guildOnly);

		/**
		 * Whether the command can only be used by an owner
		 * @type {boolean}
		 */
		this.ownerOnly = Boolean(info.ownerOnly);

    /**
		 * Permissions required by the client to use the command.
		 * @type {?Array<String>}
		 */
		this.clientPermissions = info.clientPermissions || null;

		/**
		 * Permissions required by the user to use the command.
		 * @type {?Array<String>}
		 */
		this.userPermissions = info.userPermissions || null;

    /**
		 * Whether the command can only be used in NSFW channels
		 * @type {boolean}
		 */
		this.nsfw = Boolean(info.nsfw);

    /**
		 * Whether the default command handling is enabled for the command
		 * @type {boolean}
		 */
		this.defaultHandling = 'defaultHandling' in info ? info.defaultHandling : true;

		/**
		 * Options for throttling command usages
		 * @type {?ThrottlingOptions}
		 */
		this.throttling = info.throttling || null;

    /**
		 * The argument collector for the command
		 * @type {?ArgumentCollector}
		 */
		this.argsCollector = info.args && info.args.length ?
    new ArgumentCollector(client, info.args, info.argsPromptLimit) :
    null;
    if(this.argsCollector && typeof info.format === 'undefined') {
      this.format = this.argsCollector.args.reduce((prev, arg) => {
        const wrapL = arg.default !== null ? '[' : '<';
        const wrapR = arg.default !== null ? ']' : '>';
        return `${prev}${prev ? ' ' : ''}${wrapL}${arg.label}${arg.infinite ? '...' : ''}${wrapR}`;
      }, '');
    }

    /**
		 * How the arguments are split when passed to the command's run method
		 * @type {string}
		 */
		this.argsType = info.argsType || 'single';

    /**
		 * Maximum number of arguments that will be split
		 * @type {number}
		 */
		this.argsCount = info.argsCount || 0;

		/**
		 * Whether single quotes are allowed to encapsulate an argument
		 * @type {boolean}
		 */
		this.argsSingleQuotes = 'argsSingleQuotes' in info ? info.argsSingleQuotes : true;

		/**
		 * Regular expression triggers
		 * @type {RegExp[]}
		 */
		this.patterns = info.patterns || null;

		/**
		 * Whether the command is protected from being disabled
		 * @type {boolean}
		 */
		this.guarded = Boolean(info.guarded);

		/**
		 * Whether the command should be hidden from the help command
		 * @type {boolean}
		 */
		this.hidden = Boolean(info.hidden);

		/**
		 * Whether the command will be run when an unknown command is used
		 * @type {boolean}
		 */
		this.unknown = Boolean(info.unknown);

		/**
		 * Whether the command is enabled globally
		 * @type {boolean}
		 * @private
		 */
		this._globalEnabled = true;

		/**
		 * Current throttle objects for the command, mapped by user ID
		 * @type {Map<string, Object>}
		 * @private
		 */
		this._throttles = new Map();
  }

  /**
	 * Checks whether the user has permission to use the command
	 * @param {Message} message - The triggering command message
	 * @param {boolean} [ownerOverride=true] - Whether the bot owner(s) will always have permission
	 * @return {boolean|string} Whether the user has permission, or an error message to respond with if they don't
	 */
	hasPermission(message, ownerOverride = true) {
		if(!this.ownerOnly && !this.userPermissions) return true;
		if(ownerOverride && this.client.isOwner(message.author)) return true;

		if(this.ownerOnly && (ownerOverride || !this.client.isOwner(message.author))) {
			return `The \`${this.name}\` command can only be used by the bot owner.`;
		}

		if(message.channel.type === 'text' && this.userPermissions) {
			const missing = message.channel.permissionsFor(message.author).missing(this.userPermissions);
			if(missing.length > 0) {
				if(missing.length === 1) {
					return `The \`${this.name}\` command requires you to have the "${permissions[missing[0]]}" permission.`;
				}
				return oneLine`
					The \`${this.name}\` command requires you to have the following permissions:
					${missing.map(perm => permissions[perm]).join(', ')}
				`;
			}
		}

		return true;
	}

  /**
	 * Called when the command is prevented from running
	 * @param {Message} message - Command message that the command is running from
	 * @param {string} reason - Reason that the command was blocked
	 * (built-in reasons are `guildOnly`, `nsfw`, `permission`, `throttling`, and `clientPermissions`)
	 * @param {Object} [data] - Additional data associated with the block. Built-in reason data properties:
	 * - guildOnly: none
	 * - nsfw: none
	 * - permission: `response` ({@link string}) to send
	 * - throttling: `throttle` ({@link Object}), `remaining` ({@link number}) time in seconds
	 * - clientPermissions: `missing` ({@link Array}<{@link string}>) permission names
	 * @returns {Promise<?Message|?Array<Message>>}
	 */
	onBlock(message, reason, data) {
		switch(reason) {
			case 'guildOnly':
				return message.reply(`The \`${this.name}\` command must be used in a server channel.`);
			case 'nsfw':
				return message.reply(`The \`${this.name}\` command can only be used in NSFW channels.`);
			case 'permission': {
				if(data.response) return message.reply(data.response);
				return message.reply(`You do not have permission to use the \`${this.name}\` command.`);
			}
			case 'clientPermissions': {
				if(data.missing.length === 1) {
					return message.reply(
						`I need the "${permissions[data.missing[0]]}" permission for the \`${this.name}\` command to work.`
					);
				}
				return message.reply(oneLine`
					I need the following permissions for the \`${this.name}\` command to work:
					${data.missing.map(perm => permissions[perm]).join(', ')}
				`);
			}
			case 'throttling': {
				return message.reply(
					`You may not use the \`${this.name}\` command again for another ${data.remaining.toFixed(1)} seconds.`
				);
			}
			default:
				return null;
		}
	}

	/**
	 * Called when the command produces an error while running
	 * @param {Error} err - Error that was thrown
	 * @param {Message} message - Command message that the command is running from (see {@link Command#run})
	 * @param {Object|string|string[]} args - Arguments for the command (see {@link Command#run})
	 * @param {boolean} fromPattern - Whether the args are pattern matches (see {@link Command#run})
	 * @param {?ArgumentCollectorResult} result - Result from obtaining the arguments from the collector
	 * (if applicable - see {@link Command#run})
	 * @returns {Promise<?Message|?Array<Message>>}
	 */
	onError(err, message, args, fromPattern, result) { // eslint-disable-line no-unused-vars
		const owners = this.client.owners;
		const ownerList = owners ? owners.map((usr, i) => {
			const or = i === owners.length - 1 && owners.length > 1 ? 'or ' : '';
			return `${or}${escapeMarkdown(usr.username)}#${usr.discriminator}`;
		}).join(owners.length > 2 ? ', ' : ' ') : '';

		const invite = this.client.options.invite;
		return message.reply(stripIndents`
			An error occurred while running the command: \`${err.name}: ${err.message}\`
			You shouldn't ever receive an error like this.
			Please contact ${ownerList || 'the bot owner'}${invite ? ` in this server: ${invite}` : '.'}
		`);
	}

	/**
	 * Creates/obtains the throttle object for a user, if necessary (owners are excluded)
	 * @param {string} userID - ID of the user to throttle for
	 * @return {?Object}
	 * @protected
	 */
	throttle(userID) {
		if(!this.throttling || this.client.isOwner(userID)) return null;

		let throttle = this._throttles.get(userID);
		if(!throttle) {
			throttle = {
				start: Date.now(),
				usages: 0,
				timeout: this.client.setTimeout(() => {
					this._throttles.delete(userID);
				}, this.throttling.duration * 1000)
			};
			this._throttles.set(userID, throttle);
		}

		return throttle;
	}

	/**
	 * Enables or disables the command in a guild
	 * @param {?GuildResolvable} guild - Guild to enable/disable the command in
	 * @param {boolean} enabled - Whether the command should be enabled or disabled
	 */
	setEnabledIn(guild, enabled) {
		if(typeof guild === 'undefined') throw new TypeError('Guild must not be undefined.');
		if(typeof enabled === 'undefined') throw new TypeError('Enabled must not be undefined.');
		if(this.guarded) throw new Error('The command is guarded.');
		if(!guild) {
			this._globalEnabled = enabled;
			this.client.emit('commandStatusChange', null, this, enabled);
			return;
		}
		guild = this.client.guilds.resolve(guild);
		guild.setCommandEnabled(this, enabled);
	}

	/**
	 * Checks if the command is enabled in a guild
	 * @param {?GuildResolvable} guild - Guild to check in
	 * @param {boolean} [bypassGroup] - Whether to bypass checking the group's status
	 * @return {boolean}
	 */
	isEnabledIn(guild, bypassGroup) {
		if(this.guarded) return true;
		if(!guild) return (bypassGroup || this.group._globalEnabled) && this._globalEnabled;
		guild = this.client.guilds.resolve(guild);
		return (bypassGroup || guild.isGroupEnabled(this.group)) && guild.isCommandEnabled(this);
	}

	/**
	 * Checks if the command is usable for a message
	 * @param {?Message} message - The message
	 * @return {boolean}
	 */
	isUsable(message = null) {
		if(!message) return this._globalEnabled;
		if(this.guildOnly && message && !message.guild) return false;
		const hasPermission = this.hasPermission(message);
		return this.isEnabledIn(message.guild) && hasPermission && typeof hasPermission !== 'string';
	}

	/**
	 * Creates a usage string for the command
	 * @param {string} [argString] - A string of arguments for the command
	 * @param {string} [prefix=this.client.commandPrefix] - Prefix to use for the prefixed command format
	 * @param {User} [user=this.client.user] - User to use for the mention command format
	 * @return {string}
	 */
	usage(argString, prefix = this.client.commandPrefix, user = this.client.user) {
		return this.constructor.usage(`${this.name}${argString ? ` ${argString}` : ''}`, prefix, user);
	}

	/**
	 * Reloads the command
	 */
	reload() {
		let cmdPath, cached, newCmd;
		try {
			cmdPath = this.client.registry.resolveCommandPath(this.groupID, this.memberName);
			cached = require.cache[cmdPath];
			delete require.cache[cmdPath];
			newCmd = require(cmdPath);
		} catch(err) {
			if(cached) require.cache[cmdPath] = cached;
			try {
				cmdPath = path.join(__dirname, this.groupID, `${this.memberName}.js`);
				cached = require.cache[cmdPath];
				delete require.cache[cmdPath];
				newCmd = require(cmdPath);
			} catch(err2) {
				if(cached) require.cache[cmdPath] = cached;
				if(err2.message.includes('Cannot find module')) throw err; else throw err2;
			}
		}

		this.client.registry.reregisterCommand(newCmd, this);
	}

	/**
	 * Unloads the command
	 */
	unload() {
		const cmdPath = this.client.registry.resolveCommandPath(this.groupID, this.memberName);
		if(!require.cache[cmdPath]) throw new Error('Command cannot be unloaded.');
		delete require.cache[cmdPath];
		this.client.registry.unregisterCommand(this);
	}

	/**
	 * Creates a usage string for a command
	 * @param {string} command - A command + arg string
	 * @param {string} [prefix] - Prefix to use for the prefixed command format
	 * @param {User} [user] - User to use for the mention command format
	 * @return {string}
	 */
	static usage(command, prefix = null, user = null) {
		const nbcmd = command.replace(/ /g, '\xa0');
		if(!prefix && !user) return `\`${nbcmd}\``;

		let prefixPart;
		if(prefix) {
			if(prefix.length > 1 && !prefix.endsWith(' ')) prefix += ' ';
			prefix = prefix.replace(/ /g, '\xa0');
			prefixPart = `\`${prefix}${nbcmd}\``;
		}

		let mentionPart;
		if(user) mentionPart = `\`@${user.username.replace(/ /g, '\xa0')}#${user.discriminator}\xa0${nbcmd}\``;

		return `${prefixPart || ''}${prefix && user ? ' or ' : ''}${mentionPart || ''}`;
	}

  /**
   * Validates the provided client and info to check for any errors
   * @param {FrameClient} client - The client that the command was created with
   * @param {CommandInfo} info - The info to validate
   */
  validateInfo(client, info) {
    if(!client) throw new Error('A client must be defined');
    if(typeof info !== 'object') throw new Error('Command info must be specified');
    if(typeof info.name !== 'string') throw new Error('Command name must be a string');
    if(info.name !== info.name.toLowerCase()) throw new Error('Command name must be lower case');
    if(info.aliases && (!Array.isArray(info.aliases) || info.aliases.some(ali => typeof ali !== 'string'))) throw new Error('Command aliases must be an Array of strings');
    if(!info.group) throw new Error('A Command group must be specified');
    if(info.group !== info.group.toLowerCase()) throw new Error('Command group must be lower case');
    if(!client.registry.groups.has(info.group)) throw new Error('The specified group id does not exist');
    if(!info.memberName) throw new Error('A Command memberName must be specified');
    if(typeof info.memberName !== 'string') throw new Error('Command memberName must be a string');
    if(!info.description || typeof info.description !== 'string') throw new Error('A Command description must be specified');
    if(typeof info.description !== 'string') throw new Error('Command description must be a string');
    if(info.details && typeof info.details !== 'string') throw new Error('Command details must be a string');
    if(info.examples && (!Array.isArray(info.examples) || info.examples.some(ex => typeof ex !== 'string'))) throw new Error('Command examples must be an Array of strings');
    if(info.clientPermissions) {
			if(!Array.isArray(info.clientPermissions)) {
				throw new TypeError('Command clientPermissions must be an Array of permission key strings.');
			}
			for(const perm of info.clientPermissions) {
				if(!permissions[perm]) throw new RangeError(`Invalid command clientPermission: ${perm}`);
			}
		}
		if(info.userPermissions) {
			if(!Array.isArray(info.userPermissions)) {
				throw new TypeError('Command userPermissions must be an Array of permission key strings.');
			}
			for(const perm of info.userPermissions) {
				if(!permissions[perm]) throw new RangeError(`Invalid command userPermission: ${perm}`);
			}
		}
    if(info.throttling) {
			if(typeof info.throttling !== 'object') throw new TypeError('Command throttling must be an Object.');
			if(typeof info.throttling.usages !== 'number' || isNaN(info.throttling.usages)) {
				throw new TypeError('Command throttling usages must be a number.');
			}
			if(info.throttling.usages < 1) throw new RangeError('Command throttling usages must be at least 1.');
			if(typeof info.throttling.duration !== 'number' || isNaN(info.throttling.duration)) {
				throw new TypeError('Command throttling duration must be a number.');
			}
			if(info.throttling.duration < 1) throw new RangeError('Command throttling duration must be at least 1.');
		}
		if(info.args && !Array.isArray(info.args)) throw new TypeError('Command args must be an Array.');
		if('argsPromptLimit' in info && typeof info.argsPromptLimit !== 'number') {
			throw new TypeError('Command argsPromptLimit must be a number.');
		}
		if('argsPromptLimit' in info && info.argsPromptLimit < 0) {
			throw new RangeError('Command argsPromptLimit must be at least 0.');
		}
		if(info.argsType && !['single', 'multiple'].includes(info.argsType)) {
			throw new RangeError('Command argsType must be one of "single" or "multiple".');
		}
		if(info.argsType === 'multiple' && info.argsCount && info.argsCount < 2) {
			throw new RangeError('Command argsCount must be at least 2.');
		}
		if(info.patterns && (!Array.isArray(info.patterns) || info.patterns.some(pat => !(pat instanceof RegExp)))) {
			throw new TypeError('Command patterns must be an Array of regular expressions.');
		}
  }

  /**
   * Runs the command
   * @param {Message} message - The message object which was received from discord
   * @param {Object} args - The command's arguments
   * @abstract
   */
  async run(message, args) {
    this.client.emit('warn', 'This command has no run method: ' + this.name);
  }

  /**
   * Runs a command from a slash command
   * @param {Interaction} interaction - The interaction that was received from discord
   * @param {Object} args - The command's arguments
   * @abstract
   */
  async runSlash(interaction, args) {
    this.client.emit('warn', 'This command has no runSlash method: ' + this.name);
  }

  /**
   * Runs when a button is clicked
   * @param {Interaction} interaction - The button interaction received from discord
   * @abstract
   */
  async button(interaction) {
    this.client.emit('warn', 'This command has no button method: ' + this.name);
  }
}

module.exports = FrameCommand;