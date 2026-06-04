import { SapphireClient} from '@sapphire/framework';
import { 
    GatewayIntentBits,
    Partials,
} from 'discord.js';
import dotenv from 'dotenv';
// import cron from 'node-cron';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(fileURLToPath(import.meta.url));

dotenv.config();

const client = new SapphireClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [
        Partials.Channel,
    ],
    baseUserDirectory: ROOT,
});

(globalThis as { client?: SapphireClient }).client = client;

client.login(process.env.TOKEN);