const connections = new Map();

function getConnection(guildId, voiceChannel) {
    if (connections.has(guildId)) return connections.get(guildId);

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator
    });
    connection.on('stateChange', console.log);
    connections.set(guildId, connection);

    return connection;
}

module.exports = { getConnection };