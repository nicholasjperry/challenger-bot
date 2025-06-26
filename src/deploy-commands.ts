import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands: any = [];

const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.ts'));

for (const file of commandFiles) {
  const command = await import(pathToFileURL(path.join(__dirname, 'commands', file)).href);
  if (command?.data && typeof command.data.name === 'string')
    commands.push(command.data.toJSON());
  else
    console.warn(`[WARNING] ${file} is missing "data" or "name"`);
}

const rest = new REST().setToken(process.env.TOKEN!);

await rest.put(
  Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
  { body: commands }
);

console.log('✅ Slash commands registered.');
