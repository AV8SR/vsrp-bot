const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

module.exports = (client) => {

    client.logs.info('Started refreshing application (/) commands.');
    
    const commands = [];
    const commandNames = [];
    for (const [_, command] of client.commands) {
        const commandData = command.data?.toJSON();
        try {
            if (!commandData) throw `No command.data found - Did you forget to save the file?`;
            if (commandNames.includes(commandData?.name)) continue;
            commandNames.push(commandData.name);
            commands.push(commandData);
        } catch(error) {
            client.logs.error(`[REGISTER] Failed to register ${command.data.name}: ${error}`);
        }
    }

    commands.map(c => c.dm_permission ??= false);

    const rest = new REST({ version: '10' }).setToken(client.config.TOKEN);
    try {
        rest.put(
            Routes.applicationCommands(client.config.APP_ID),
            { body: commands },
        );
    
        client.logs.info('Successfully reloaded application (/) commands.');
    } catch (error) {
        client.logs.error(error);
    }
}