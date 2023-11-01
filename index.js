import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';

import Functions from './modules/functions.js';

dotenv.config();
const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});
client.Functions = Functions;

async function init() {
    Functions.initMySQLConnection(client);

    Functions.loadLocalization();

    Functions.loadEvents(client);
    await client.login(process.env.DISCORD_TOKEN);

    client.commands = new Collection();
    Functions.loadCommands(client);
}

init()