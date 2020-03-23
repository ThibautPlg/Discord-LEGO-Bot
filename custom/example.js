/*************** New command example ************************
You'll be able to add custom commands following this example */

client.on('message', message => {
    if (message.content.substring(0, 1) == config.trigger) {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];

        args = args.splice(1);
        switch(cmd) {
            case 'custom':
				message.author.send("A custom function has been called.");
            break;
         }
     }
});

/* You can also override existing functions by declaring them once
more at the end of a custom file.  ex :

getSetInfos = function(setNumber) {
	do my custom awesome code here;
}
*/