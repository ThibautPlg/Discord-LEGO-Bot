const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder().setName('search')
		.setDescription('Search a set by name.')
		.addStringOption(option =>
			option.setName('query')
				.setDescription('Search query')
				.setRequired(true)
		)
		.addIntegerOption(option =>
			option.setName('number_of_results')
				.setDescription('Number of wanted results')
		),
	async execute(interaction) {
		let args = interaction.options.getString('query');
		await interaction.deferReply();
		await searchBrickset(args, interaction).then(
			async function(result) {
				interaction.editReply(result)
				.then(function(message) {
					enableDeleteOption(message),
					enableImageEnlargeOption(message, result)
				});
			}
		)
	},
};