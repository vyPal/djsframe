# Built-in commands
Just like in commando, DJSFrame has a couple commands built right in to the framework, so that you can get into the more important stuff

## Utility (util)
### help (util:help)
If the user does not specify any arguments, the command will give a list of all the commands that he can use (based on his permissions, enabled commands, ...). If he passes the `all` argument, all the bot's commands will be listed except for those, that have `hidden: true` in the command's info. If anything else is passed, DJSFrame will try to find a command or group, that matches the argument.