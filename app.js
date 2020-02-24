const Discord = require('discord.js');
const client = new Discord.Client();
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const config = require('./config.json');

client.once('ready', () => {
    console.log('Online');
});
client.login(config.token);

client.on('message', message => {
    if (message.content.substring(0, 1) == config.trigger) {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];

        args = args.splice(1);
        switch(cmd) {
            case '#':
            case 'set':
                getSetInfos(message.channel, args);
            break;
            case "part":
                getPartsInfos(message, args);
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
            case "credits":
                showCredits(message);
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
    var BLlink = "https://www.bricklink.com/v2/catalog/catalogitem.page?S="+setNumber;

    if (set.error) {
        message = set.error;
    } else {
        if (set.urls && set.urls.brickset) {
            setUrl = set.urls.brickset.url;
        }

        const exampleEmbed = new Discord.RichEmbed()
            .setColor('#F2CD37')
            .setTitle(setNumber + ' ' + set.name)
            .setURL(setUrl)
            .setThumbnail("https://brickinsights.com/"+set.image_urls.teaser)
            .addField('General',"Released in "+ set.year + ", belongs to the "+ set.primary_category.name +" category")
            .addField('Pieces', "Made of **" + set.part_count +"** parts and **"+ set.minifig_count+"** minifigures")
            .addField('Price', formatPrice(set))
            .addField('Links', "[Brickset]("+set.urls.brickset.url+")   -   [Bricklink]("+BLlink+")   -   [Brick Insight]("+set.urls.brickinsights.url+")")
            .setFooter('Source : Brick Insight');

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
    var mp = "Hey ! \n Thanks for using this LEGO bot ! :kissing_smiling_eyes: \n To use me, type the following commands : \n";
    mp += "`!# or !set [SET NUMBER]`  to have general usefull infos about the set number.\n";
    mp += "`!part [PART ID]`  to have informations about a piece (Bricklink id).\n";;
    mp += "`!bs [SET NUMBER]`  to show a link to Brickset about the provided set number \n";
    mp += "`!bl [SET NUMBER]`  to show a BrickLink link to the searched set number \n";
    mp += "`!review [SET NUMBER]`  to have infos about the requested set (rating, reviews...) \n";
    mp += "`!help`  to display this message... Not that useful if you're reading this tho. \n \n";
    mp += "`!credits`  to show dev credits";

    message.author.send(mp);
}

showCredits = function(message) {
    console.log(client)
    const credits = new Discord.RichEmbed()
            .setColor("#03A9F4")
            .setTitle("LegBot")
            .setThumbnail("https://cdn.discordapp.com/avatars/"+client.user.id+'/'+client.user.avatar+'.png')
            .setURL("https://github.com/ThibautPlg/Discord-LEGO-Bot")
            .addField('General', "This bot has been developped by Thibaut P\n \
            Twitter : [@thibaut_plg](https://twitter.com/thibaut_plg)")
            .addField('APIs and ressources', "\
            - Rebrickable API : https://rebrickable.com/api/\n\
            - Brick Insight public API : https://brickinsights.com/ \n \
            - Brickset links : https://brickset.com \n \
            - BrickLink links : https://www.bricklink \n \
            - BrickOwl links : https://www.brickowl.com\n")
            .addField('Technos', "This bot is based on [discord.js](https://discord.js.org/)")
            .addField('Github', "This bot is available on [Github](https://github.com/ThibautPlg/Discord-LEGO-Bot)");
            message.author.send(credits);
}

getPartsInfos = function(message, partNo) {
    var key = "key="+config.rebrickableToken;
    var color = "";

    //can be a BL or Rebrickable id
    var part = httpGet('https://rebrickable.com/api/v3/lego/parts/?bricklink_id='+partNo+"&"+key); //2436b

    if (part && part.count >= 1) {
        var rebrickableNo = part.results['0'].part_num; //10201
        var productionState = '';

        var bricklinkId = part.results['0'].external_ids.BrickLink;
        var bricklinkUrl = 'https://www.bricklink.com/v2/search.page?q='+rebrickableNo;
        if (bricklinkId) {
           bricklinkUrl = "https://www.bricklink.com/v2/catalog/catalogitem.page?P="+ bricklinkId
        }
        var brickOwlId = part.results['0'].external_ids.BrickOwl;
        var brickOwlUrl = 'https://www.brickowl.com/search/catalog?query=266404'+rebrickableNo;
        if (brickOwlId) {
            brickOwlUrl = "https://www.brickowl.com/search/catalog?query=266404"+ brickOwlId
        }
        var legoId = part.results['0'].external_ids.LEGO ? part.results['0'].external_ids.LEGO : rebrickableNo;
        var legoUrl = 'https://www.lego.com/fr-fr/page/static/pick-a-brick?query='+legoId;

        if (rebrickableNo !== partNo) {
            //We need to query with the rebrickable ID to have further informations.
            var part = httpGet('https://rebrickable.com/api/v3/lego/parts/'+rebrickableNo+"/?" + key);
        }

        if(new Date().getFullYear() <= part.year_to) {
            // Still in production ?
            productionState = "[:green_circle: Still in production !] \n";
            color = "#8BC34A";
        } else {
            productionState = "[:orange_circle:  No more produced] \n";
            color = "#F2CD37";
        }

        const partsInfo = new Discord.RichEmbed()
            .setColor(color)
            .setTitle(part.name)
            .setURL(part.part_url)
            .setThumbnail(part.part_img_url)
            .addField('General', productionState + part.name +"\n \
                Released in "+ part.year_from + ", at least produced until "+ part.year_to);

            if(part.molds.length) {
                partsInfo.addField("Similar to", getSimilarParts(part));
            }

            partsInfo
            .addField('Shop : ', "[Bricklink]("+bricklinkUrl+")  |  [BrickOwl]("+brickOwlUrl+") |  [Lego PaB]("+legoUrl+")", true)
            .setFooter('Source : '+ part.part_url);

            message.channel.send(partsInfo);
    } else {
        message.channel.send("I'm so sorry **"+ message.author.username +"**, I didn't find the part you were looking for. :(");
    }
}

var getSimilarParts = function(part) {
    var molds = part.molds;
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