const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const {
    createAudioResource,
    StreamType
} = require('@discordjs/voice');

const ffmpeg = require('ffmpeg-static');

function createResource(filePath) {
    const process = spawn(ffmpeg, [
        '-i', filePath,
        '-vn',
        '-f', 's16le',
        '-ar', '48000',
        '-ac', '2',
        'pipe:1'
    ]);

    return createAudioResource(process.stdout, {
        inputType: StreamType.Raw
    });
}

function getTracks(trackDirectory) {
    const trackNames = fs.readdirSync(trackDirectory);
    const tracks = [];

    for (const trackName of trackNames) {
        const fullTrackPath = path.join(trackDirectory, trackName);
        tracks.push(createResource(fullTrackPath));
    }

    return tracks;
}

module.exports = {
    createResource,
    getTracks
};