const { Client, Intents, MessageEmbed, Permissions } = require('discord.js');
const client = new Client({
	partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.DIRECT_MESSAGES,
		Intents.FLAGS.DIRECT_MESSAGE_REACTIONS]
});
const config = require('./config.json');
const package = require('./package.json');
const fs = require('fs');
const fetch = require('node-fetch');
const {distance, closest} = require('fastest-levenshtein');
const { URLSearchParams } = require('url');

client.once('ready', () => {
    log("restart,"+package.version)
});
client.login(config.token);

client.on('messageCreate', postedMessage => {
	var regex = new RegExp(config.trigger+'.*?', 'gi' );

    if (postedMessage.content.match(regex)) {

		var triggerLocation = postedMessage.content.indexOf(config.trigger);
        var args = postedMessage.content.substring(triggerLocation+1, postedMessage.content.length).split(' ');
		var cmd = args[0];
		var argsSentence = args.slice(1).join(' ');
		args = args[1];

		client.legBotMessage = postedMessage;

        switch(cmd) {
            case '#':
            case 'set':
                getSetInfos(args);
            break;
            case "part":
                getPartsInfos(args);
            break;
            case 'bl':
                postedMessage.channel.send(encodeURI('https://www.bricklink.com/v2/catalog/catalogitem.page?S='+args));
                log("bl," + args);
            break;
            case 'bi':
            case "review":
                getReview(args);
            break;
            case "bs":
                postedMessage.channel.send(encodeURI('https://brickset.com/sets/'+parseSetID(args)));
                log("bs," + args);
            break;
            case "LegBot":
            case "help":
                showHelp();
            break;
            case "inviteLegBot":
				postedMessage.author.send(client.generateInvite({scopes: ['bot'],permissions: [Permissions.DEFAULT] }));
                log("invite,"+package.version);
            break;
            case "credits":
                showCredits();
            break;
            case "botinfo":
                showStats();
            break;
			case "search":
				searchBrickset(argsSentence);
			break;
         }
     }
});


/**************************  FUNCTIONS *******************************/

getReview = async function(set) {

	if (!argumentIsValid(set, "review-no-id,")) {
		return;
	}

	var channel = client.legBotMessage.channel;

    var review = await fetch('https://brickinsights.com/api/sets/'+parseSetID(set)).then(
		response => response.json(),
		err => {
			log("review-db-error," + set);
			channel.send("It looks like Brickinsights is down, I can't get my data! 😐");
		}
	);

    if (review && !review.error) {
		rating = review.average_rating ? review.average_rating : "?";
		message = new MessageEmbed()
		.setColor('#F2CD37')
		.setTitle(review.name + ' ' + review.year)
		.setURL(review.url)
		.setThumbnail("https://brickinsights.com/storage/sets/"+parseSetID(set)+".jpg")
		.addField('Rated',review.name +" is rated **"+ rating + "/100**") /*+ ", belongs to the "+ set.primary_category.name +" category")*/
		.addField('Links', "More reviews at [BrickInsignt]("+review.url+")")
		.setFooter('Source : BrickInsignt');

		log("review," + set);

		channel.send({ embeds: [message]})
			.then(function(message) { enableDeleteOption(message)});
    } else if (review){
		log("review-not-found," + set);
		channel.send("There is no review available on Brickinsights.com for the set "+set);
	}
}

