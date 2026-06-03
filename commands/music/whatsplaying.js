const { getQueue } = require("../../managers/queueManager");
const { SlashCommandBuilder } = require('discord.js');

function whatsPlaying(guildId) {
    const serverQueue = getQueue(guildId);
    if (serverQueue && serverQueue.playing) {
        const currentTrack = serverQueue.tracks[serverQueue.index];
        return `Currently playing: **${currentTrack.metadata.title}**`;
    }
    else {
        return 'No tracks are currently playing';
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whatsplaying')
        .setDescription('Get the title of the currently playing track'),

    async execute(interaction) {
        const response = await whatsPlaying(interaction.guildId);
        await interaction.reply(response);
    },
    whatsPlaying,
}