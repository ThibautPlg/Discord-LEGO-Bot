const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder().setName('credits')
		.setDescription('Show credits of Legbot.'),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		await showCredits(interaction).then(
			async function(result) {
				result.ephemeral= true;
				interaction.editReply(result)
				.then(function(message) { enableDeleteOption(message)});
			}
		);
	},
};