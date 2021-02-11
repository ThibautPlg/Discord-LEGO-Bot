/*************** New command example ************************
You'll be able to add custom commands following this example */

client.on('message', message => {
    if (message.content.substring(0, 1) == config.trigger) {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];

        args = args.splice(1);
        switch(cmd) {
            case 'mixeljoint':
				getMixelJoints();
            break;
         }
     }
});

getMixelJoints = function() {
	var mixelJoints = [
		{
			name: "Plate, Modified 1 x 2 with Small Tow Ball Socket on Side",
			artisticRepresantation: "8c",
			id: "14704",
			img: "https://img.bricklink.com/ItemImage/PN/86/14704.png",
			bl: "https://www.bricklink.com/v2/catalog/catalogitem.page?P=14704&name=Plate,%20Modified%201%20x%202%20with%20Small%20Tow%20Ball%20Socket%20on%20Side&category=%5BPlate,%20Modified%5D#T=C",
			rb: "https://rebrickable.com/parts/14704/plate-special-1-x-2-59mm-centre-side-cup/"
		},
		{
			name: "Plate, Modified 1 x 2 with Tow Ball on Side",
			artisticRepresantation: "8o",
			id: "14417",
			img: "https://img.bricklink.com/ItemImage/PN/85/14417.png",
			bl: "https://www.bricklink.com/v2/catalog/catalogitem.page?P=14417&name=Plate,%20Modified%201%20x%202%20with%20Tow%20Ball%20on%20Side&category=%5BPlate,%20Modified%5D#T=C",
			rb: "https://rebrickable.com/parts/14417/plate-special-1-x-2-with-59mm-centre-side-ball/"
		},
		{
			name: "Plate, Modified 1 x 2 with Small Tow Ball Socket on End",
			artisticRepresantation: "=c",
			id: "14418",
			img: "https://img.bricklink.com/ItemImage/PN/86/14418.png",
			bl: "https://www.bricklink.com/v2/catalog/catalogitem.page?P=14418&name=Plate,%20Modified%201%20x%202%20with%20Small%20Tow%20Ball%20Socket%20on%20End&category=%5BPlate,%20Modified%5D#T=C",
			rb: "https://rebrickable.com/parts/14418/plate-special-1-x-2-59mm-end-cup/"
		},
		{
			name: "Plate, Modified 1 x 2 with Tow Ball and Small Tow Ball Socket on Ends",
			artisticRepresantation: "o=c",
			id: "14419",
			img: "https://img.bricklink.com/ItemImage/PN/85/14419.png",
			bl: "https://www.bricklink.com/v2/catalog/catalogitem.page?P=14419&name=Plate,%20Modified%201%20x%202%20with%20Tow%20Ball%20and%20Small%20Tow%20Ball%20Socket%20on%20Ends&category=%5BPlate,%20Modified%5D#T=C",
			rb: "https://rebrickable.com/parts/14419/plate-special-1-x-2-with-59mm-end-cup-and-ball/"
		},
		{
			name: "Plate, Modified 2 x 2 with Tow Ball and Hole",
			artisticRepresantation: "[]-o",
			id: "15456",
			img: "https://img.bricklink.com/ItemImage/PN/86/15456.png",
			bl: "https://www.bricklink.com/v2/catalog/catalogitem.page?P=15456&name=Plate,%20Modified%202%20x%202%20with%20Tow%20Ball%20and%20Hole&category=%5BPlate,%20Modified%5D#T=C",
			rb: "https://rebrickable.com/parts/15456/plate-special-2-x-2-with-towball-and-hole/"
		}
	]

	const mixelMessage = new Discord.MessageEmbed()
		.setColor("#673AB7")
		.setTitle("Mixel Joints");

		for (var piece of mixelJoints){
			mixelMessage.addField(
					piece['name'],
					"Part id ["+piece['id']+"]("+piece['bl']+") | **"+piece['artisticRepresantation']+"**",
					true
			)
		}

	client.legBotMessage.channel.send(mixelMessage);
	log("mixelJoint");
}
