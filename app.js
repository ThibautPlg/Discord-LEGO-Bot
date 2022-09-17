const config = require('./config.json');
const package = require('./package.json');

const { Client, GatewayIntentBits, EmbedBuilder, Collection, InteractionType, Partials} = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, token } = require('./config.json');
const fs = require('fs');
const path = require('path');
const intents = [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.GuildMessageReactions,
	GatewayIntentBits.DirectMessages,
	GatewayIntentBits.DirectMessageReactions
];
/* Check if the bot is running in legacy mode,
* aka using trigger commands in addition to the
* slash commands.
*/
isLegacyMode = function(){
	return config && config.legacy && config.legacy.enabled;
}
if(isLegacyMode()) {
	intents.push(GatewayIntentBits.MessageContent);
}

const client = new Client({
	partials: [
		Partials.Message,
		Partials.Channel,
		Partials.Reaction
	],
	intents: intents,
	retryLimit: 2,
	presence: {
		status: "online",
		activities: [{
			name: " slash commands now!",
			type: "LISTENING"
		}]
	}
});

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const {distance, closest} = require('fastest-levenshtein');
const { URLSearchParams } = require('url');

client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	client.commands.set(command.data.name, command);
	commands.push(command.data.toJSON());
}

client.on('interactionCreate', async interaction => {
	if (!(interaction.type === InteractionType.ApplicationCommand)) return;
	const command = client.commands.get(interaction.commandName);

	if (!command) return;
	try {
		await command.execute(interaction);
	} catch (error) {
		log("error,"+error);
		interaction.editReply("Something went wrong on my side, sorry! 😐");
	}
});

client.login(config.token);

const rest = new REST({ version: '9' }).setToken(token);
rest.put(
	Routes.applicationCommands(clientId),
	{ body: commands },
);

/**************************  FUNCTIONS *******************************/

getReview = async function(set) {
	set = cleanArgument(set);

    var review = await fetch('https://brickinsights.com/api/sets/'+parseSetID(set)).then(
		response => response.json(),
		err => {
			log("review-db-error," + set);
			return("It looks like Brickinsights is down, I can't get my data! 😐");
		}
	);

    if (review && !review.error) {
		rating = review.average_rating ? review.average_rating : "?";
		message = new EmbedBuilder()
		.setColor('#F2CD37')
		.setTitle(review.name + ' ' + review.year)
		.setURL(review.url)
		.setThumbnail("https://brickinsights.com/storage/sets/"+parseSetID(set)+".jpg")
		.addFields([
			{ name: 'Rated', value: review.name +" is rated **"+ rating + "/100**" }, /*+ ", belongs to the "+ set.primary_category.name +" category")*/
			{ name: 'Links', value: "More reviews at [BrickInsignt]("+review.url+")"}
		])
		.setFooter({"text":'Source : BrickInsignt'});

		log("review," + set);
		return({ embeds: [message]});
    } else if (review){
		log("review-not-found," + set);
		return("There is no review available on Brickinsights.com for the set "+set);
	}
}

