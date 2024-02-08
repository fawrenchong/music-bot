const { SlashCommandBuilder } = require('discord.js');
const { queue } = require('../../queue.js');

function pauseTracks(guildId) {
    const serverQueue = queue.get(guildId);
    if (serverQueue && serverQueue.playing) {
        serverQueue.player.pause();
        serverQueue.playing = false;
        return 'Paused tracks';
    }
    else {
        return 'Tracks already paused, or server queue does not exist.';
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the current track'),
    async execute(interaction) {
        const response = pauseTracks(interaction.guild_id);
        await interaction.reply(response);
    },
    pauseTracks,
}