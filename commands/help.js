const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder().setName('legbot')
		.setDescription('Show help and commands of Legbot.'),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		await showHelp(interaction).then(
			async function(result) {
				result.ephemeral= true;
				interaction.editReply(result)
				.then(function(message) { enableDeleteOption(message)});
			}
		);
	},
};