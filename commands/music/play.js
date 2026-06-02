const { SlashCommandBuilder } = require('discord.js');
const { tracksPath } = require('../../config.json');
const fs = require('fs');
const path = require('path')
const {joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus} = require("@discordjs/voice");
const { queue } = require('../../managers/queueManager.js')
const { pauseTracks } = require('./pause.js');
const { getPlayer } = require('../../managers/playerManager.js');
const { getConnection } = require('../../managers/connectionManager.js');
const { createQueue, getQueue } = require('../../managers/queueManager.js');

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getTracks(tracksPath) {
    const trackNames = fs.readdirSync(tracksPath);
    const tracks = []
    // Creates audio resources for the player from the tracks in the directory
    for (let i = 0; i < trackNames.length; i++){
        const trackName = trackNames[i]
        const fullTrackPath = path.join(tracksPath, trackName);
        const trackResource = createAudioResource(fullTrackPath, {
            metadata: {
                title: trackName
            }
        }); // requires something called ffmpeg and aconv
        tracks.push(trackResource);
    }
    return tracks;
}

function repopulateQueue(serverQueue) {
    var tracks;
    if (!serverQueue) {
        return;
    }
    else {
        tracks = getTracks(tracksPath[serverQueue.category])
    }
    return tracks;
}

// Plays a single track
function play(guildId, track) {
    var serverQueue = getQueue(guildId);
    const connection = serverQueue.connection;
    const player = serverQueue.player;
    console.log(`There are ${serverQueue.tracks.length} tracks left in the queue`);

    if (!track) {
        console.log('Empty track discovered, destroying connection');
        connection.destroy();
        player.stop();
        deleteQueue(guildId);
        return;
    }
    if (!serverQueue.listenerSet) {
        player.on(AudioPlayerStatus.Idle, () => {

            if (serverQueue.tracks.length > 0) {
                serverQueue.tracks.splice(serverQueue.index, 1); // finished audio resources cannot be replayed, so they are removed. 
            }
            // Cannot be an 'else' statement, needs to be a check after the potentially last track has been removed.
            if (serverQueue.tracks.length == 0) {
                const newTracks = repopulateQueue(serverQueue);
                serverQueue.tracks = newTracks;
                console.log(`Repopulated queue, there are ${serverQueue.tracks.length} tracks in the queue`);
            }

            serverQueue.index = getRandomInt(serverQueue.tracks.length);
            play(serverQueue.serverId, serverQueue.tracks[serverQueue.index]); 
        });
        serverQueue.listenerSet = true;
    }
    console.log(`Playing track ${track.metadata.title}`);
    player.play(track);
    serverQueue.playing = true;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('play a track')
        .addStringOption(option => 
            option.setName('category')
                .setDescription('Track category')
                .setRequired(true)
                .addChoices(
                    { name: 'Ambient', value: 'ambient' },
                    { name: 'Combat', value: 'combat' },
                    { name: 'Jolly', value: 'jolly' },
                    { name: 'Boss', value: 'boss' },
                    { name: 'Boss 2', value: 'boss2' },
                    { name: 'Boss 3', value: 'boss3' },
                    { name: 'Boss 4', value: 'boss4' },
                    { name: 'Royal', value: 'royal' }
        )),
    async execute(interaction) {
        var serverQueue = getQueue(interaction.guildId);
        const category = interaction.options.getString('category');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            await interaction.reply('The user making this command should be in a voice channel');
        }
        
        var tracks = getTracks(tracksPath[category]);
        
        const permissions = voiceChannel.permissionsFor(interaction.user);
        if (!permissions.has("0x100000") || !permissions.has("0x200000")) { // permissions for CONNECT and SPEAK
            await interaction.reply('The bot needs permissions to connect and speak in voice channel');
        }
        
        const player = getPlayer(interaction.guildId);
        const connection = getConnection(interaction.guildId, voiceChannel);

        // if the queue contract does not exist for the server, 
        // makes a new queue contract as a server queue, and maps the server ID to it. 
        if (!serverQueue) {
             serverQueue = createQueue(interaction.guildId, {
                textChannel: interaction.channel,
                voiceChannel: voiceChannel,
                connection: connection,
                player: player,
                tracks: tracks,
                index: getRandomInt(tracks.length),
                category: category,
                volume: 5
            });
            
            console.log(`Added queue contract for server ${interaction.guildId}`);
            connection.subscribe(player);
        }
        // if the queue contract already exists, but the category of tracks requested is different from the category of tracks in the existing queue,
        // pauses the existing queue, replaces the existing queue's tracks with tracks from the new category, and resets the track index to a random value.
        else if (serverQueue.category != category) {
            pauseTracks(serverQueue.serverId);
            serverQueue.tracks = tracks;
            const index = getRandomInt(serverQueue.tracks.length);
            serverQueue.index = index;
            serverQueue.category = category;
        }
        try {
            play(interaction.guildId, serverQueue.tracks[serverQueue.index]);
            await interaction.reply(`There are ${serverQueue.tracks.length} tracks in the queue`);
        } catch (err) {
            deleteQueue(interaction.guildId);
            return interaction.channel.send(err);
        }
        return;
    }
}