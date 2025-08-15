import { 
    Client,
    Collection,
    EmbedBuilder,
    Events,
    GatewayIntentBits,
    Partials,
} from 'discord.js';
import dotenv from 'dotenv';
import cron from 'node-cron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    activeChallenges,
    checkMaxMessages,
    getChallengeKey,
    getLogChannel,
} from './commands/challenge.js';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [
        Partials.Channel,
    ],
}) as Client & { commands: Collection<string, any>};

client.commands = new Collection();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsPath = path.join(__dirname, 'commands');
const isDev = process.env.NODE_ENV !== 'production';
const commandFiles = fs.readdirSync(commandsPath)
    .filter(file => isDev ? file.endsWith('.ts') : file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(`file://${filePath}`);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`Loaded command: ${command.data.name}`);
    }
    else {
        console.warn(`[WARNING] ${file} is missing "data" or "execute"`);
    }
}

client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            console.log('DEBUG: Slash command received:', interaction.commandName);
    
            const command = client.commands.get(interaction.commandName);
            
            console.log('DEBUG: Command found?', !!command);
    
            if (!command) return;
    
            try {
                await command.execute(interaction, client);
            }
            catch (err) {
                console.error('Command execution error:', err);
                if (interaction.isRepliable())
                    await interaction.reply({ content: 'Error executing command', ephemeral: true });
            }
        }
        else if (interaction.isButton()) {
            const [action, challengerId] = interaction.customId.split('-');
            const challengerUser = await client.users.fetch(challengerId);
            const challengeKey = getChallengeKey(interaction.user.id, challengerUser.id);
    
            await interaction.deferUpdate();

            const limitReached = await checkMaxMessages(interaction, client);

            if (limitReached) {
                activeChallenges.delete(challengeKey);
                return;
            }
            
            activeChallenges.delete(challengeKey);
            const logChannel = getLogChannel(client);
    
            if (action === 'accept') {
                // Notify target via DM
                await interaction.editReply({
                    content: `✅ You accepted the challenge from <@${challengerUser.id}>!`,
                    components: [],
                });
    
                // Notify the challenger via DM
                await challengerUser.send(`🎉 <@${interaction.user.id}> accepted your challenge!`);
    
                const embed = new EmbedBuilder()
                    .setTitle('✅ Challenge Accepted!')
                    .setDescription(`<@${interaction.user.id}> 🆚 <@${challengerId}>`)
                    .setColor(0x00ff00)
                    .setTimestamp();
    
                if (logChannel?.isTextBased())
                    await logChannel.send({ embeds: [embed] });
            }
    
            if (action === 'reject') {
                // Notify target via DM
                await interaction.editReply({
                    content: `❌ You rejected the challenge from <@${challengerId}>.`,
                    components: [],
                });
        
                // Notify the challenger via DM
                await challengerUser.send(`❌ <@${interaction.user.id}> rejected your challenge.`);
            }
        }
    }
    catch (err) {
        console.error('Interaction error:', err);
    }
});

cron.schedule('0 0 * * *', async () => {
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    const logChannel = guild?.channels.cache.find(c => c.name === 'challenge-log');

    if (!logChannel?.isTextBased()) return;

    const messages = await logChannel?.messages.fetch({ limit: 100});

    messages.forEach(m => m.delete());
});

client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user?.tag}`);
});

client.login(process.env.TOKEN);