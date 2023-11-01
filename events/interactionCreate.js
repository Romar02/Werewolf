export default {
    async execute(interaction) {
        const client = interaction.client;

        if (interaction.isButton()) { }

        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: client.Functions.getLocale(interaction.locale ?? 'en', 'errorCommand'), ephemeral: true });
            }
        }
    },
};