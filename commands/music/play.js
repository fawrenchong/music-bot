const { SlashCommandBuilder } = require('discord.js');
const { tracksPath } = require('../../config.json');
const fs = require('fs');
const path = require('path')
const {joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus} = require("@discordjs/voice");
const { queue } = require('../../queue.js')
const { pauseTracks } = require('./pause.js');

const moods = {
    ambient: 'ambient', 
    jolly: 'jolly', 
    combat: 'combat'
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getTracks(tracksPath) {
    const trackNames = fs.readdirSync(tracksPath);
    const tracks = []
    // Creates audio resources for the player from the tracks in the directory
    for (i = 0; i < trackNames.length; i++) {
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
    else if (serverQueue.mood == moods.ambient) {
        tracks = getTracks(tracksPath.ambient);
    }
    else if (serverQueue.mood == moods.combat) {
        tracks = getTracks(tracksPath.combat);
    }
    else if (serverQueue.mood == moods.jolly) {
        tracks = getTracks(tracksPath.jolly);
    }
    return tracks;
}

// Plays a single track
function play(connection, player, guildId, track) {
    const serverQueue = queue.get(guildId);
    console.log(`There are ${serverQueue.tracks.length} tracks left in the queue`);

    if (!track) {
        console.log('Empty track discovered, destroying connection');
        connection.destroy();
        player.stop();
        queue.delete(guildId);
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
            play(connection, player, guildId, serverQueue.tracks[serverQueue.index]); 
        });
        serverQueue.listenerSet = true;
    }
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
                    { name: 'Jolly', value: 'jolly' }
        )),
    async execute(interaction) {
        var serverQueue = queue.get(interaction.guild_id);
        const category = interaction.options.getString('category');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            await interaction.reply('The user making this command should be in a voice channel.');
        }
        
        var tracks;
        if (category == moods.ambient) {
            tracks = getTracks(tracksPath.ambient);
        }
        else if (category == moods.combat) {
            tracks = getTracks(tracksPath.combat);
        }
        else if (category == moods.jolly) {
            tracks = getTracks(tracksPath.jolly);
        }
        
        const permissions = voiceChannel.permissionsFor(interaction.user);
        if (!permissions.has("0x100000") || !permissions.has("0x200000")) { // permissions for CONNECT and SPEAK
            await interaction.reply('The bot needs permissions to connect and speak in voice channel');
        }
        
        const player = createAudioPlayer();
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id, 
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator
        });
        // if the queue contract does not exist for the server, 
        // makes a new queue contract as a server queue, and maps the server ID to it. 
        if (!serverQueue) {
            const queueContract = {
                textChannel: interaction.channel,
                voiceChannel: voiceChannel,
                connection: connection,
                serverId: voiceChannel.guild.id,
                player: player, 
                listenerSet: false,
                tracks: tracks,
                index: 0,
                category: category,
                volume: 5,
                playing: true,
            };    
            serverQueue = queueContract;
            queue.set(interaction.guild_id, serverQueue);
            connection.subscribe(player);
            queueContract.index = getRandomInt(serverQueue.tracks.length);
        }
        else if (serverQueue.category != category) {
            pauseTracks(serverQueue.serverId);
            serverQueue.tracks = tracks;
            const index = getRandomInt(serverQueue.tracks.length);
            serverQueue.index = index;
            serverQueue.category = category;
        }
        try {
            play(serverQueue.connection, serverQueue.player, interaction.guild_id, serverQueue.tracks[serverQueue.index]);
            await interaction.reply(`There are ${serverQueue.tracks.length} tracks in the queue`);
        } catch (err) {
            queue.delete(interaction.guild_id);
            return message.channel.send(err);
        }
        return;
    }
}