# First command
> Here is a very simplified tutorial on creating your first command with the framework. If you want a more detailed version, check out the [Guide](https://vypal.gitbook.io/djsframe)

So, DJSFrame is primarily a command framework, which means that it has a lot of functions that make creating commands easier, and faster. Make shure that oyu have your bot setup, just like in the [First steps](https://djsframe.js.org/#/docs/main/main/general/first-steps) page.

We will start by creating a demo command. It will belong to the Utility group (which is registered by default), and will be owner-only (Noone can run the command, except the bot's owner). Create a folder, and name it `commands`, inside it, create another folder and name it `util`. Inside that folder, create a file, that we will name `demo.js`. Open the file up, and paste this code into it:
```javascript
const { Command } = require('djsframe'); // Gets the Command class from DJSFrame

module.exports = class DemoCommand extends Command { // Creates a new class and names it DemoCommand
  constructor(client) {
    super(client, {
      name: 'demo', // Sets the name of the command to demo (must be lowercase, no spaces alowed)
      aliases: ['d'], // Creates a shortcut for the command
      group: 'util', // Sets the group of the command (must be equal to the group ID, NOT the name)
      memberName: 'Demo', // Sets the name to use in the settings menu (can be any case, and supports spaces)
      description: 'Just a demo command', // Sets a description of the command to use in the help command
      ownerOnly: true // Sets the command to be available only to the owner/s of the bot
    })
  }

  run(message, args) { // Sets up the function to run when the command is executed
    message.reply('Yup, this command works now!'); // Replies to the message author
  }
}
```
And that is basically it. Save the code, restart your bot, and in any server with the bot in it, type your prefix (default is !) and the command `!demo`, or it's shortcut `!d`. Check the docs, or guide for more options, and functions!