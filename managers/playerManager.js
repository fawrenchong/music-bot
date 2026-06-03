const { createAudioPlayer, NoSubscriberBehavior } = require("@discordjs/voice");

const players = new Map();

function getPlayer(guildId) {
    if (!players.has(guildId)) {
        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play, // Continue playing even if there are no subscribers
            },
        });

        player.on('stateChange', (oldState, newState) => {
            console.log(`[${guildId}] ${oldState.status} -> ${newState.status}`);
        });

        player.on('error', err => {
            console.error(`[${guildId}] Player error:`, err);
        });

        players.set(guildId, player);
    }

    return players.get(guildId);
}

module.exports = { getPlayer };