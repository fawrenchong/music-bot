const { SlashCommandBuilder } = require('discord.js');
const { getQueue, deleteQueue } = require('../../managers/queueManager.js');

function stopTracks(guildId) {
    const serverQueue = getQueue(guildId);
    if (serverQueue && serverQueue.playing) {
        serverQueue.player.stop();
        serverQueue.connection.destroy();
        return 'Stopped playing music'
    }
    else {
        return 'Tracks not playing, or server queue does not exist';
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop playing tracks and destroy the bot\'s current connection'),
    async execute(interaction) {
        const response = await stopTracks(interaction.guildId);
        await interaction.reply(response);
    },
    stopTracks,
}