getSetInfos = async function(setNumber) {
	setNumber = cleanArgument(setNumber);

	var BInsight = encodeURI('https://brickinsights.com/sets/'+ parseSetID(setNumber));
    var BLlink = encodeURI("https://www.bricklink.com/v2/catalog/catalogitem.page?S="+setNumber);

	var set = await askBrickset("getSets", "params", "{'setNumber':'"+parseSetID(setNumber)+"'}");

	if (set.matches <= 0) {
		log("set-not-found," + setNumber);
		return("Set "+setNumber+" not found... ");
	} else if (set.status && set.status !== "success") {
        log("set-db-error," + setNumber);
		return("Ooops, something is wrong with my database... ");
    } else {
		set = set.sets[0];
		var instructions = await askBrickset("getInstructions2", "setNumber", set.number);
		var designers = await fetchDesigners(set.number);
		let thumbnail = "";
		if(set.image && set.image.imageURL) {
			thumbnail = set.image.imageURL;
		} else if (set.image && set.image.thumbnailURL) {
			thumbnail = set.image.thumbnailURL;
		}
		let notes = '';
		if(set.extendedData && set.extendedData.notes) {
			notes = '\n'+set.extendedData.notes;
		}

        var setCard = new EmbedBuilder()
            .setColor('#F2CD37')
            .setTitle(set.number + ' ' + set.name)
            .setURL(set.bricksetURL)
            .setThumbnail(thumbnail)
			.addFields([
				{ name: 'General', value: "Released in **"+ set.year + "**, belongs to the **"+ set.theme +"** category"+notes }
			]);

		if(set.pieces) {
			setCard.addFields([
				{ name: 'Pieces', value: "Made of **" + set.pieces +"** parts", inline: true }
			]);
		} else {
			setCard.addFields([
				{ name: 'Pieces', value: "Piece count is not available for this set", inline: true }
			]);
		}

		if(set.minifigs && set.minifigs > 0) {
			setCard.addFields([
				{ name: 'Minifigures', value: 'Contains **'+set.minifigs+ '** minifigure'+(set.minifigs > 1 ? 's' : ''), inline: true }
			]);
		}

		setCard.addFields([
			{ name: 'Price', value: formatPrice(set) },
			{ name: 'Links', value: "[Brickset]("+set.bricksetURL+")   -   [Bricklink]("+BLlink+")   -   [BrickInsight]("+BInsight+")"}
		]);

		if(instructions.matches && instructions.matches >=1) {
			let instructionsList = "";
			for (let i = 0; i < instructions.instructions.length; i++) {
				const booklet = instructions.instructions[i];
				if(i < 5) {
					// Do not show more than 5 links !
					instructionsList += "["+(i+1)+"]("+encodeURI(booklet.URL)+")  ";
				}
			}
			setCard.addFields([
				{name: 'Instructions', value: instructionsList}
			]);
		}
		if (designers && designers.length > 0) {
			let designersList = "";
			if(designers.length == 1) {
				title = "Designer";
			} else {
				title = "Designers";
			}
			for (let i = 0; i < designers.length; i++) {
				let designer = designers[i];
				designersList += "["+designer.name+"]("+encodeURI(designer.bricklist)+")  ";
				if (i < designers.length-1) {
					designersList +=  '** / **';
				}
			}
			setCard.addFields([
				{name: title, value: designersList }
			]);
		}

		setCard.setFooter({"text":'Source : Brickset', "iconURL": "https://brickset.com/favicon.ico"});

        log("set," + setNumber);
        return({ embeds: [setCard]})
    }
}

/* beta */
searchBrickset = async function(query) {
	var sets = await askBrickset("getSets", "params", "{'query':'"+query+"', 'orderBy':'Rating'}");

	var matches = sets.matches;
	var apiFinds = sets.sets;
	apiFinds = apiFinds.slice(0, config.maximumSearchResults);

	if(matches && matches > 1) {
		var answer = new EmbedBuilder()
			.setColor('#F2CD37')
			.setTitle(matches + ' results found!')
			.setThumbnail(apiFinds[0].image.imageURL)

		apiFinds.forEach(set => {
			answer
			.addFields([
				{ name: set.number, value: "["+set.name+"]("+set.bricksetURL+") ("+set.year+")" }
			]);
		});

		answer.addFields([
			{name: ":notebook_with_decorative_cover: Brickset search results", value: encodeURI("https://brickset.com/sets?query="+query) }
		]);

		answer.setFooter({"text": 'Use `!set {set number}` to see more!', "iconURL": "https://thibautplg.github.io/legbot/img/legBot.png"});
		log("search,"+query);
		return({ embeds: [answer]});
	} else if(matches === 1) {
		log("search-direct-result,"+query);
		return getSetInfos(String(apiFinds[0].number+"-"+apiFinds[0].numberVariant));
	} else {
		log("search-not-found,"+query);
		return("Nothing found for \""+query+"\".");
	}
}

