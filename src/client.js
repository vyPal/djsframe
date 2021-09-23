import Discord from 'discord.js';
import FrameRegistry from './registry.js';
import FrameDispatcher from './dispatcher.js';
import SQLiteProvider from './providers/sqlite.js';

/**
 * Discord.js modified Client with a built-in command framework
 * @extends {Client}
 */
class FrameClient extends Discord.Client {
  /**
   * Options for the new FrameClient
   * @typedef {Object} FrameClientOptions
   * @property {string} [commandPrefix=!] - Default prefix for the commands
   */

  /**
   * @param {FrameClientOptions} options - The options for the new client
   */
  constructor(options = {}) {
    options = Object.assign({}, {
      prefix: '!'
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

  setProvider(provider) {
    if(!provider instanceof SQLiteProvider) throw new TypeError('provider must be of type SQLiteProvider');
    this.provider = provider;
    /**
     * When the provider for the client is changed
     * @event FrameClient#providerChange
     * @param {FrameClient} client - The client that the provider was changed for
     * @param {SQLiteProvider} provider - The newly set provider
     */
    this.emit('providerChange', this, provider);
    this.provider.init(this);
    return this;
  }

  async login(token) {
    super.login(token);
    this.on('messageCreate', this.dispatcher.handleMessage);
    if(this.provider) this.provider.init(this);
  }
}

export default FrameClient;