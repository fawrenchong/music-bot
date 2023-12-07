const Discord = require('discord.js');
const {
    prefix, 
    token,
} = require('./config.json');

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

client.on('messageCreate', message => {
    console.log('Message');
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    if (message.content.startsWith(`${prefix}ping`)) {
        console.log('Ping');
    }
    else if (message.content.startsWith(`${prefix}play`)) {
        return;
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

client.login(token);