showHelp = async function() {
    var t = "/";
    var help = new EmbedBuilder()
        .setColor("#009688")
        .setTitle("LegBot help")
        .setThumbnail("https://cdn.discordapp.com/avatars/"+client.user.id+'/'+client.user.avatar+'.png')
        .addFields([
			{name: 'Hey!', value: "Thanks for using this LEGO bot! :kissing_smiling_eyes: \n To use me, type the following commands :" },
        	{name: 'Commands : ',value: "`"+t+"set [SET NUMBER]`  to have general informations about a set.\n"+
			"`"+t+"search [QUERY]` to search a set by name. {beta}\n"+
			"`"+t+"part [PART ID]`  to have informations about a piece (Bricklink id).\n"+
			"`"+t+"review [SET NUMBER]`  to have infos about the requested set (rating, reviews...) \n"+
			"`"+t+"setoftheday`  to get Brickset's set of the day \n"+
			"`"+t+"legbot`  to display this message... Not that useful if you're reading this tho. \n "+
			"`"+t+"credits`  to show dev credits. \n \n"}
		]);
		if (isLegacyMode()){
			var trigger = config.legacy.trigger;
			help.addFields([
				{name: "Legacy commands :", value:
				"`"+trigger+"set [SET NUMBER]`  to have general informations about a set.\n"+
				"`"+trigger+"review [SET NUMBER]`  to have infos about the requested set (rating, reviews...) \n"+
				"`"+trigger+"part [PART ID]`  to have informations about a piece (Bricklink id)\n"+
				"`"+trigger+"mixeljoint`  to have the list of the most used mixeljoint (with an awesome drawing of each).\n"+
				"**These commands can be used in the middle of a sentence.** \n" }
			])
		}
		help.addFields([
			{name: "Reactions :", value:
			"You can add a \"🗑️\" reaction to most of the bot messages within 4 minutes to remove them. \n"+
			"You can add a \"🔎\", \"🔍\" or \"🖼️\" reaction on the set or part command to have a bigger image." }
		]);

    log("help,"+package.version);
	return({ embeds: [help]});
}

showCredits = async function() {
    var credits = new EmbedBuilder()
        .setColor("#03A9F4")
        .setTitle("LegBot")
        .setThumbnail("https://cdn.discordapp.com/avatars/"+client.user.id+'/'+client.user.avatar+'.png')
        .setURL("https://github.com/ThibautPlg/Discord-LEGO-Bot")
        .addFields([
			{name: 'General', value: "This bot has been developped by Thibaut P\n \
			Twitter : [@thibaut_plg](https://twitter.com/thibaut_plg)" },
			{name: 'APIs and ressources', value: "\
			- Rebrickable API : https://rebrickable.com/api/\n\
			- Brick Insight public API : https://brickinsights.com/ \n \
			- Brickset API : https://brickset.com \n \
			- BrickLink links : https://www.bricklink \n \
			- BrickOwl links : https://www.brickowl.com\n" },
			{name: 'Technos', value: "This bot is based on [discord.js](https://discord.js.org/)"},
			{name: 'Github', value:"This bot is available on [Github](https://github.com/ThibautPlg/Discord-LEGO-Bot)"},
			{name: 'Uptime', value:(process.uptime() + "").toHHMMSS(), inline: true},
			{name: 'Version', value:package.version, inline: true},
			{name: '\u200b', value:'\u200b', inline: true},
			{name: 'Server count', value: String((client.guilds.cache).size), inline: true}
		]);
    log("credits,"+package.version);
	return({ embeds: [credits]});
}

