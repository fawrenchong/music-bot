const Discord = require('discord.js');
const {
    prefix, 
    token,
    tracksPath
} = require('./config.json');

const fs = require.apply('fs');

const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent
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

const queueContract = {
    textChannel: message.channel,
    voiceChannel: voiceChannel,
    connection: null,
    songs: [],
    volume: 5,
    playing: true,
};

async function playTracks (message, path, serverQueue) {
    const voiceChannel = message.member.voice.channel;
    const permissions = voiceChannel.permissionsFor(message.client.user)
    const tracks = fs.readdirSync(path);

    if (!voiceChannel) {
        return message.channel.send("Please join a voice channel");
    }
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send("The bot needs permissions to connect and speak in voice channel");
    }

    if (!serverQueue) {
        
    }
    return;
}

client.login(token);