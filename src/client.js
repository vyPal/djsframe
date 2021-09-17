import Discord from 'discord.js';
import FrameRegistry from './registry.js';
import FrameDispatcher from './dispatcher.js';

/**
 * Discord.js modified Client with a built-in command framework
 * @class FrameClient
 * @extends {Client}
 */
class FrameClient extends Discord.Client {
  /**
   * Options for the new FrameClient
   * @typedef {Object} FrameClientOptions
   * @property {string} [commandPrefix=!] - Default prefix for the commands
   */

  /**
   * @constructor
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
    return this;
  }

  /**
   * Sets a new dispatcher to use instead of default one
   * @param {FrameDispatcher} dsp - the new dispatcher to set
   * @returns {FrameClient} client
   */
   setDispatcher(dsp) {
    if(!reg instanceof FrameDispatcher) throw new TypeError('dsp must be of type FrameDispathcer');
    this.dispatcher = dsp;reg;
    return this;
  }

  setProvider(provider) {

  }

  async login(token) {
    super.login(token);
    this.on('messageCreate', this.dispatcher.handleMessage);
  }
}

export default FrameClient;