const { createAudioPlayer } = require("@discordjs/voice");

const players = new Map();

function getPlayer(guildId) {
    if (!players.has(guildId)) {
        const player = createAudioPlayer();

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