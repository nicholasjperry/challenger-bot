import { SapphireClient} from '@sapphire/framework';
import { 
    GatewayIntentBits,
    Partials,
} from 'discord.js';
import dotenv from 'dotenv';
import cron from 'node-cron';

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
});

cron.schedule('0 0 * * *', async () => {
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    const logChannel = guild?.channels.cache.find(c => c.name === 'challenge-log');

    if (!logChannel?.isTextBased()) return;

    const messages = await logChannel?.messages.fetch({ limit: 100});

    messages.forEach(m => m.delete());
});

client.login(process.env.TOKEN);