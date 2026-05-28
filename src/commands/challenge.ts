import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    Client,
    TextChannel,
} from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Stores per-player deck choices
export const deckChoices = new Map<
    string,
    {
        challenger?: string;
        target?: string;
    }
>();

// Stores active challenge metadata (authoritative source of truth)
export const activeChallenges = new Map<
    string,
    {
        challengerId: string;
        targetId: string;
    }
>();

// Creates a stable, order-independent key for both users
export function getChallengeKey(a: string, b: string) {
    return [a, b].sort().join('-');
}

// Gets log channel
export function getLogChannel(client: Client) {
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    return guild?.channels.cache.find(
        c => c.name === 'challenge-log'
    );
}

//Checks daily message limit in log channel
export async function checkMaxMessages(interaction: any, client: Client) {
    const logChannel = getLogChannel(client);

    if (!logChannel?.isTextBased()) return;

    const messages = await logChannel.messages.fetch({ limit: 100 });

    if (messages.size >= 10) {
        await interaction.followUp({
            content: '⚠️ Maximum daily challenges reached. Please try again tomorrow.',
            ephemeral: true,
        });

        return true;
    }

    return false;
}

// Slash command definition
export const data = new SlashCommandBuilder()
    .setName('challenge')
    .setDescription('Challenge another Planeswalker')
    .addUserOption(option =>
        option
            .setName('name')
            .setDescription('Planeswalker to challenge')
            .setRequired(true)
    );
// Slash command execution
export async function execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply({ ephemeral: true });

    try {
        const guild = client.guilds.cache.get(process.env.GUILD_ID!);

        const logChannel = guild?.channels.cache.find(
            c => c.isTextBased() && c.name === 'challenge-log'
        ) as TextChannel | undefined;

        if (!logChannel) {
            await interaction.editReply({
                content: '⚠️ Could not find the challenge-log channel.',
            });
            return;
        }

        const messages = await logChannel.messages.fetch({ limit: 100 });

        if (messages.size >= 10) {
            await interaction.editReply({
                content: '⚠️ Maximum daily challenges reached. Please try again tomorrow.',
            });
            return;
        }

        const targetUser = interaction.options.getUser('name', true);
        const challengerUser = interaction.user;

        if (targetUser.id === challengerUser.id) {
            await interaction.editReply({
                content: '⚠️ You cannot challenge yourself!',
            });
            return;
        }

        const challengeKey = getChallengeKey(
            challengerUser.id,
            targetUser.id
        );

        if (activeChallenges.has(challengeKey)) {
            await interaction.editReply({
                content:
                    '⚠️ There is already an active challenge between you two!',
            });
            return;
        }

        activeChallenges.set(challengeKey, {
            challengerId: challengerUser.id,
            targetId: targetUser.id,
        });

        const playerDecks = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/playerDecks.json'), 'utf-8')).playerDecks;
        const challengerDecks = playerDecks.find((p: any) => p.playerId === challengerUser.id);
        const targetDecks = playerDecks.find((p: any) => p.playerId === targetUser.id);

        // Buttons (consistent IDs — NO flipping)
        const challengerUserDeckOneButton = new ButtonBuilder()
            .setCustomId(
                `challengerDeckOne-${challengerUser.id}-${targetUser.id}`
            )
            .setLabel(challengerDecks?.deckOne || 'Deck 1')
            .setStyle(ButtonStyle.Primary);

        const challengerUserDeckTwoButton = new ButtonBuilder()
            .setCustomId(
                `challengerDeckTwo-${challengerUser.id}-${targetUser.id}`
            )
            .setLabel(challengerDecks?.deckTwo || 'Deck 2')
            .setStyle(ButtonStyle.Primary);

        const targetUserDeckOneButton = new ButtonBuilder()
            .setCustomId(
                `targetDeckOne-${challengerUser.id}-${targetUser.id}`
            )
            .setLabel(targetDecks?.deckOne || 'Deck 1')
            .setStyle(ButtonStyle.Primary);

        const targetUserDeckTwoButton = new ButtonBuilder()
            .setCustomId(
                `targetDeckTwo-${challengerUser.id}-${targetUser.id}`
            )
            .setLabel(targetDecks?.deckTwo || 'Deck 2')
            .setStyle(ButtonStyle.Primary);

        const challengerRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            challengerUserDeckOneButton,
            challengerUserDeckTwoButton
        );

        const targetRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            targetUserDeckOneButton,
            targetUserDeckTwoButton
        );

        try {
            await targetUser.send({
                content: `You have been challenged by <@${challengerUser.id}>! Choose Deck 1 or Deck 2.`,
                components: [targetRow],
            });

            await challengerUser.send({
                content: `You have challenged <@${targetUser.id}>! Choose Deck 1 or Deck 2.`,
                components: [challengerRow],
            });
        } catch (err) {
            console.error('Failed to DM user(s):', err);

            await interaction.editReply({
                content:
                    '⚠️ Could not DM one or both users. Challenge cancelled.',
            });

            activeChallenges.delete(challengeKey);
            return;
        }

        await interaction.editReply({
            content: `Challenge sent to <@${targetUser.id}> via DM!`,
        });
    } catch (err) {
        console.error('Error executing challenge command:', err);

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
                content:
                    '⚠️ An unexpected error occurred while sending the challenge.',
            });
        } else {
            await interaction.reply({
                content:
                    '⚠️ An unexpected error occurred while sending the challenge.',
                ephemeral: true,
            });
        }
    }
}