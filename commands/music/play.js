const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('play a track')
        .addStringOption(option => {
            option.setName('category')
                .setDescription('The track category')
                .setRequired(true)
                .addChoices(
                    { name: 'Ambient', value: 'ambient' },
                    { name: 'Combat', value: 'combat' },
                    { name: 'Jolly', value: 'jolly' }
                )
        }), 
    async execute(interaction) {
        const category = interaction.options.getString('category');
        const voiceChannel = interaction.member.voice.channel;
    }
}