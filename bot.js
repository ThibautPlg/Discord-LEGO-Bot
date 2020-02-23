const Discord = require('discord.js');
const client = new Discord.Client();
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const config = require('./config.json');

client.once('ready', () => {
    console.log('Online');
});
client.login(config.token);

client.on('message', message => {
    if (message.content.substring(0, 1) == '!') {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            case '#':
            case 'set':
                getSetInfos(message.channel, args);
            break;
            case "part":
                getPartsInfos(message.channel, args);
            break;
            case 'bl':
                message.channel.send('https://www.bricklink.com/v2/catalog/catalogitem.page?S='+args);
            break;
            case 'bi':
            case "review": 
                message.channel.send(getReview(args));
            break;
            case "bs": 
                message.channel.send('https://brickset.com/sets/'+args);
            break;
            case "LegBot":
            case "help":
                showHelp(message);
            break;
            case "inviteLegBot":
                client.generateInvite(['SEND_MESSAGES']).then(link=>message.author.send(link));
            break;
         }
     }
});


/**************************  FUNCTIONS *******************************/

getReview = function(set) {
    var review = httpGet('https://brickinsights.com/api/sets/'+set+'-1');
    var message = '';

    if (review.error) {
        message = review.error;
    } else {
        message = "**"+review.name+"** ("+review.primary_category.name+", "+ review.year +") \n";
        message += "Rated " + review.average_rating +"/100 \n";
        message += "More reviews and infos at "+ review.url
    }
    return message;
}

getSetInfos = function(channel, setNumber) {
    var set = httpGet('https://brickinsights.com/api/sets/'+setNumber+'-1');
    var sourceUrl, setUrl = 'https://brickinsights.com/sets/'+setNumber+'-1';

    var message = 'toto';
    var rich = null;

    if (set.error) {
        message = set.error;
    } else {
        if (set.urls && set.urls.brickset) {
            setUrl = set.urls.brickset.url;
        }

        const exampleEmbed = new Discord.RichEmbed()
            .setColor('#F2CD37')
            .setTitle(set.name)
            .setURL(setUrl)
            .setThumbnail("https://brickinsights.com/"+set.image_urls.teaser)
            .addField('General', "Set " + setNumber +" "+ set.name +"\n \
                Released in "+ set.year + ", belongs to the "+ set.primary_category.name +" category")
            .addField('Pieces', "Made of **" + set.part_count +"** parts and **"+ set.minifig_count+"** minifigures")
            .addField('Price', formatPrice(set))
            .setFooter('Source : '+sourceUrl);

            channel.send(exampleEmbed);

    }
};

httpGet = function(theUrl) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    // return xmlHttp.responseText;
    var data = JSON.parse(xmlHttp.responseText);
    return data;
}

formatPrice = function(set) {
    message = "Priced **$"+ set.retail_price_usd+"**";
    if (set.retail_price_usd !== set.retail_price_usd_inflation_adjusted) {
        message += " ( $"+ set.retail_price_usd_inflation_adjusted+" with inflation)";
    }
    message += "\n";
    message += "Price per Piece ratio : $"+ set.ppp_usd +"\n"
    return message;
}

showHelp = function(message) {
    var mp = "Hey ! \n Thanks for using this LEGO bot ! \n To use me, use the following commands : \n";
    mp += "`!# or !set [SET NUMBER]`  to have general usefull infos about the set number.\n"
    mp += "`!part [PART ID]`  to have informations about a piece (Bricklink id).\n"
    mp += "`!bs [SET NUMBER]`  to show a link to Brickset about the provided set number \n"
    mp += "`!bl [SET NUMBER]`  to show a BrickLink link to the searched set number \n"
    mp += "`!review [SET NUMBER]`  to have infos about the requested set (rating, reviews...) \n"
    mp += "`!help`  to display this message... Not that useful if you're reading this tho. \n \n"
    mp += "This bot has been made by Thibaut P <3 "

    message.author.send(mp);
}

getPartsInfos = function(channel, partNo) {
    var key = "key="+config.rebrickableToken;
    var initialPartSearch = httpGet('https://rebrickable.com/api/v3/lego/parts/?bricklink_id='+partNo+"&"+key); //2436b

    if (initialPartSearch && initialPartSearch.count >= 1) {
        var rebrickableNo = initialPartSearch.results['0'].part_num; //10201
        var part = httpGet('https://rebrickable.com/api/v3/lego/parts/'+rebrickableNo+"/?" + key);

        const partsInfo = new Discord.RichEmbed()
            .setColor('#F2CD37')
            .setTitle(part.name)
            .setURL(part.part_url)
            .setThumbnail(part.part_img_url)
            .addField('General', part.name +"\n \
                Released in "+ part.year_from + ", at least produced until "+ part.year_to + "\
                Has " + Object.keys(part.molds) + " differents molds")
            .addField('Shop : ', "Bricklink : https://www.bricklink.com/v2/catalog/catalogitem.page?P="+ partNo)
            .setFooter('Source : '+ part.part_url);

            channel.send(partsInfo);
    }
}