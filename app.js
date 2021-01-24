const Discord = require("discord.js");
const client = new Discord.Client();
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const config = require("./config.json");
const package = require("./package.json");
const fs = require("fs");

client.once("ready", () => {
  console.log("LegBot is Online !");
  log("Fresh start");
});
client.login(config.token);

client.on("message", (postedMessage) => {
  var regex = new RegExp(config.trigger + ".*?", "gi");
  var matches = postedMessage.content.matchAll(regex);

  for (var match of matches) {
    var triggerLocation = match.index;
    var args = postedMessage.content
      .substring(triggerLocation + 1, postedMessage.content.length)
      .split(" ");
    var cmd = args[0];
    args = args[1];

    client.legBotMessage = postedMessage;

    switch (cmd) {
      case "#":
      case "set":
        getSetInfos(args);
        break;
      case "part":
        getPartsInfos(args);
        break;
      case "bl":
        postedMessage.channel.send(
          "https://www.bricklink.com/v2/catalog/catalogitem.page?S=" + args
        );
        log("bl " + args);
        break;
      case "bi":
      case "review":
        getReview(args);
        break;
      case "bs":
        postedMessage.channel.send(
          "https://brickset.com/sets/" + parseSetID(args)
        );
        log("bs " + args);
        break;
      case "LegBot":
      case "help":
        showHelp();
        break;
      case "inviteLegBot":
        client
          .generateInvite({ permissions: ["SEND_MESSAGES"] })
          .then((link) => postedMessage.author.send(link));
        log("invite");
        break;
      case "credits":
        showCredits();
        break;
      case "botinfo":
        showStats();
        break;
    }
  }
});

/**************************  FUNCTIONS *******************************/

getReview = function (set) {
  if (!argumentIsValid(set, "review-no-id ")) {
    return;
  }

  var channel = client.legBotMessage.channel;

  var review = httpGet("https://brickinsights.com/api/sets/" + parseSetID(set));
  var message = "";

  if (review.error) {
    log("review-not-found " + set);
    message = review.error;
  } else {
    message = new Discord.MessageEmbed()
      .setColor("#F2CD37")
      .setTitle(review.name + " " + review.year)
      .setURL(review.url)
      .setThumbnail(
        "https://brickinsights.com/storage/sets/" + parseSetID(set) + ".jpg"
      )
      .addField(
        "Rated",
        review.name + " is rated **" + review.average_rating + "/100**"
      ) /*+ ", belongs to the "+ set.primary_category.name +" category")*/
      .addField("Links", "More reviews at [BrickInsignt](" + review.url + ")")
      .setFooter("Source : BrickInsignt");

    log("review " + set);
  }
  channel.send(message);
};

getSetInfos = function (setNumber) {
  var channel = client.legBotMessage.channel;

  if (!argumentIsValid(setNumber, "set-no-id ")) {
    return;
  }

  var BInsight = "https://brickinsights.com/sets/" + parseSetID(setNumber);
  var BLlink =
    "https://www.bricklink.com/v2/catalog/catalogitem.page?S=" + setNumber;

  var set = askBrickset(
    "getSets",
    "{'setNumber':'" + parseSetID(setNumber) + "'}"
  );

  if (set.matches <= 0) {
    log("set-not-found " + setNumber);
    channel.send("Set " + setNumber + " not found... ");
    client.legBotMessage.react("🙄");
  } else if (set.status && set.status !== "success") {
    log("set-db-error " + setNumber);
    channel.send("Ooops, something is wrong with my database... ");
    client.legBotMessage.react("🙄");
  } else {
    set = set.sets[0];
    let thumbnail = "";
    if (set.image && set.image.imageURL) {
      thumbnail = set.image.imageURL;
    } else if (set.image && set.image.thumbnailURL) {
      thumbnail = set.image.thumbnailURL;
    }
    let notes = "";
    if (set.extendedData && set.extendedData.notes) {
      notes = "\n" + set.extendedData.notes;
    }

    var setCard = new Discord.MessageEmbed()
      .setColor("#F2CD37")
      .setTitle(set.number + " " + set.name)
      .setURL(set.bricksetURL)
      .setThumbnail(set.image.imageURL)
      .addField(
        "General",
        "Released in **" +
          set.year +
          "**, belongs to the **" +
          set.theme +
          "** category" +
          notes
      )
      .addField("Pieces", "Made of **" + set.pieces + "** parts", true);

    if (set.minifigs && set.minifigs > 0) {
      setCard.addField(
        "Minifigures",
        "Contains **" +
          set.minifigs +
          "** minifigure" +
          (set.minifigs > 1 ? "s" : ""),
        true
      );
    }

    setCard
      .addField("Price", formatPrice(set))
      .addField(
        "Links",
        "[Brickset](" +
          set.bricksetURL +
          ")   -   [Bricklink](" +
          BLlink +
          ")   -   [BrickInsight](" +
          BInsight +
          ")"
      )
      .setFooter("Source : Brickset");

    log("set " + setNumber);
    channel.send(setCard);
  }
};

