/**********************LEGACY MODE *****************/
/**
 * This is the old (but better) behaviour that allowed Legbot to read messages from the server.
 * Unfortunately for Legbot, Discord disabled this feature for bots that were on more than 100 servers
 * so we now have to use slash commands. Thanks to the legacy mode, it's still possible to have commands
 * passed in the middle of a sentence, for a more natural flow.
 *
 * You can enable this feature if you're self-hosting Legbot.
 */

client.on('messageCreate', async postedMessage => {
	var regex = new RegExp(config.legacy.trigger+'.*?', 'gi' );

    if (postedMessage.content.match(regex)) {

		var triggerLocation = postedMessage.content.indexOf(config.legacy.trigger);
        var args = postedMessage.content.substring(triggerLocation+1, postedMessage.content.length).split(' ');
		var cmd = args[0];
		args = args[1];

        switch(cmd) {
            case 'set':
				await getSetInfos(args).then(
					async function(result) {
						postedMessage.reply(result)
						.then(function(message) {
							enableDeleteOption(message);
							enableImageEnlargeOption(message, result);
						});
					}
				);
            break;
            case "part":
				await getPartsInfos(args).then(
					async function(result) {
						postedMessage.reply(result)
						.then(function(message) {
							enableDeleteOption(message);
							enableImageEnlargeOption(message, result);
						});
					}
				);
            break;
            case "review":
				await getReview(args).then(
					async function(result) {
						postedMessage.reply(result)
						.then(function(message) {
							enableDeleteOption(message);
							enableImageEnlargeOption(message, result);
						});
					}
				);
            break;
         }
     }
});
