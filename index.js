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
    else if (message.content.startsWith(`${prefix}play-normal`)) {
        playTracks(message, tracksPath.normal, serverQueue);
        return;
    }
    else if (message.content.startsWith(`${prefix}play-combat`)) {
        playTracks(message, tracksPath.combat, serverQueue);
        return;
    }
    else if (message.content.startsWith(`${prefix}play-jolly`)) {
        playTracks(message, tracksPath.jolly, serverQueue);
    }
    else if (message.content.startsWith(`${prefix}pause`)) {
        pauseTracks(message.guildId);
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

async function playTracks (message, trackPath, serverQueue) {
    const voiceChannel = message.member.voice.channel;
    
    if (!voiceChannel) {
        return message.channel.send('The user making this command should be in a voice channel.');
    }
    
    const player = createAudioPlayer();
    
    const tracks = fs.readdirSync(trackPath);
    const queueContract = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        player: null, 
        tracks: [],
        volume: 5,
        playing: true,
    };    
    
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("0x100000") || !permissions.has("0x200000")) { // permissions for CONNECT and SPEAK
        return message.channel.send("The bot needs permissions to connect and speak in voice channel");
    }

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id, 
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator
    });
    
    // if the queue contract does not exist for the server
    if (!serverQueue) {
        for (i = 0; i < tracks.length; i++) {
            const trackName = tracks[i]
            const fullTrackPath = path.join(trackPath, trackName);
            const trackResource = createAudioResource(fullTrackPath); // requires something called ffmpeg and aconv
            queueContract.tracks.push(trackResource);
        }
        queueContract.connection = connection;
        queueContract.player = player;
    }

    queue.set(message.guildId, queueContract);
    
    try {
        connection.subscribe(player);
        const index = getRandomInt(queueContract.tracks.length);
        play(connection, player, message.guild, queueContract.tracks[index], index);
        message.channel.send(`There are ${queueContract.tracks.length} tracks in the queue`);
    } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return message.channel.send(err);
    }
    return;
}

function play(connection, player, guild, song, index) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        connection.destroy();
        player.stop();
        queue.delete(guild.id);
        return;
    }
    player.on(AudioPlayerStatus.Idle, () => {
        const newIndex = index + getRandomInt(serverQueue.tracks.length);
        play(connection, player, guild, serverQueue.tracks[newIndex], newIndex); 
    });
    player.play(song);
}

function pauseTracks(guildId) {
    const serverQueue = queue.get(guildId);
    if (serverQueue.playing) {
        serverQueue.player.pause();
    }
}

function stopTracks(guildId) {
    const serverQueue = queue.get(guildId);
    if (serverQueue.playing) {
        serverQueue.player.stop();
        serverQueue.connection.destroy();
    }
}

client.login(token);