showStats = function () {
  var stats = new Discord.MessageEmbed()
    .setColor("#3F51B5")
    .setTitle("LegBot")
    .setThumbnail(
      "https://cdn.discordapp.com/avatars/" +
        client.user.id +
        "/" +
        client.user.avatar +
        ".png"
    )
    .setURL("https://github.com/ThibautPlg/Discord-LEGO-Bot")
    .addField("ID", client.user.id)
    .addField("Uptime", (process.uptime() + "").toHHMMSS(), true)
    .addField("Version", package.version, true)
    .addField("\u200b", "\u200b", true)
    .addField("Server count", client.guilds.cache.size, true)
    .addField("Total channels", client.channels.cache.size, true)
    .addField("Total users", client.users.cache.size, true);
  log("stats");
  client.legBotMessage.author.send(stats);
};

showHelp = function () {
  var t = config.trigger;
  var help = new Discord.MessageEmbed()
    .setColor("#009688")
    .setTitle("LegBot help")
    .setThumbnail(
      "https://cdn.discordapp.com/avatars/" +
        client.user.id +
        "/" +
        client.user.avatar +
        ".png"
    )
    .addField(
      "Hey !",
      "Thanks for using this LEGO bot ! :kissing_smiling_eyes: \n To use me, type the following commands :"
    )
    .addField(
      "Commands : ",
      "`" +
        t +
        "# or " +
        t +
        "set [SET NUMBER]`  to have general usefull infos about the set number.\n" +
        "`" +
        t +
        "part [PART ID]`  to have informations about a piece (Bricklink id).\n" +
        "`" +
        t +
        "mixeljoint`  to have the list of the most used mixeljoint (with an awesome drawing of each).\n" +
        "`" +
        t +
        "bs [SET NUMBER]`  to show a link to Brickset about the provided set number \n" +
        "`" +
        t +
        "bl [SET NUMBER]`  to show a BrickLink link to the searched set number \n" +
        "`" +
        t +
        "review [SET NUMBER]`  to have infos about the requested set (rating, reviews...) \n" +
        "`" +
        t +
        "help`  to display this message... Not that useful if you're reading this tho. \n " +
        "`" +
        t +
        "inviteLegBot` to get a link to invite LegBot to your server. \n \n" +
        "`" +
        t +
        "credits`  to show dev credits"
    );
  log("help");
  client.legBotMessage.author.send(help);
};

showCredits = function () {
  var credits = new Discord.MessageEmbed()
    .setColor("#03A9F4")
    .setTitle("LegBot")
    .setThumbnail(
      "https://cdn.discordapp.com/avatars/" +
        client.user.id +
        "/" +
        client.user.avatar +
        ".png"
    )
    .setURL("https://github.com/ThibautPlg/Discord-LEGO-Bot")
    .addField(
      "General",
      "This bot has been developped by Thibaut P\n \
        Twitter : [@thibaut_plg](https://twitter.com/thibaut_plg)"
    )
    .addField(
      "APIs and ressources",
      "\
        - Rebrickable API : https://rebrickable.com/api/\n\
        - Brick Insight public API : https://brickinsights.com/ \n \
        - Brickset API : https://brickset.com \n \
        - BrickLink links : https://www.bricklink \n \
        - BrickOwl links : https://www.brickowl.com\n"
    )
    .addField(
      "Technos",
      "This bot is based on [discord.js](https://discord.js.org/)"
    )
    .addField(
      "Github",
      "This bot is available on [Github](https://github.com/ThibautPlg/Discord-LEGO-Bot)"
    );
  log("credits");
  client.legBotMessage.author.send(credits);
};