getPartsInfos = async function(partNo, retry) {

	fullCommand = partNo;
	partNo = cleanArgument(partNo);
	toSearch = partNo;
	var key = "key="+config.rebrickableToken;
	var color = "";

    //can be a BL or Rebrickable id
    var partQuery = 'https://rebrickable.com/api/v3/lego/parts/?bricklink_id='+encodeURI(partNo)+"&inc_part_details=1&"+key; //2436b

	if(!!retry) {
		// It may be a full string, let's use the search API
		// beta
		var computedCommand = fullCommand.match(/^part "(.*)"/);
		if(!!computedCommand && !!computedCommand[1]) {
			toSearch = computedCommand[1];
		}
		partQuery = 'https://rebrickable.com/api/v3/lego/parts/?search='+encodeURI(toSearch)+"&page_size=20&inc_part_details=1&"+key; //35164 is 42022
	}

	var partFetch = await fetch(partQuery).then(
		response => response.json(),
		err => {
			log("part-db-error," + partNo);
			return("It looks like Rebrickable is down, I can't get my data! 😐");
		}
	);

	if (partFetch && partFetch.count >= 1) {

		part = guessMostRelevantPart(toSearch, partFetch.results);

		var rebrickableNo = part.part_num; //10201
		var productionState = '';

		var bricklinkId = part.external_ids.BrickLink;
		var bricklinkUrl = 'https://www.bricklink.com/v2/search.page?q='+ encodeURI(rebrickableNo);
		if (bricklinkId) {
		bricklinkUrl = "https://www.bricklink.com/v2/catalog/catalogitem.page?P="+ encodeURI(bricklinkId)
		}
		var brickOwlId = part.external_ids.BrickOwl;
		var brickOwlUrl = 'https://www.brickowl.com/search/catalog?query='+encodeURI(rebrickableNo);
		if (brickOwlId) {
			brickOwlUrl = "https://www.brickowl.com/search/catalog?query="+ encodeURI(brickOwlId)
		}
		var legoId = part.external_ids.LEGO ? part.external_ids.LEGO : rebrickableNo;
		var legoUrl = 'https://www.lego.com/fr-fr/page/static/pick-a-brick?query='+encodeURI(legoId);

		var currentYear = new Date().getFullYear();
		if(currentYear == part.year_from && currentYear == part.year_to) {
			productionState = "[:new:  New part] \n";
			color = "#0D47A1";
		} else if(currentYear <= part.year_to) {
			// Still in production ?
			productionState = "[:green_circle: Still in production] \n";
			color = "#8BC34A";
		} else if(!part.year_from){
			// There is no date so it may be new ? We don't know !
			productionState = "";
			color = "#2E8BC0";
		} else {
			productionState = "[:orange_circle:  No more produced] \n";
			color = "#F2CD37";
		}

		let releaseString = "";
		if (part.year_from) {
			releaseString = "Released in "+ part.year_from;

			if (part.year_from !== part.year_to) {
				releaseString += ", at least produced until "+ part.year_to;
			}
		}

		const partsInfo = new EmbedBuilder()
			.setColor(color)
			.setTitle(rebrickableNo + " : " +part.name)
			.setURL(part.part_url)
			.setThumbnail(part.part_img_url)
			.addFields([
				{name: 'General', value: productionState + part.name +"\n "+releaseString}
			]);

		if(bricklinkId) {
			partsInfo.addFields([
				{name: "Colors : ",value: "[Bricklink inventory](https://www.bricklink.com/catalogItemIn.asp?P="+bricklinkId+"&v=3&in=S)"}
			]);
		}

		if(part.molds && part.molds.length) {
			partsInfo.addFields([
				{name: "Similar to : ",value: getSimilarParts(part.molds)}
			]);
		} else if(part.alternates && part.alternates.length) {
			partsInfo.addFields([
				{name: "See also",value: getSimilarParts(part.alternates)}
			]);
		}

		if(part.print_of && part.print_of.length) {
			partsInfo.addFields([
				{name: "Print of", value: "["+part.print_of+"](https://rebrickable.com/parts/"+part.print_of+")"}
			]);
		}

		partsInfo
			.addFields([
				{name: 'Shop : ', value: "[Bricklink]("+bricklinkUrl+")  |  [BrickOwl]("+brickOwlUrl+") |  [Lego PaB]("+legoUrl+")", inline: true }
			])
			.setFooter({"text": 'Source : '+ part.part_url, "iconURL": "https://rebrickable.com/static/img/favicon.png"});

		log("part," + partNo);
		return({ embeds: [partsInfo]});
	} else if (partFetch){
		if (!retry) {
			/* First time we failed, let's try to use the "search" feature of Rebrickable ! */
			return getPartsInfos(partNo, true);
		} else {
			log("part-not-found," + partNo);
			return("I could not find the part you were looking for. :(");
		}
	}
}

