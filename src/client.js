const Discord = require('discord.js');
const FrameRegistry = require('./registry.js');
const FrameDispatcher = require('./dispatcher.js');
const SQLiteProvider = require('./providers/sqlite.js');

/**
 * Discord.js modified Client with a built-in command framework
 * @extends {Client}
 */
class FrameClient extends Discord.Client {
  /**
   * Options for the new FrameClient
   * @typedef {Object} FrameClientOptions
   * @property {string} [commandPrefix=!] - Default prefix for the commands
   * @property {Array<String>} owners - An array of the bot's owners
   */

  /**
   * @param {FrameClientOptions} options - The options for the new client
   */
  constructor(options = {}) {
    options = Object.assign({}, {
      prefix: '!',
      owners: [],
      intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES]
    }, options);
    super(options);
    
    /**
     * Registry to use for storing groups, command sand their data
     * @type {FrameRegistry}
     */
    this.registry = new FrameRegistry(this);

    /**
     * Dispatcher to use for handling commands
     * @type {FrameDispatcher}
     */
    this.dispatcher = new FrameDispatcher(this, this.registry);

    /**
     * The database provider to use for storing settings
     * @type {SQLiteProvider}
     */
    this.provider = null;
  }

  /**
   * Sets a new registry to use instead of default one
   * @param {FrameRegistry} reg - the new registry to set
   * @returns {FrameClient} client
   */
  setRegistry(reg) {
    if(!reg instanceof FrameRegistry) throw new TypeError('reg must be of type FrameRegistry');
    this.registry = reg;
    /**
     * When the registry for the client is changed
     * @event FrameClient#registryChange
     * @param {FrameClient} client - The client that the registry was changed for
     * @param {FrameRegistry} registry - The newly set registry
     */
    this.emit('registryChange', this, reg);
    return this;
  }

  /**
   * Sets a new dispatcher to use instead of default one
   * @param {FrameDispatcher} dsp - the new dispatcher to set
   * @returns {FrameClient} client
   */
   setDispatcher(dsp) {
    if(!reg instanceof FrameDispatcher) throw new TypeError('dsp must be of type FrameDispathcer');
    this.dispatcher = dsp;

    /**
     * When the dispatcher for the client is changed
     * @event FrameClient#dispatcherChange
     * @param {FrameClient} client - The client that the dispatcher was changed for
     * @param {FrameDispatcher} dispatcher - The newly set dispatcher
     */
    this.emit('dispatcherChange', this, dsp);
    return this;
  }

  /**
   * Sets a new database provider to use for storing settings
   * @param {SQLiteProvider} provider - The new provider to set
   * @returns {FrameClient} client
   */
  async setProvider(provider) {
    if(!provider instanceof SQLiteProvider) throw new TypeError('provider must be of type SQLiteProvider');
    await provider.init(this);
    this.provider = provider;
    /**
     * When the provider for the client is changed
     * @event FrameClient#providerChange
     * @param {FrameClient} client - The client that the provider was changed for
     * @param {SQLiteProvider} provider - The newly set provider
     */
     this.emit('providerChange', this, provider);
    return this;
  }

  /**
   * Function to check if a user is one of the owners of the bot
   * @param {User|Snowflake|Message|GuildMember} user - The user to check if he is an owner of the bot
   * @returns {Boolean} - True if the user is a owner of the bot
   */
  isOwner(user) {
    return this.options.owners.has(this.users.resolve(user).id);
  }

  async login(token) {
    super.login(token);
    this.on('messageCreate', this.dispatcher.handleMessage);
    this.on('messageUpdate', this.dispatcher.handleMessage);
    if(this.provider) this.provider.init(this);
  }
}

module.exports = FrameClient;