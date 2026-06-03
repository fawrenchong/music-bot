const { joinVoiceChannel } = require('@discordjs/voice');
const connections = new Map();

function getConnection(guildId, voiceChannel) {
    if (connections.has(guildId)) return connections.get(guildId);

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator
    });
    connection.on('stateChange', (oldState, newState) => {
            console.log(
                `Connection: ${oldState.status} -> ${newState.status}`
            );
        });
    connections.set(guildId, connection);

    return connection;
}

module.exports = { getConnection };