getPartsInfos = function (partNo) {
  if (!argumentIsValid(partNo, "part-no-id ")) {
    return;
  }
  var key = "key=" + config.rebrickableToken;
  var color = "";

  partNo = [partNo];
  //can be a BL or Rebrickable id
  var part = httpGet(
    "https://rebrickable.com/api/v3/lego/parts/?bricklink_id=" +
      partNo +
      "&" +
      key
  ); //2436b

  if (part && part.count >= 1) {
    var rebrickableNo = part.results["0"].part_num; //10201
    var productionState = "";

    var bricklinkId = part.results["0"].external_ids.BrickLink;
    var bricklinkUrl =
      "https://www.bricklink.com/v2/search.page?q=" + rebrickableNo;
    if (bricklinkId) {
      bricklinkUrl =
        "https://www.bricklink.com/v2/catalog/catalogitem.page?P=" +
        bricklinkId;
    }
    var brickOwlId = part.results["0"].external_ids.BrickOwl;
    var brickOwlUrl =
      "https://www.brickowl.com/search/catalog?query=266404" + rebrickableNo;
    if (brickOwlId) {
      brickOwlUrl =
        "https://www.brickowl.com/search/catalog?query=266404" + brickOwlId;
    }
    var legoId = part.results["0"].external_ids.LEGO
      ? part.results["0"].external_ids.LEGO
      : rebrickableNo;
    var legoUrl =
      "https://www.lego.com/fr-fr/page/static/pick-a-brick?query=" + legoId;

    if (rebrickableNo !== partNo) {
      //We need to query with the rebrickable ID to have further informations.
      var part = httpGet(
        "https://rebrickable.com/api/v3/lego/parts/" +
          rebrickableNo +
          "/?" +
          key
      );
    }

    if (new Date().getFullYear() <= part.year_to) {
      // Still in production ?
      productionState = "[:green_circle: Still in production !] \n";
      color = "#8BC34A";
    } else {
      productionState = "[:orange_circle:  No more produced] \n";
      color = "#F2CD37";
    }

    const partsInfo = new Discord.MessageEmbed()
      .setColor(color)
      .setTitle(part.name)
      .setURL(part.part_url)
      .setThumbnail(part.part_img_url)
      .addField(
        "General",
        productionState +
          part.name +
          "\n \
                Released in " +
          part.year_from +
          ", at least produced until " +
          part.year_to
      );

    if (part.molds && part.molds.length) {
      partsInfo.addField("Similar to", getSimilarParts(part));
    }

    partsInfo
      .addField(
        "Shop : ",
        "[Bricklink](" +
          bricklinkUrl +
          ")  |  [BrickOwl](" +
          brickOwlUrl +
          ") |  [Lego PaB](" +
          legoUrl +
          ")",
        true
      )
      .setFooter("Source : " + part.part_url);

    client.legBotMessage.channel.send(partsInfo);
    log("part " + partNo);
  } else {
    client.legBotMessage.channel.send(
      "I'm so sorry **" +
        client.legBotMessage.author.username +
        "**, I didn't find the part you were looking for. :("
    );
    client.legBotMessage.react("🙄");
    log("part-not-found " + partNo);
  }
  if (!part) {
    client.legBotMessage.channel.send(
      "It looks like Rebrickable is down, I can't get my data ! 😐"
    );
    client.legBotMessage.react("😐");
    log("part-not-found-down " + partNo);
  }
};

var getSimilarParts = function (part) {
  var molds = part.molds;
  var txt = "";
  if (molds) {
    var total = molds.length;
    var some = molds;
    if (total > 5) {
      some = molds.slice(0, 5);
    }
    for (mold in some) {
      txt +=
        "[" +
        some[mold] +
        "](https://rebrickable.com/parts/" +
        some[mold] +
        ")";
      if (mold < total - 1) {
        txt += "  |  "; //just to add sexy separators
      }
    }
  }
  return txt;
};

