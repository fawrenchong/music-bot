const queues = new Map();

function createQueue(guildId, data) {
    const queueContract = {
        textChannel: data.textChannel,
        voiceChannel: data.voiceChannel,
        connection: data.connection,
        serverId: guildId,
        player: data.player,
        listenerSet: false,
        tracks: data.tracks,
        index: data.index ?? 0,
        category: data.category,
        volume: data.volume ?? 5,
        playing: true,
    };

    queues.set(guildId, queueContract);

    console.log(`[QueueManager] Created queue for ${guildId}`);

    return queueContract;
}

function getQueue(guildId) {
    return queues.get(guildId);
}

function updateQueue(guildId, updates) {
    const existing = queues.get(guildId);
    if (!existing) return null;

    const updated = {
        ...existing,
        ...updates
    };

    queues.set(guildId, updated);
    return updated;
}

function deleteQueue(guildId) {
    queues.delete(guildId);
    console.log(`[QueueManager] Deleted queue for ${guildId}`);
}

module.exports = {
    createQueue,
    getQueue,
    updateQueue,
    deleteQueue
};