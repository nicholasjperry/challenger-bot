import { PrismaClient } from '@prisma/client/extension';
import { SapphireClient} from '@sapphire/framework';
import { 
    GatewayIntentBits,
    Partials,
} from 'discord.js';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { hydrateChallengeReminders } from './lib/hydrateChallengeReminders.js';

const ROOT = dirname(fileURLToPath(import.meta.url));

dotenv.config();

export const prisma = new PrismaClient();

export const client = new SapphireClient({
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