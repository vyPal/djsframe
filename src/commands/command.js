/**
 * Class for creating a new command
 */
class FrameCommand {
  /**
   * The information about the command
   * @typedef {Object} CommandInfo
   * @property {String} name - The name of the command (only lower-case)
   * @property {Array<String>} [aliases=[]] - The aliases for the command
   * @property {String} group - The group for the command
   * @property {String} memberName - The display name of the command (can include special characters)
   * @property {String} description - The description of the command
   * @property {String} [details=""] - A detailed description of the command
   * @property {Array<String>} [examples=[]] - A list of examples for the command
   * @property {Array<String>} [clientPermissions=[]] - A list of permissions that the client has to have
   * @property {Array<String>} [userPermissions=[]] - A list of permissions that the user has to have
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

export default FrameCommand;