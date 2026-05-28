import { 
    Client,
    Collection,
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
    getLogChannel,
    deckChoices,
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
            } catch (err) {
                console.error('Command execution error:', err);

                if (interaction.isRepliable()) {
                    await interaction.reply({
                        content: 'Error executing command',
                        ephemeral: true,
                    });
                }
            }
        }
        else if (interaction.isButton()) {
            try {
                await interaction.deferUpdate();

                const [action, challengerId, targetId] = interaction.customId.split('-');
                const challengeKey = [challengerId, targetId].sort().join('-');
                const challenge = activeChallenges.get(challengeKey);

                if (!challenge) {
                    console.log('Challenge not found:', challengeKey);
                    return;
                }

                const { 
                    challengerId: realChallengerId,
                    targetId: realTargetId
                } = challenge;

                const playerDecks = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/playerDecks.json'), 'utf-8')).playerDecks;
                const challengerDecks = playerDecks.find((p: any) => p.playerId === realChallengerId);
                const targetDecks = playerDecks.find((p: any) => p.playerId === realTargetId);

                const deckMap = {
                    challengerDeckOne: challengerDecks?.deckOne,
                    challengerDeckTwo: challengerDecks?.deckTwo,
                    targetDeckOne: targetDecks?.deckOne,
                    targetDeckTwo: targetDecks?.deckTwo,
                };

                const value = deckMap[action];

                if (!value) {
                    console.log('INVALID ACTION:', action);
                    return;
                }

                let entry = deckChoices.get(challengeKey) || {
                    challenger: undefined as string | undefined,
                    target: undefined as string | undefined,
                };

                console.log('BEFORE:', entry);

                if (interaction.user.id === realChallengerId) {
                    entry.challenger = value;
                } else if (interaction.user.id === realTargetId) {
                    entry.target = value;
                } else {
                    console.log('Unknown clicker:', interaction.user.id);
                    return;
                }

                console.log('AFTER:', entry);

                deckChoices.set(challengeKey, entry);

                await interaction.editReply({
                    content: `You chose ${value}`,
                    components: [],
                });

                if (entry.challenger && entry.target) {
                    activeChallenges.delete(challengeKey);
                    deckChoices.delete(challengeKey);

                    const logChannel = getLogChannel(client);

                    if (logChannel?.isTextBased()) {
                        await logChannel.send({
                            content:
                                `🎴 Deck Choices Revealed 🎴\n` +
                                `<@${realChallengerId}> chose ${entry.challenger}\n` +
                                `<@${realTargetId}> chose ${entry.target}`,
                        });
                    }
                }

            } catch (err) {
                console.error('Interaction error:', err);
            }
        }
    } catch (err) {
        console.error('Global interaction error:', err);
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