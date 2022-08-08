/*************** Random set of the day ************************
Fetch the random set of the day from Brickset
This command REQUIRE an external RSS fetcher that was nos implemented
into this function (lazy me...).
Check this Gist for the php script that allows that :
https://gist.github.com/ThibautPlg/6ac975566323157f802c91c7cb77993b
*/
const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const config = require('../config.json');

if (config && config.randomSetURL) {
	module.exports = {
		data: new SlashCommandBuilder().setName('setoftheday')
			.setDescription('Get Brickset\'s random set of the day.'),
		async execute(interaction) {
			await interaction.deferReply();
			await getRandomSetOfTheDay(interaction);
		},
	};

	getRandomSetOfTheDay = function(interaction) {

		log("randomSetOfTheDay,0");

		fetch(config.randomSetURL).then(res => res.text())
		.then(text =>
			getSetInfos(text, interaction).then(
				async function(result) {
					interaction.editReply(result)
					.then(function(message) {
						enableDeleteOption(message),
						enableImageEnlargeOption(message, result)
					});
				}
			)
		);
	}
}