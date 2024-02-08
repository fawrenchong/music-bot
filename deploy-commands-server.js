const { REST, Routes} = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const { get_commands } = require('./get-commands.js');

// This may look like a duplicate of the code in index.js but it uses an array instead of a discord dictionary
const commands = get_commands();

const rest = new REST().setToken(token);

// deploy the commands
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId), 
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } 
    catch (error) {
        console.error(error);
    }
})();