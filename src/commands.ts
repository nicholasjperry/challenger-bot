import {
    REST,
    Routes,
    SlashCommandBuilder,
} from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

 const commands = [
    new SlashCommandBuilder()
        .setName('challenge')
        .setDescription('Challenge another Planeswalker')
        .addUserOption(option =>
            option
                .setName('name')
                .setDescription('Planeswalker to challenge')
                .setRequired(true),
        )
        .toJSON(),
 ];

 if (process.env.TOKEN) {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    
    async function deployCommands() {
        try {
            console.log('Started refreshing application (/) commands.');

            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
                { body: commands },
            );

            console.log('Successfully reloaded application (/) commands.');
        }
        catch (err) {
            console.error(err);
        }
    }

    deployCommands();
}