var getSimilarParts = function(molds) {
    var txt = '';
    if (molds) {
        var total = molds.length;
        var some = molds;
        if (total > 5) {
            some = molds.slice(0,5);
        }
        for(mold in some) {
            txt += "["+some[mold]+"](https://rebrickable.com/parts/"+some[mold]+")";
            if(mold < total-1) {
                txt += "  |  "; //just to add sexy separators
            }
        }

    }
    return txt;
}

/**	Guessing the best part to return to the user.
 * Example with !part 65765
 */
guessMostRelevantPart = function(query, partList) {
	// The search got a single result, no need to search for best match
	if (partList.length == 1) {
		return partList[0];
	}

	/* Critical values are compared to the query string with the Levenshtein distance algorithm.
	The lower, the better. */
	var comptedWeights = [];
	for (var i = 0; i < partList.length; i++) {
		let part = partList[i];
		let external_ids = part.external_ids;

		/* Initial weight is based on the part_num */
		let weight = distance(part.part_num, query);

		/* Weight increases if bricklink ID is different */
		if (external_ids && external_ids.BrickLink) {
			let subWeight = [];
			external_ids.BrickLink.forEach(bricklinkId => {
				subWeight.push({
					"weight": distance(query, bricklinkId),
					"id": bricklinkId
				});
			});
			weight =+ Math.min.apply(null, subWeight.map(function(o) { return o.weight; }));
		}

		/* Weight increases if brickset ID is different */
		if (external_ids && external_ids.Brickset) {
			let subWeight = [];
			external_ids.Brickset.forEach(bricksetId => {
				subWeight.push({
					"weight": distance(query, bricksetId),
					"id": bricksetId
				});
			});
			weight =+ Math.min.apply(null, subWeight.map(function(o) { return o.weight; }));
		}
		if(((part.name).toLowerCase()).match(new RegExp("\\W"+query+"\\W", "gmi"))) {
			weight--;
		}

		comptedWeights.push({
			"weight": weight,
			"id": i
		});
	}
	// Ordering in ascending order to have lower first
	comptedWeights.sort((a, b) => parseFloat(a.weight) - parseFloat(b.weight));

	return partList[comptedWeights[0].id];
}

fetchDesigners = async function(setNumber) {
	if (config && config.designerDatabaseURL) {
		return await fetch(config.designerDatabaseURL+setNumber).then(
			response => response.json(),
			err => {
				log("designer-error," + setNumber);
			}
		);
	} else {
		return [];
	}
}

enableDeleteOption = function(message) {
	const filter = (reaction, user) => { return user.id !== message.author.id; }

	const collector = message.createReactionCollector({ filter, time: 240000 });

	collector.on("collect", (reaction, user) => {
		if (reaction.emoji.name === '🗑️' && !!message) {
			message.delete();
		}
	});
}

enableImageEnlargeOption = async function(message, result) {

	if(!!result && !!result.embeds && !!result.embeds[0] && !!result.embeds[0].data && !!result.embeds[0].data.thumbnail) {
		imageURL = result.embeds[0].data.thumbnail["url"]

		const filter = (reaction, user) => { return user.id !== message.author.id; }
		const collector = message.createReactionCollector({ filter, time: 240000 });
		const reactions = ['🔎', '🔍', '🖼️'];

		collector.on("collect", (reaction, user) => {
			if (!!message && !!imageURL && (reactions.indexOf(reaction.emoji.name) != -1)) {
				message.reply({ content: imageURL})
				.then(function(message) { enableDeleteOption(message)});
			}
		});
	}
}
/*************************   Stuff used by functions      ****************************/

