/**
 * @external SQLiteStatement
 * @see {@link https://www.npmjs.com/package/sqlite}
 */

/**
 * @external SQLiteDatabase
 * @see {@link https://www.npmjs.com/package/sqlite}
 */

/**
 * Sets up a SQLite database to sotre guild settings
 */
class SQLiteProvider {
	/**
	 * @param {SQLiteDatabase} db - The SQLite database to use for storing settings
	 */
  constructor(db) {

		/**
		 * The database to be used for storing settings
		 * @type {SQLiteDatabase}
		 */
    this.db = db;

		/**
		 * The client that the provider is for (set automaticallyafter using {@link FrameClient#setProvider})
		 * @name SQLiteProvider#client
		 * @type {FrameClient}
		 * @readonly
		 */
    Object.defineProperty(this, 'client', {value: null, writable: true});

		/**
		 * Guild and global settings, cached for faster loading
		 * @type {Map}
		 * @private
		 */
    this.settings = new Map();

		/**
		 * Prepared statement to insert or replace a settings row
		 * @type {SQLiteStatement}
		 * @private
		 */
    this.insertOrReplaceStmt = null;

		/**
		 * Prepared statement to delete an entire settings row
		 * @type {SQLiteStatement}
		 * @private
		 */
    this.deleteStmt = null;
  }

	/**
	 * Initialises and prepares the database
	 * @param {FrameClient} client - The client to use for the provider
	 */
  async init(client) {
    this.client = client;
    await this.db.run('CREATE TABLE IF NOT EXISTS settings (guild INTEGER PRIMARY KEY, settings TEXT)');
    const rows = await this.db.all('SELECT CAST(guild as TEXT) as guild, settings FROM settings');
		for(const row of rows) {
			let settings;
			try {
				settings = JSON.parse(row.settings);
			} catch(err) {
				client.emit('warn', `SQLiteProvider couldn't parse the settings stored for guild ${row.guild}.`);
				continue;
			}

			const guild = row.guild !== '0' ? row.guild : 'global';
			this.settings.set(guild, settings);
		}
    const statements = await Promise.all([
			this.db.prepare('INSERT OR REPLACE INTO settings VALUES(?, ?)'),
			this.db.prepare('DELETE FROM settings WHERE guild = ?')
		]);
		this.insertOrReplaceStmt = statements[0];
		this.deleteStmt = statements[1];
  }

	/**
	 * Finishes up all current operations with the database and closes the connection
	 */
  async destroy() {
    await Promise.all([
			this.insertOrReplaceStmt.finalize(),
			this.deleteStmt.finalize()
		]);
  }

	/**
	 * Gets a guild's or global setting from cached memory
	 * @param {*} guild - The guild to get the settings for (or 'global')
	 * @param {String} key - The key to the setting
	 * @param {*} defVal - The default value to return if nothing is found
	 * @returns {*} - The value of the setting
	 */
  get(guild, key, defVal) {
		const settings = this.settings.get(this.getGuildID(guild));
		return settings ? typeof settings[key] !== 'undefined' ? settings[key] : defVal : defVal;
	}

	/**
	 * Sets or changes a setting of a guild or global
	 * @param {*} guild - The guild to set the settings for (or 'global')
	 * @param {String} key - The key to the setting
	 * @param {*} val - The value to set
	 * @returns {*} - The value of the setting after changing
	 */
	async set(guild, key, val) {
		guild = this.getGuildID(guild);
		let settings = this.settings.get(guild);
		if(!settings) {
			settings = {};
			this.settings.set(guild, settings);
		}

		settings[key] = val;
		await this.insertOrReplaceStmt.run(guild !== 'global' ? guild : 0, JSON.stringify(settings));
		if(guild === 'global') this.updateOtherShards(key, val);
		return val;
	}

	/**
	 * Completely removes a setting from cache and database
	 * @param {*} guild - The guild to delete the setting from
	 * @param {String} key - The key to the setting
	 * @returns {*} - The value of the setting before it was deleted
	 */
  async remove(guild, key) {
		guild = this.getGuildID(guild);
		const settings = this.settings.get(guild);
		if(!settings || typeof settings[key] === 'undefined') return undefined;

		const val = settings[key];
		settings[key] = undefined;
		await this.insertOrReplaceStmt.run(guild !== 'global' ? guild : 0, JSON.stringify(settings));
		if(guild === 'global') this.updateOtherShards(key, undefined);
		return val;
	}

	/**
	 * Clears all the setting for a guild
	 * @param {*} guild - The guild to delete all data from
	 */
	async clear(guild) {
		guild = this.getGuildID(guild);
		if(!this.settings.has(guild)) return;
		this.settings.delete(guild);
		await this.deleteStmt.run(guild !== 'global' ? guild : 0);
	}

	/**
	 * Changes a global setting on all shards
	 * @param {*} key - The key to the setting
	 * @param {*} val - The value to set
	 */
  updateOtherShards(key, val) {
		if(!this.client.shard) return;
		key = JSON.stringify(key);
		val = typeof val !== 'undefined' ? JSON.stringify(val) : 'undefined';
		this.client.shard.broadcastEval(`
			const ids = [${this.client.shard.ids.join(',')}];
			if(!this.shard.ids.some(id => ids.includes(id)) && this.provider && this.provider.settings) {
				let global = this.provider.settings.get('global');
				if(!global) {
					global = {};
					this.provider.settings.set('global', global);
				}
				global[${key}] = ${val};
			}
		`);
	}

	/**
	 * Gets the ID of a guild
	 * @param {String|Guild} guild - The guild to get the ID of
	 * @returns {String} - The ID of the guild
	 * @static
	 */
  static getGuildID(guild) {
		if(guild instanceof Guild) return guild.id;
		if(guild === 'global' || guild === null) return 'global';
		if(typeof guild === 'string' && !isNaN(guild)) return guild;
		throw new TypeError('Invalid guild specified. Must be a Guild instance, guild ID, "global", or null.');
	}
}

module.exports = SQLiteProvider;