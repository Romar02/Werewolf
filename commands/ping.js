import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
    options: {
        activate: true,
        guilds: ['753600338497634394'],
    },
    async execute(interaction) {
        return interaction.reply(interaction.client.Functions.getLocale(interaction.locale ?? 'en', 'ping'));
    },
};