String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time = hours+':'+minutes+':'+seconds;
    return time;
}

askBrickset = async function(endpoint, param, args) {
	var baseUrl = 'https://brickset.com/api/v3.asmx/';
	var url = baseUrl+endpoint;

	var params = new URLSearchParams();
	params.append('apiKey', config.bricksetApiKey);
	params.append('userhash', '');
	params.append(param, args);

	var data = await fetch(url, {method: "POST", body: params}).then(
		response => response.json(),
		err => {
			return false;
		}
	);
	return data;
}

formatPrice = function(set) {
	let prices = [];
	if (set.LEGOCom && set.LEGOCom.US && set.LEGOCom.US.retailPrice) {
		let sign = '$';
		let data = {
			price: set.LEGOCom.US.retailPrice,
			priceString: sign+set.LEGOCom.US.retailPrice,
			ppp: (set.LEGOCom.US.retailPrice/set.pieces).toFixed(2),
			pppString: sign+(set.LEGOCom.US.retailPrice/set.pieces).toFixed(2)
		};
		if (set.dimensions && set.dimensions.weight && set.dimensions.weight > 0) {
			data.ppk = (set.LEGOCom.US.retailPrice/set.dimensions.weight).toFixed(2),
			data.ppkString = sign+(set.LEGOCom.US.retailPrice/set.dimensions.weight).toFixed(2)
		}
		prices.push(data);
	}
	if (set.LEGOCom && set.LEGOCom.UK && set.LEGOCom.UK.retailPrice) {
		let sign = '£';
		let data = {
			price: set.LEGOCom.UK.retailPrice,
			priceString: sign+set.LEGOCom.UK.retailPrice,
			ppp: (set.LEGOCom.UK.retailPrice/set.pieces).toFixed(2),
			pppString: sign+(set.LEGOCom.UK.retailPrice/set.pieces).toFixed(2)
		};
		if (set.dimensions && set.dimensions.weight && set.dimensions.weight > 0) {
			data.ppk = (set.LEGOCom.UK.retailPrice/set.dimensions.weight).toFixed(2),
			data.ppkString = sign+(set.LEGOCom.UK.retailPrice/set.dimensions.weight).toFixed(2)
		}
		prices.push(data);
	}
	if (set.LEGOCom && set.LEGOCom.DE && set.LEGOCom.DE.retailPrice) {
		let sign = '€';
		let data = {
			price: set.LEGOCom.DE.retailPrice,
			priceString: set.LEGOCom.DE.retailPrice+sign,
			ppp: (set.LEGOCom.DE.retailPrice/set.pieces).toFixed(2),
			pppString: (set.LEGOCom.DE.retailPrice/set.pieces).toFixed(2)+sign
		};
		if (set.dimensions && set.dimensions.weight && set.dimensions.weight > 0) {
			data.ppk = (set.LEGOCom.DE.retailPrice/set.dimensions.weight).toFixed(2),
			data.ppkString = (set.LEGOCom.DE.retailPrice/set.dimensions.weight).toFixed(2)+sign
		}
		prices.push(data);
	}
	if (set.LEGOCom && set.LEGOCom.CA && set.LEGOCom.CA.retailPrice) {
		let sign = 'C$';
		let data = {
			price: set.LEGOCom.CA.retailPrice,
			priceString: sign+set.LEGOCom.CA.retailPrice,
			ppp: (set.LEGOCom.CA.retailPrice/set.pieces).toFixed(2),
			pppString: sign+(set.LEGOCom.CA.retailPrice/set.pieces).toFixed(2)
		};
		if (set.dimensions && set.dimensions.weight && set.dimensions.weight > 0) {
			data.ppk = (set.LEGOCom.CA.retailPrice/set.dimensions.weight).toFixed(2),
			data.ppkString = sign+(set.LEGOCom.CA.retailPrice/set.dimensions.weight).toFixed(2)
		}
		prices.push(data);
	}

	if (prices.length) {
		let message = 'Priced **';
		let ppp = "Price per Piece ratio : **";
		let ppk = "";
		if (set.dimensions && set.dimensions.weight && set.dimensions.weight > 0) {
			ppk = "** Price per KG ratio : **";
		}
		for (const index in prices) {
			if (Object.hasOwnProperty.call(prices, index)) {
				let price = prices[index];
				var separator = " ";
				if (index < prices.length-1) {
					separator = '** / **';
				}
				message += price.priceString + separator;
				ppp += price.pppString + separator;
				if (set.dimensions && set.dimensions.weight && set.dimensions.weight > 0) {
					ppk += price.ppkString + separator;
				}
			}
		}
		message += "**";
		message += "\n";
		message += ppp+"\n"+ppk+"**\n";
		return message;
	} else {
		return "No price data available."
	}
}