/*************************   Stuff used by function      ****************************/

httpGet = function (theUrl) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", theUrl, false); // false for synchronous request
  xmlHttp.timeout = 5000; //5 sec of timeout
  xmlHttp.send(null);
  // return xmlHttp.responseText;
  var data = JSON.parse(xmlHttp.responseText)
    ? JSON.parse(xmlHttp.responseText)
    : false;
  return data;
};

String.prototype.toHHMMSS = function () {
  var sec_num = parseInt(this, 10); // don't forget the second param
  var hours = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - hours * 3600) / 60);
  var seconds = sec_num - hours * 3600 - minutes * 60;

  if (hours < 10) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  var time = hours + ":" + minutes + ":" + seconds;
  return time;
};

askBrickset = function (endpoint, what) {
  var baseUrl = "https://brickset.com/api/v3.asmx/";
  var url = baseUrl + endpoint;

  request = "apiKey=" + config.bricksetApiKey;
  request += "&userhash=";
  request += "&params=" + what;

  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("POST", url, false);
  xmlHttp.timeout = 5000; //5 sec of timeout
  xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xmlHttp.send(request);

  var data = JSON.parse(xmlHttp.responseText)
    ? JSON.parse(xmlHttp.responseText)
    : false;
  return data;
};

formatPrice = function (set) {
  let sign = "";
  let price = "";
  if (set.LEGOCom && set.LEGOCom.US && set.LEGOCom.US.retailPrice) {
    sign = "$";
    price = set.LEGOCom.US.retailPrice;
  } else if (set.LEGOCom && set.LEGOCom.UK && set.LEGOCom.UK.retailPrice) {
    sign = "£";
    price = set.LEGOCom.UK.retailPrice;
  } else {
    return "No price data available.";
  }
  message = "Priced **" + sign + price + "**";
  // Different API, no more inflation adjusted prince :(
  // if (set.retail_price_usd !== set.retail_price_usd_inflation_adjusted) {
  //     message += " ( $"+ set.retail_price_usd_inflation_adjusted+" with inflation)";
  // }
  message += "\n";
  var ppp = (price / set.pieces).toFixed(2);
  message += "Price per Piece ratio : **" + sign + ppp + "**\n";
  return message;
};

/* Is my arg something valid ?
 * Returns true if the arg is a string containing letters and numbers
 */
argumentIsValid = function (arg, toLog) {
  if (arg === undefined || arg.length < 1) {
    log(toLog + arg);
    client.legBotMessage.react("🤔");
    return false;
  } else if (!arg.match(/\w+/)) {
    log("no args");
    return false;
  } else {
    return true;
  }
};
/* Check if given string has a "-n" format,
 * if not add "-1" to catch the first set
 * for example, it exists 6862-1 (M-Tron) and 6862-2 (DC Super Heroes)
 */
parseSetID = function (setId) {
  if (setId.match(/\-\d$/gim)) {
    return setId;
  } else {
    return setId + "-1";
  }
};

/********************************* Logs  *******************************/
if (config && config.log && config.log.active) {
  var logfile = config.log.logfile || "log.txt";
  // Add a dated prefix to the logfile
  logfile = new Date().toISOString().slice(0, 10) + "_" + logfile;
  var logger = fs.createWriteStream(logfile, {
    flags: "a",
  });
}

log = function (msg) {
  if (config && config.log && config.log.active && !!logger) {
    logger.write(new Date().toISOString().slice(0, 19) + "  " + msg + "\n");
    console.log(new Date().toISOString().slice(0, 19) + "  " + msg + "\n");
  }
};

debug = function (msg) {
  if (config && config.log && config.log.debug && !!logger) {
    console.log(msg + "\n");
  }
};
/*********************** Custom functions if needed *********************/
if (config && config.moreFunctions) {
  var customFiles = config.moreFunctions;
  if (!Array.isArray(config.moreFunctions)) {
    customFiles = [customFiles];
  }
  customFiles.forEach((customFile) => {
    eval(fs.readFileSync(customFile) + "");
  });
}
