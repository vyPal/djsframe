/**
 * Class for storing info about a group as an object
 */
class FrameGroup {
  /**
   * Creates a new group
   * @param {FrameClient} client - The client to be used for this group
   * @param {String} id - The id of the group (must be lowercase)
   * @param {String} name - The name of the group
   */
  constructor(client, id, name) {
    if(!client) throw new Error('A client must be specified.');
		if(typeof id !== 'string') throw new TypeError('Group ID must be a string.');
		if(id !== id.toLowerCase()) throw new Error('Group ID must be lowercase.');

    /**
     * The client that the group belongs to
     * @type {FrameClient}
     * @readonly
     */
    Object.defineProperty(this, 'client', { value: client });

    /**
     * The id of the group
     * @type {String}
     * @readonly
     */
    this.id = id;

    /**
     * The name of the group
     * @type {String}
     * @readonly
     */
    this.name = name || id;
  }
}

module.exports = FrameGroup;