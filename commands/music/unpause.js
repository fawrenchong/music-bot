const { SlashCommandBuilder } = require('discord.js');
const { queue } = require('../../queue.js');

function unpauseTracks(guildId) {
    const serverQueue = queue.get(guildId);
    if (serverQueue && !serverQueue.playing) {
        serverQueue.player.unpause();
        serverQueue.playing = true;
        return 'Paused tracks.';
    }
    else {
        return 'Tracks already not playing, or server queue does not exist.';
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unpause')
        .setDescription('Unpauses the tracks'),
    async execute(interaction) {
        const response = await unpauseTracks(interaction.guild_id);
        await interaction.reply(response);
    },
    unpauseTracks,
}