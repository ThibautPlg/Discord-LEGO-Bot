const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder().setName('set')
		.setDescription('Query general informations about a set.')
		.addStringOption(option =>
			option.setName('set_number')
				.setDescription('LEGO Set reference')
				.setRequired(true)
		),
	async execute(interaction) {
		let args = interaction.options.getString('set_number');
		await interaction.deferReply();

		await argumentIsValid(args, interaction, "set-no-id,").then(
			async function(isValid) {
				if (!isValid) {
					return;
				} else {
					await getSetInfos(args, interaction).then(
						async function(result) {
							interaction.editReply(result)
							.then(function(message) {
								enableDeleteOption(message),
								enableImageEnlargeOption(message, result)
							});
						}
					);
				}
			}
		)
	},
};


