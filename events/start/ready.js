const { Events, ActivityType, REST, Routes, ApplicationCommandType } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();
const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`✅ ${client.user.tag} está online.`);

        const guild = await client.guilds.fetch(GUILD_ID);

        let status = [
            {
                name: '🎬 Em 5, 4, 3, 2...',
                type: ActivityType.Custom,
            },
        ];
        client.user.setStatus('online');
        /* setInterval(() => {
            let random = Math.floor(Math.random() * status.length);
            client.user.setActivity(status[random]);
        }, 10000); */

    },
};
