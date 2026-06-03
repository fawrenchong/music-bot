const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const {
    createAudioResource,
    StreamType
} = require('@discordjs/voice');

const ffmpeg = require('ffmpeg-static');

// Creates an audio resource from a given file path using ffmpeg to convert it to the appropriate format for Discord.js voice playback.
function createResource(filePath, trackName) {
    const process = spawn(ffmpeg, [
        '-i', filePath,
        '-vn',
        '-f', 's16le',
        '-ar', '48000',
        '-ac', '2',
        'pipe:1'
    ]);

    return createAudioResource(process.stdout, {
        inputType: StreamType.Raw,
        metadata: {
            title: trackName
        }
    });
}

// Reads all audio files from a specified directory and creates an array of audio resources for playback.
function getTracks(trackDirectory) {
    const trackNames = fs.readdirSync(trackDirectory);
    const tracks = [];

    for (const trackName of trackNames) {
        const fullTrackPath = path.join(trackDirectory, trackName);
        tracks.push(createResource(fullTrackPath, trackName));
    }

    return tracks;
}

module.exports = {
    createResource,
    getTracks
};