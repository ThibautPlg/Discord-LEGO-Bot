# LegBot : The LEGO Discord bot

![npm](https://img.shields.io/npm/v/discord.js?label=discord.js&style=flat-square)
![nodejs](https://img.shields.io/badge/nodejs-16.x-brightgreen?style=flat-square&logo=Node.js)

<!-- > Yes, hybdid html markdown, sorry :( <--->

<p align="center">
<img height="100" src="https://github.com/ThibautPlg/Discord-LEGO-Bot/raw/master/readme.assets/legBot.png" alt="Logo">
</p>

This LEGO Discord bot is used to show general informations about LEGO sets and parts in chat.

[Website](https://thibautplg.github.io/legbot/)
<hr>

<p align="center">
<img width="460" src="https://github.com/ThibautPlg/Discord-LEGO-Bot/raw/master/readme.assets/100servs.png" alt="100 servers">
<strike>

Since July 2020, LegBot has been invited to more than 100 servers ! Thank you everyone ! I hope the bot is doing right for your queries, do not forget to contact me on twitter if something goes wrong or is missing !</strike>

<strike>As of February 2021 LegBot is on more than 300 servers ! This is insane !
March 2021 : 400 ! I'll consider adding a tag instead of editing this file.</strike> September 2021 : almost 600 !
Thanks you everyone !
</p>
<hr>

## Commands :
[All commands are listed on Legbot's website.](https://thibautplg.github.io/legbot/)

- `!set [SET NUMBER]` to have general useful infos about a specific set
<p align="center">
	<img width="460" src="https://github.com/ThibautPlg/Discord-LEGO-Bot/raw/master/readme.assets/set-example.bmp" alt="Parts Example">

</p>


- `!part [PART ID]` to have informations about a piece (Bricklink id).
<p align="center">
	<img width="460" src="https://github.com/ThibautPlg/Discord-LEGO-Bot/raw/master/readme.assets/part-example.bmp" alt="Parts Example"> <br> Green for pieces still produced, orange otherwise
</p>

- `!search [query]` Search for a set by name (Beta feature, may be surprisingly wrong)
- `!part " search terms "` Search for a part name (Beta, not usabe in the middle of a sentence)
- `!mixeljoint` Show a list of the most used mixeljoint (with an awesome drawing of each)
- `!bs [SET NUMBER]` Get a direct link to the Brickset page of the set
- `!bl [SET NUMBER]` Get a direct link to the Bricklink page of the set
- `!review [SET NUMBER]` Get the set score based on the BrickInsights review
- `!help` Show all the bot commands
- `!inviteLegBot` Get a link to invite LegBot to your server
- `!credits` Display the bot credits

### Interactions

On most of Legbot's messages you can add reactions to have specific behaviour.

#### 🔎,🔍 or 🖼️ within 120 seconds
`:mag_right: :mag: :frame:`  
Will post a bigger picture of the set/part. (Useful on mobile where you can't click the thumbnail !)

#### 🗑️ within 120 seconds
`:wastebasket:`  
Will delete the message. Works on the pictures posted by the 🔎,🔍 or 🖼️ interactions.

## Credits :
- Rebrickable API : https://rebrickable.com/api/
- Brick Insight public API : https://brickinsights.com/
- Brickset API : https://brickset.com
- BrickLink links : https://www.bricklink
- BrickOwl links : https://www.brickowl.com

This bot is based on the [discord.js](https://discord.js.org/) library.


## Requirements :
- NodeJS 16.9.x or higher
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
	<img src="https://github.com/ThibautPlg/Discord-LEGO-Bot/raw/master/readme.assets/invitebutton.png" alt="Invite me !"> </a>
</p>

## Sponsorship
Giving a tip through Liberapay or Coindrop will help me paying the monthly bill of the bot hosting. (About $7 a month). Surplus will go to Brickset and Rebrickable as Legbot would not be the same without them.  
<a href="https://liberapay.com/Thibautplg/donate"><img alt="Donate using Liberapay" src="https://liberapay.com/assets/widgets/donate.svg"></a>

## Support and contact
[Twitter](https://twitter.com/thibaut_plg)

## Changelog
Legbot changelog and versions are available on the [release page](https://github.com/ThibautPlg/Discord-LEGO-Bot/releases).

- 1.5.4
  - Improving the `!part` search using a Levenshtein implementation to find the most relevant results.
  - Adding the "Print of" section in the part card if the given result is a printed version of a brick.
  - Adding the "Alternates" section in the part card to show mold variations (like `4081a` / `4081b`)
- 1.5.3
  - The "bigger picture" reaction can now itself have a 🗑️ (`:wastebasket:`) reaction to delete the enlarged picture.
  - Extended the 🗑️ (`:wastebasket:`) reaction listener from 60 to 120 seconds.
  - Prices and PPP now contains UK and DE prices.
  - Fixing the date output for a part released during a single year (no more "from 2002 to 2002")
- 1.5.2
  - Various improvements.
  - You can now add a 🔎,🔍 or 🖼️ reaction within 120 seconds to ask the bot to post a bigger picture of a set or a part.
  - Adding a direct link to the Brickset search page at the end of the `!search` results.
  - New parts are now distinguished from "in production" and "no more produced".
  - Fixing an issue where the instructions links were broken.
- 1.5.1
  - Various bug fixes.
  - You can now delete a bot message by adding the 🗑️ (`:wastebasket:`) emoji as a react in the 60 seconds following the post.
  - Experimental pieces search feature. Set the query between double-quotes like `!part "Mahiki Metru"`.
- 1.5
  - Adding the `instructions` section to a set query. Thanks @"Commander Purple" on top.gg for the idea !
  - Adding the AGPL licence.
  - Updating nodejs to v16.x
  - Updating discord.js to 13.x
  - Adding a beta feature to search for sets using `!search Piruk` for example.
  - Adding the `maximumSearchResults` correspondig var to limit the bot output.
- 1.4.4
  - Blacklist some queries ! `!set 69` is a very fun search, but uses bandwidth and server resources.
- 1.4.3
  - All REST requests are now using the async node-fetch way.
  - Improving the `!part` search by doing a second request if the first one did not find anything.
  - Adding badges to the README.md
  - Updating the log system to be csv-parsing compatible
- 1.4.2
  - Adding a custom command to fetch the Brickset's random set of the day
    - Require an external php script (at the moment)
- 1.4.1
  - LegBot is now able to fetch sets with hyphens ids (6862-1 or 6862-2 for example).
    - The old way is still working, but will fetch the "-1" set by default.
  - Updating the readme.md to say that LegBot is now on almost 300 servers !
  - Brickset is now listing LegBot in their <a href="https://brickset.com/tools/apps">apps section !</a>
  - Updating the discord.js lib to 12.x
- 1.4
  - Removing the ability to search for multiple pieces (vers 1.2.1), it was not used
  - Removing the corresponding config var (`piecesMax`)
  - You can now pass a command in the middle of your sentence ! For a more natural flow.
- 1.3.1
  - Fixing a crash on `!bl` and `!bs` commands.
  - Fixing a crash where no sets were found but with a success message from the API.
- 1.3.0
  - The great comeback of the full `!set` command. Thanks you Brickset for the API key :)
  - Adding a config entry for the Brickset API key (`bricksetApiKey`)
- 1.2.3
  - Not a big update, I just wanted to mess around with a MixelJoints custom feature.
    - Not that crazy tho. `!mixeljoint`
  - Updating the custom functions declaration by removing the necessity to specify the directory.
- 1.2.3
  - Due to an update at the main external API, sets data has been missing for few weeks. !sets and !review are now back, but with less informations than before. I hope I'll be able to fix that soon.
  - Review are now returned with a pretty "card", like other queries.
  - Addin a debug log
  - Adding the corresponding config var (`debug`, bool)
- 1.2.2
  - You can now add custom functions without messing with existing code, simply add a js file and declare it into the config var. (See custom/example.js)
  - Adding the corresponding config var (`moreFunctions`, can be an array)
  - The bot is now adding a 🙄 reaction to a message if he didn't find the piece / set.
  - The bot is now adding a 🤔 reaction when there is no set or parts id given.
  - General code rework on message var.
- 1.2.1
  - You can now search for multiple pieces (ex : `!part 36840 36841`)
  - Adding the corresponding config var (`piecesMax`, default = 2)
- 1.2.0
  - Adding logging of commands, anonymously, to get infos about most used commands to improve them in the future.
- 1.1.0
  - Adding the !botinfo command
  - Updating the readme
  - Ordering code
- 1.0.0
  - Initial release
