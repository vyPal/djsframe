# First steps
> Here is a very simplified tutorial on getting started with the framework. If you want a more detailed version, check out the [Guide](https://vypal.gitbook.io/djsframe)

So just like with commando, first you will want to ensure, that instead of a regular Discord.js [Client](https://discord.js.org/#/docs/main/master/class/Client) you use the modified [CommandoClient](https://djsframe.js.org/#/docs/cmain/main/class/FrameClient). This is basically an extension of the default client, that adds all the functionality that the framework has to offer.

When creating the moified client, be sure to add a owner array to the options. This should be an Array containing the user IDs of the owners as a string. It is required to enter this, so that you can control your bot.

```javascript
const Frame = require('djsframe'); // Using Frame instead of DJSFrame, you can use the full name if you want to

const client = new Frame.Client({
  owner: ['1234567890'] // Change this to your user's ID
});
```

Next we want to initialize the command framework, this is what will be handeling your incoming commands, user's permission to run the command, and so on.

```javascript
const path = require('path');

client.registry
  // Registers the groups: 'Music commands' and 'Moderation commands' and sets their IDs to 'music' and 'moderation'
  .registerGroups([
    ['music', 'Music commands'],
    ['moderation', 'Moderation commands']
  ])

  // Registers the default commands, groups, and argument types
  .registerDefaults()

  // Reads through all your command files in the 'commands' folder
  .registerCommandsIn(path.join(__dirname, 'commands'));
```

Just like commando, DJSFrame also has a settings provider, that uses SQLite (More database types coming soon!) I would highly recomend, that you set one up, but it is not a necessary step. To do it, you will have to install 2 NPM packages, `sqlite`, and `sqlite3` (Both are required) `npm install --save sqlite sqlite3`. After you've done that, you can setup the database like this:
```javascript
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');

sqlite.open({ filename: 'database.db', driver: sqlite3.Database }).then(db => {
    client.setProvider(new SQLiteProvider(db));
});
```

And yes, you are almost at the end, the last step is loging in to your bot. Do it just like you would in any other Discord.js bot:
```javascript
client.login('paste your token here');
```