/* Clean the given string by removing every weird signs if needed */
cleanArgument = function(arg) {
	return arg.replace(/[!"#$%&'()*+,./:;<=>?@[\]^`{|}~]/, '');
}

/* Is my arg something valid ?
* Returns true if the arg is a string containing letters and numbers
*/
argumentIsValid = async function(arg, interaction, toLog) {
	if (arg === undefined || arg.length < 1) {
		log(toLog + arg);
		client.legBotMessage.react('🤔');
		return false;
	} else if(!arg.match(/\w+/)) {
		log("no args,"+package.version);
		return false;
	} else if((bannedSearches.indexOf(arg) > -1)) {
		let message = await interaction.editReply({content: "Invalid number!", ephemeral: true});
		message.react('🙄');
		log("well,"+arg);
		return false;
	} else {
		return true;
	}
}
/* Check if given string has a "-n" format,
* if not add "-1" to catch the first set
* for example, it exists 6862-1 (M-Tron) and 6862-2 (DC Super Heroes)
*/
parseSetID = function(setId) {
	if (setId.match(/\-\d*$/gim)) {
		return setId;
	} else {
		return setId+'-1';
	}
}

/********************************* Logs  *******************************/
if (config && config.log && config.log.active) {
    var logfile = config.log.logfile || "log.txt";
    // Add a dated prefix to the logfile
    logfile = (new Date).toISOString().slice(0,10)+"_"+logfile;
    var logger = fs.createWriteStream(logfile, {
        flags: 'a'
    })
}

log = function(msg) {
    if (config && config.log && config.log.active && !!logger) {
		logger.write((new Date).toISOString().slice(0,19) + "," + msg + "\n");
		console.log((new Date).toISOString().slice(0,19) + "," + msg + "\n");
	}
}

debug = function(msg) {
    if (config && config.log && config.log.debug && !!logger) {
		console.log(msg + "\n");
	}
}

/*********************** Include LEGACY mode if required *********************/
/**
 * This mode can only be used on instances that are actives in less than 100 servers
 * as Discord disabled the reading of the message content.
 * Enable by toggling "config.legacy.enabled" to true.
 */
if (isLegacyMode()){

	eval(fs.readFileSync(path.join(__dirname, 'commands/legacy/legacy.js'))+'');

	/******* Custom functions ********/
	if (config.legacy.moreFunctions){
		var customFiles = config.legacy.moreFunctions;
		if (!Array.isArray(config.legacy.moreFunctions)){
			customFiles = [customFiles];
		}
		customFiles.forEach(customFile => {
			eval(fs.readFileSync(customFile)+'');
		});
	}
}


/*********************** Banned searches *********************/
/* Because searching the !set 69 is very funny, but uses bandwidth
and resources ! This list is based on logs analysis.*/
const bannedSearches = [
	"1",
	"1234",
	"12345",
	"69",
	"069",
	"0069",
	"69420",
	"420420",
	"696969"
]