# LegBot : The LEGO Discord bot

[![Discord Bots](https://discordbots.org/api/widget/status/666184693531672608.svg)](https://discordbots.org/bot/666184693531672608)

This LEGO Discord bot is used to show general informations about LEGO sets and parts in chat.

## Installation :
- Clone this repo
- Delete README.md and the readme.assets directory (optionnal)
- Run `npm install`
- Set your own api keys and tokens in a fresh `config.json` based on `config.example.json`
  - The `trigger` conf is the "how" you speaks to the bot. Default :  `!`
- Run `node app.js`
  - You can also use [always](https://www.npmjs.com/package/always) or [nodemon](https://nodemon.io/)
- Enjoy

## Commands :
- `!# or !set [SET NUMBER]`  to have general usefull infos about a specific set
- `!part [PART ID]`  to have informations about a piece (Bricklink id)
- `!bs [SET NUMBER]`  to show a link to Brickset about the provided set number
- `!bl [SET NUMBER]`  to show a BrickLink link to the searched set number
- `!review [SET NUMBER]`  to have infos about the requested set (rating, reviews...)
- `!help`  to display this message... Not that useful if you're reading this tho.
- `!credits`  to show dev credits";

## Credits :
- Rebrickable API : https://rebrickable.com/api/
- Brick Insight public API : https://brickinsights.com/
- Brickset links : https://brickset.com
- BrickLink links : https://www.bricklink
- BrickOwl links : https://www.brickowl.com

This bot is based on the [discord.js](https://discord.js.org/) library.



[![Invite me !](./readme.assets/invitebutton.png)](https://discordapp.com/oauth2/authorize?client_id=666184693531672608&scope=bot&permissions=0)

[Twitter](https://twitter.com/thibaut_plg)