getSetInfos = async function(setNumber) {
	var channel = client.legBotMessage.channel;

	if (!argumentIsValid(setNumber, "set-no-id,")) {
		return;
	}

	var BInsight = encodeURI('https://brickinsights.com/sets/'+ parseSetID(setNumber));
    var BLlink = encodeURI("https://www.bricklink.com/v2/catalog/catalogitem.page?S="+setNumber);

	var set = await askBrickset("getSets", "params", "{'setNumber':'"+parseSetID(setNumber)+"'}");

	if (set.matches <= 0) {
		log("set-not-found," + setNumber);
		channel.send("Set "+setNumber+" not found... ");
		client.legBotMessage.react('🙄');
	} else if (set.status && set.status !== "success") {
        log("set-db-error," + setNumber);
		channel.send("Ooops, something is wrong with my database... ");
		client.legBotMessage.react('🙄');
    } else {
		set = set.sets[0];
		var instructions = await askBrickset("getInstructions2", "setNumber", set.number);
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

        var setCard = new MessageEmbed()
            .setColor('#F2CD37')
            .setTitle(set.number + ' ' + set.name)
            .setURL(set.bricksetURL)
            .setThumbnail(thumbnail)
            .addField('General',"Released in **"+ set.year + "**, belongs to the **"+ set.theme +"** category"+notes)
			.addField('Pieces', "Made of **" + set.pieces +"** parts", true);

		if(set.minifigs && set.minifigs > 0) {
			setCard.addField('Minifigures','Contains **'+set.minifigs+ '** minifigure'+(set.minifigs > 1 ? 's' : ''), true);
		}

		setCard.addField('Price', formatPrice(set))
				.addField('Links', "[Brickset]("+set.bricksetURL+")   -   [Bricklink]("+BLlink+")   -   [BrickInsight]("+BInsight+")");

		if(instructions.matches && instructions.matches >=1) {
			let instructionsList = "";
			for (let i = 0; i < instructions.instructions.length; i++) {
				const booklet = instructions.instructions[i];
				if(i < 5) {
					// Do not show more than 5 links !
					instructionsList += "["+(i+1)+"]("+encodeURI(booklet.URL)+")  ";
				}
			}
			setCard.addField('Instructions', instructionsList);
		}

		setCard.setFooter('Source : Brickset');

        log("set," + setNumber);
        channel.send({ embeds: [setCard]})
			.then(function(message) {
				enableDeleteOption(message),
				enableImageEnlargeOption(message, thumbnail)
			});
    }
}

/* beta */
searchBrickset = async function(query) {
	var channel = client.legBotMessage.channel;

	var sets = await askBrickset("getSets", "params", "{'query':'"+query+"', 'orderBy':'Rating'}");

	var matches = sets.matches;
	var apiFinds = sets.sets;
	apiFinds = apiFinds.slice(0, config.maximumSearchResults);

	if(matches && matches > 1) {
		var answer = new MessageEmbed()
			.setColor('#F2CD37')
			.setTitle(matches + ' results found!')
			.setThumbnail(apiFinds[0].image.imageURL)

		apiFinds.forEach(set => {
			answer
			.addField(set.number, "["+set.name+"]("+set.bricksetURL+") ("+set.year+")");
		});

		answer.addField(":notebook_with_decorative_cover: Brickset search results", encodeURI("https://brickset.com/sets?query="+query));

		answer.setFooter('Use `!set {set number}` to see more!');
		channel.send({ embeds: [answer]});
		log("search,"+query);
	} else if(matches === 1) {
		log("search-direct-result,"+query);
		getSetInfos(String(apiFinds[0].number+"-"+apiFinds[0].numberVariant));
	} else {
		log("search-not-found,"+query);
		client.legBotMessage.channel.send("Nothing found for \""+query+"\".");
	}
}

showStats = function() {

    var stats = new MessageEmbed()
        .setColor("#3F51B5")
        .setTitle("LegBot")
        .setThumbnail("https://cdn.discordapp.com/avatars/"+client.user.id+'/'+client.user.avatar+'.png')
        .setURL("https://github.com/ThibautPlg/Discord-LEGO-Bot")
        .addField('ID', client.user.id)
        .addField('Uptime', (process.uptime() + "").toHHMMSS(), true)
        .addField('Version', package.version, true)
        .addField('\u200b', '\u200b', true)
        .addField('Server count', String((client.guilds.cache).size), true)
        .addField('Total channels', String((client.channels.cache).size), true)
        .addField('Total users', String((client.users.cache).size), true);
    log("stats,"+package.version);
	client.legBotMessage.channel.send({ embeds: [stats]})
		.then(function(message) { enableDeleteOption(message)});
}

showHelp = function() {
    var t = config.trigger;
    var help = new MessageEmbed()
        .setColor("#009688")
        .setTitle("LegBot help")
        .setThumbnail("https://cdn.discordapp.com/avatars/"+client.user.id+'/'+client.user.avatar+'.png')
        .addField('Hey!', "Thanks for using this LEGO bot! :kissing_smiling_eyes: \n To use me, type the following commands :")
        .addField('Commands : ', "`"+t+"set [SET NUMBER]`  to have general informations about a set.\n"+
		"`"+t+"search [QUERY]` to search a set by name. {beta}\n"+
        "`"+t+"part [PART ID]`  to have informations about a piece (Bricklink id).\n"+
        "`"+t+"mixeljoint`  to have the list of the most used mixeljoint (with an awesome drawing of each).\n"+
        "`"+t+"bs [SET NUMBER]`  to show a link to Brickset about the provided set number \n"+
        "`"+t+"bl [SET NUMBER]`  to show a BrickLink link to the searched set number \n"+
        "`"+t+"review [SET NUMBER]`  to have infos about the requested set (rating, reviews...) \n"+
        "`"+t+"help`  to display this message... Not that useful if you're reading this tho. \n "+
        "`"+t+"inviteLegBot` to get a link to invite LegBot to your server. \n"+
        "`"+t+"credits`  to show dev credits. \n \n")
		.addField("Reactions :",
		"You can add a \"🗑️\" reaction to most of the bot messages within a minute to remove them. \n"+
		"You can add a \"🔎\", \"🔍\" or \"🖼️\" reaction on the set or part command to have a bigger image.");

    log("help,"+package.version);
	client.legBotMessage.channel.send({ embeds: [help]})
		.then(function(message) { enableDeleteOption(message)});
}

