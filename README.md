# LegBot : The LEGO Discord bot

<!-- > Yes, hybdid html markdown, sorry :( <--->

<table style="width:100%;" align="center">
<td style="width:49%">
<img height="100" src="./readme.assets/legbot.png" alt="Logo">
</td>
<td style="width:49%">
<img src="https://discordbots.org/api/widget/status/666184693531672608.svg" alt="Status">
</td>
</div>

</table>

This LEGO Discord bot is used to show general informations about LEGO sets and parts in chat.

## Commands :
- `!# or !set [SET NUMBER]` to have general usefull infos about a specific set
<p align="center">
	<img width="460" src="./readme.assets/set-example.png" alt="Parts Example">

</p>

- `!part [PART ID]` to have informations about a piece (Bricklink id)
<p align="center">
	<img width="460" src="./readme.assets/part-example.png" alt="Parts Example"> <br> Green for pieces still produced, orange otherwise
</p>

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


## Installation :
- Clone this repo
- Delete README.md and the readme.assets directory (optionnal)
- Run `npm install`
- Set your own api keys and tokens in a fresh `config.json` based on `config.example.json`
  - The `trigger` conf is the "how" you speaks to the bot. Default :  `!`
- Run `node app.js`
  - You can also use [always](https://www.npmjs.com/package/always) or [nodemon](https://nodemon.io/)
- Enjoy


<p align="center">
	<a href="https://discordapp.com/oauth2/authorize?client_id=666184693531672608&scope=bot&permissions=0">
	<img src="./readme.assets/invitebutton.png" alt="Invite me !"> </a>
</p>

## Support and contact
[Twitter](https://twitter.com/thibaut_plg)