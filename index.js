const Discord = require('discord.js');
const {
    prefix, 
    token,
    tracksPath
} = require('./config.json');
const fs = require('fs');
const path = require('path')

const {joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus} = require("@discordjs/voice");

const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildVoiceStates
    ]
});

const moods = {
    ambient: 'ambient', 
    jolly: 'jolly', 
    combat: 'combat'
}

client.once('ready', () => {
    console.log('Ready');
});

client.once('reconnecting', () => {
    console.log('Reconnecting...');
});

client.once('disconnect', () => {
    console.log('Disconnected');
});

const queue = new Map();

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

client.on('messageCreate', message => {
    const serverQueue = queue.get(message.guildId);

    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    if (message.content.startsWith(`${prefix}ping`)) {
        console.log('Ping');
    }
    else if (message.content.startsWith(`${prefix}play-ambient`)) {
        playTracks(message, tracksPath.ambient, moods.ambient, serverQueue);
        return;
    }
    else if (message.content.startsWith(`${prefix}play-combat`)) {
        playTracks(message, tracksPath.combat, moods.combat, serverQueue);
        return;
    }
    else if (message.content.startsWith(`${prefix}play-jolly`)) {
        playTracks(message, tracksPath.jolly, moods.jolly, serverQueue);
    }
    else if (message.content.startsWith(`${prefix}pause`)) {
        pauseTracks(message.guildId);
        return;
    }
    else if (messsage.content.startsWith(`${prefix}unpause`)) {
        unpauseTracks(message.guildId);
        return;
    }
    else if (message.content.startsWith(`${prefix}skip`)) {
        return;
    }
    else if (message.content.startsWith(`${prefix}stop`)) {
        stopTracks(message.guildId);
        return;
    }
    else {
        message.channel.send('Enter a valid command');
    }
});

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

async function playTracks (message, tracksPath, mood, serverQueue) {
    const voiceChannel = message.member.voice.channel;
    
    if (!voiceChannel) {
        return message.channel.send('The user making this command should be in a voice channel.');
    }
    
    const tracks = getTracks(tracksPath)
    
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("0x100000") || !permissions.has("0x200000")) { // permissions for CONNECT and SPEAK
        return message.channel.send("The bot needs permissions to connect and speak in voice channel");
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
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: connection,
            serverId: voiceChannel.guild.id,
            player: player, 
            listenerSet: false,
            tracks: tracks,
            index: 0,
            mood: mood,
            volume: 5,
            playing: true,
        };    
        serverQueue = queueContract;
        queue.set(message.guildId, serverQueue);
        connection.subscribe(player);
        queueContract.index = getRandomInt(serverQueue.tracks.length);
    }
    else if (serverQueue.mood != mood) {
        pauseTracks(serverQueue.serverId);
        serverQueue.tracks = tracks;
        const index = getRandomInt(serverQueue.tracks.length);
        serverQueue.index = index;
        serverQueue.mood = mood;
    }
    try {
        play(serverQueue.connection, serverQueue.player, message.guild.id, serverQueue.tracks[serverQueue.index]);
        message.channel.send(`There are ${serverQueue.tracks.length} tracks in the queue`);
    } catch (err) {
        queue.delete(message.guild.id);
        return message.channel.send(err);
    }
    return;
}

// Plays a single track
function play(connection, player, guildId, track) {
    const serverQueue = queue.get(guildId);
    console.log(`There are ${serverQueue.tracks.length} tracks left in the queue`);

    if (!track) {
        connection.destroy();
        player.stop();
        queue.delete(guildId);
        return;
    }
    if (!serverQueue.listenerSet) {
        player.on(AudioPlayerStatus.Idle, () => {
            if (serverQueue.tracks.length == 0) {
                repopulateQueue(serverQueue);
            }
            else {
                serverQueue.tracks.splice(serverQueue.index, 1); // finished audio resources cannot be replayed, so they are removed. 
            }
            serverQueue.index = getRandomInt(serverQueue.tracks.length);
            play(connection, player, guildId, serverQueue.tracks[serverQueue.index]); 
        });
        serverQueue.listenerSet = true;
    }
    player.play(track);
    serverQueue.playing = true;
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
    serverQueue.tracks = tracks;
    return;
}

function pauseTracks(guildId) {
    const serverQueue = queue.get(guildId);
    if (serverQueue && serverQueue.playing) {
        serverQueue.player.pause();
        serverQueue.playing = false;
    }
    return;
}

function unpauseTracks(guildId) {
    const serverQueue = queue.get(guildId);
    if (serverQueue && !serverQueue.playing) {
        serverQueue.player.unpause();
        serverQueue.playing = true;
    }
    return;
}

function stopTracks(guildId) {
    const serverQueue = queue.get(guildId);
    if (serverQueue && serverQueue.playing) {
        serverQueue.player.stop();
        serverQueue.connection.destroy();
    }
    return;
}

client.login(token);