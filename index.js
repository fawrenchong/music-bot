const Discord = require('discord.js');
const {
    prefix, 
    token,
    tracksPath
} = require('./config.json');
const fs = require('fs');
const path = require('path')

const {joinVoiceChannel, createAudioPlayer, createAudioResource} = require("@discordjs/voice");

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
        return;
    }
    else if (message.content.startsWith(`${prefix}skip`)) {
        return;
    }
    else if (message.content.startsWith(`${prefix}stop`)) {
        return;
    }
    else {
        message.channel.send('Enter a valid command');
    }
});

function readTrack (path) {
    fs.readFile(path, {encoding: 'base64'}, (err, data) => {
        if (err) {
            console.log(`An error has occurred: (${err})`);
        }
        else {
            return data;
        }
    });
}

function processData (data) {
    const raw = Buffer.from(data, 'base64');
    const binaryData = new Uint8Array(new ArrayBuffer(raw.length));
    for (let i = 0; i < raw.length; i++) {
        binaryData[i] = raw.charCodeAt(i);
    }
    const blob = new Blob([binaryData], {'type': 'video/mp4'});
    return blob
}

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
        songs: [],
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
    
    if (!serverQueue) {
        for (i = 0; i < tracks.length; i++) {
            const trackName = tracks[i]
            const fullTrackPath = path.join(trackPath, trackName);
            const trackResource = createAudioResource(fullTrackPath); // requires something called ffmpeg and aconv
            queueContract.songs.push(trackResource);
        }
    }

    queue.set(message.guildId, queueContract);
    
    try {
        queueContract.connection = connection;
        queueContract.player = player;
        connection.subscribe(player);
        play(connection, player, message.guild, queueContract.songs[0]);
    } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return message.channel.send(err);
    }
    return;
}

function play(connection, player, guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        connection.destroy();
        player.stop();
        queue.delete(guild.id);
        return;
    }
    player.play(song);

    // const dispatcher = serverQueue.connection
    //     .play(song)
    //     .on("finish", () => {
    //         serverQueue.songs.shift();
    //         play(guild, serverQueue.songs[0]);
    //     })
    //     .on("error", error => console.error(error));
    // dispatcher.setVolumneLogarithmic(serverQueue.volume / 5);
}

client.login(token);