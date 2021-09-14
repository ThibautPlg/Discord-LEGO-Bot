/*************** Random set of the day ************************
Fetch the random set of the day from Brickset
This command REQUIRE an external RSS fetcher that was nos implemented
into this function (lazy me...).
Check this Gist for the php script that allows that :
https://gist.github.com/ThibautPlg/6ac975566323157f802c91c7cb77993b
*/

client.on('messageCreate', message => {
    if (message.content.substring(0, 1) == config.trigger) {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];

        args = args.splice(1);
        switch(cmd) {
            case 'day':
				getRandomSetOfTheDay();
            break;
         }
     }
});

getRandomSetOfTheDay = function() {

	log("randomSetOfTheDay");

	if (config && config.randomSetURL) {

		var channel = client.legBotMessage.channel;
		fetch(config.randomSetURL).then(res => res.text())
		.then(text => getSetInfos(text));
	} else {
		// No random URL to fetch, quitting.
		return;
	}
}
