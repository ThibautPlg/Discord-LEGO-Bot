const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder().setName('part')
		.setDescription('Query general informations about a piece.')
		.addStringOption(option =>
			option.setName('bricklink_id')
				.setDescription('Bricklink reference')
				.setRequired(true)
		),
	async execute(interaction) {
		let args = interaction.options.getString('bricklink_id');
		await interaction.deferReply();

		await argumentIsValid(args, interaction, "part-no-id,").then(
			async function(isValid) {
				if (!isValid) {
					return;
				} else {
					await getPartsInfos(args, false, interaction).then(
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