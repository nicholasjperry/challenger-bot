import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands: any = [];

const commandsPath = path.join(__dirname, 'commands');
const isTs = process.env.NODE_ENV !== 'production';
const commandFiles = fs.readdirSync(commandsPath)
    .filter(file => isTs ? file.endsWith('.ts') : file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const filePath = path.join(commandsPath, file);
        const command = await import(pathToFileURL(filePath).href);

        if (command?.data && typeof command.data.name === 'string') {
            commands.push(command.data.toJSON());
            console.log(`Loaded command: ${command.data.name}`);
        } else {
            console.warn(`[WARNING] ${file} is missing "data" or "name"`);
        }
    }
    catch (err) {
        console.error(`[ERROR] Failed to load command ${file}:`, err);
    }
}

const rest = new REST().setToken(process.env.TOKEN!);

try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
      { body: commands }
    );
    
    console.log('✅ Slash commands registered.');
}
catch (err) {
    console.error('[ERROR] Failed to register commands:', err);
}