showCredits = function() {
    var credits = new MessageEmbed()
        .setColor("#03A9F4")
        .setTitle("LegBot")
        .setThumbnail("https://cdn.discordapp.com/avatars/"+client.user.id+'/'+client.user.avatar+'.png')
        .setURL("https://github.com/ThibautPlg/Discord-LEGO-Bot")
        .addField('General', "This bot has been developped by Thibaut P\n \
        Twitter : [@thibaut_plg](https://twitter.com/thibaut_plg)")
        .addField('APIs and ressources', "\
        - Rebrickable API : https://rebrickable.com/api/\n\
        - Brick Insight public API : https://brickinsights.com/ \n \
        - Brickset API : https://brickset.com \n \
        - BrickLink links : https://www.bricklink \n \
        - BrickOwl links : https://www.brickowl.com\n")
        .addField('Technos', "This bot is based on [discord.js](https://discord.js.org/)")
        .addField('Github', "This bot is available on [Github](https://github.com/ThibautPlg/Discord-LEGO-Bot)");
    log("credits,"+package.version);
	client.legBotMessage.channel.send({ embeds: [credits]})
		.then(function(message) { enableDeleteOption(message)});
}

getPartsInfos = async function(partNo, retry) {

	if (!argumentIsValid(partNo, "part-no-id,")) {
		return;
	}
	partNo = cleanArgument(partNo);
	var key = "key="+config.rebrickableToken;
	var color = "";

    //can be a BL or Rebrickable id
    var partQuery = 'https://rebrickable.com/api/v3/lego/parts/?bricklink_id='+encodeURI(partNo)+"&inc_part_details=1&"+key; //2436b

	if(!!retry) {
		// It may be a full string, let's use the search API
		// beta
		var fullCommand = client.legBotMessage.content.substring(client.legBotMessage.content.indexOf(config.trigger)+1, client.legBotMessage.content.length);
		var computedCommand = fullCommand.match(/^part "(.*)"/);
		if(!!computedCommand && !!computedCommand[1]) {
			toSearch = computedCommand[1];
		} else {
			toSearch = partNo;
		}
		partQuery = 'https://rebrickable.com/api/v3/lego/parts/?search='+encodeURI(toSearch)+"&page_size=20&ordering=part_cat_id&inc_part_details=1&"+key; //35164 is 42022
	}

	var partFetch = await fetch(partQuery).then(
		response => response.json(),
		err => {
			client.legBotMessage.channel.send("It looks like Rebrickable is down, I can't get my data! 😐");
			client.legBotMessage.react('😐')
			log("part-db-error," + partNo);
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
		} else {
			productionState = "[:orange_circle:  No more produced] \n";
			color = "#F2CD37";
		}

		var releaseString = "Released in "+ part.year_from;
		if (part.year_from !== part.year_to) {
			releaseString += ", at least produced until "+ part.year_to;
		}

		const partsInfo = new MessageEmbed()
			.setColor(color)
			.setTitle(part.name)
			.setURL(part.part_url)
			.setThumbnail(part.part_img_url)
			.addField('General', productionState + part.name +"\n "+releaseString);

			if(part.molds && part.molds.length) {
				partsInfo.addField("Similar to", getSimilarParts(part.molds));
			} else if(part.alternates && part.alternates.length) {
				partsInfo.addField("See also", getSimilarParts(part.alternates));
			}

			if(part.print_of && part.print_of.length) {
				partsInfo.addField("Print of", "["+part.print_of+"](https://rebrickable.com/parts/"+part.print_of+")" );
			}

			partsInfo
			.addField('Shop : ', "[Bricklink]("+bricklinkUrl+")  |  [BrickOwl]("+brickOwlUrl+") |  [Lego PaB]("+legoUrl+")", true)
			.setFooter('Source : '+ part.part_url);

		client.legBotMessage.channel.send({ embeds: [partsInfo]})
			.then(function(message) {
				enableDeleteOption(message),
				enableImageEnlargeOption(message, part.part_img_url)
			});
		log("part," + partNo);
	} else if (partFetch){
		if (!retry) {
			/* First time we failed, let's try to use the "search" feature of Rebrickable ! */
			getPartsInfos(partNo, true);
		} else {
			client.legBotMessage.channel.send("I'm so sorry **"+ client.legBotMessage.author.username +"**, I could not find the part you were looking for. :(");
			client.legBotMessage.react('🙄')
			log("part-not-found," + partNo);
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
			weight = +Math.min.apply(null, subWeight.map(function(o) { return o.weight; }));
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
			weight = +Math.min.apply(null, subWeight.map(function(o) { return o.weight; }));
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

enableDeleteOption = function(message) {
	const filter = (reaction, user) => { return user.id !== message.author.id; }

	const collector = message.createReactionCollector({ filter, time: 120000 });

	collector.on("collect", (reaction, user) => {
		if (reaction.emoji.name === '🗑️' && !!message) {
			message.delete();
		}
	});
}

enableImageEnlargeOption = function(message, imageURL) {
	const filter = (reaction, user) => { return user.id !== message.author.id; }

	const collector = message.createReactionCollector({ filter, time: 120000 });

	const reactions = ['🔎', '🔍', '🖼️'];

	collector.on("collect", (reaction, user) => {
		if (!!message && !!imageURL && (reactions.indexOf(reaction.emoji.name) != -1)) {
			client.legBotMessage.channel.send(imageURL)
			.then(function(message) { enableDeleteOption(message)});
		}
	});
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
		prices.push({
			sign: '$',
			price: set.LEGOCom.US.retailPrice,
			priceString: '$'+set.LEGOCom.US.retailPrice,
			ppp: (set.LEGOCom.US.retailPrice/set.pieces).toFixed(2),
			pppString: '$'+(set.LEGOCom.US.retailPrice/set.pieces).toFixed(2)
		});
	}
	if (set.LEGOCom && set.LEGOCom.UK && set.LEGOCom.UK.retailPrice) {
		prices.push({
			sign: '£',
			price: set.LEGOCom.UK.retailPrice,
			priceString: '£'+set.LEGOCom.UK.retailPrice,
			ppp: (set.LEGOCom.UK.retailPrice/set.pieces).toFixed(2),
			pppString: '£'+(set.LEGOCom.UK.retailPrice/set.pieces).toFixed(2)
		});
	}
	if (set.LEGOCom && set.LEGOCom.DE && set.LEGOCom.DE.retailPrice) {
		prices.push({
			sign: '€',
			price: set.LEGOCom.DE.retailPrice,
			priceString: set.LEGOCom.DE.retailPrice+"€",
			ppp: (set.LEGOCom.DE.retailPrice/set.pieces).toFixed(2),
			pppString: (set.LEGOCom.DE.retailPrice/set.pieces).toFixed(2)+'€'
		});
	}

	if (prices.length) {
		let message = 'Priced **';
		let ppp = "Price per Piece ratio : **";
		for (const index in prices) {
			if (Object.hasOwnProperty.call(prices, index)) {
				let price = prices[index];
				var separator = " ";
				if (index < prices.length-1) {
					separator = '** / **';
				}
				message += price.priceString + separator;
				ppp += price.pppString + separator;
			}
		}
		message += "**";
		message += "\n";
		message += ppp+"**\n"
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
argumentIsValid = function(arg, toLog) {
	if (arg === undefined || arg.length < 1) {
		log(toLog + arg);
		client.legBotMessage.react('🤔');
		return false;
	} else if(!arg.match(/\w+/)) {
		log("no args,"+package.version);
		return false;
	} else if((bannedSearches.indexOf(arg) > -1)) {
		if(arg.match(/69/)) {
			client.legBotMessage.react('🥵');
			client.legBotMessage.react('😳');
		}
		if(arg.match(/420/)) {
			client.legBotMessage.react('🤯');
		}
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
/*********************** Custom functions if needed *********************/
if (config && config.moreFunctions){
	var customFiles = config.moreFunctions;
	if (!Array.isArray(config.moreFunctions)){
		customFiles = [customFiles];
	}
	customFiles.forEach(customFile => {
		eval(fs.readFileSync(customFile)+'');
	});
}


/*********************** Banned searchs *********************/
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