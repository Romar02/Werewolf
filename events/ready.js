export default {
    async execute(client) {
        console.log(`Bot ${client.user.tag} start in ${client.guilds.cache.size} guilds.`);
        client.launchDate = new Date();
    },
};
