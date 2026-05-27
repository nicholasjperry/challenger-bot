import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    Client,
    TextChannel,
} from 'discord.js';

// Structure: Map<challengeKey, { challenger?: number, target?: number }>
export const deckChoices = new Map();

export const activeChallenges = new Set<string>();

export function getChallengeKey(challengerUserId: string, targetUserId: string) {
    return [challengerUserId, targetUserId].sort().join(':');
}

export function getLogChannel (client: Client) {
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    return guild?.channels.cache.find(c => c.name === 'challenge-log');
}

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

export const data = new SlashCommandBuilder()
    .setName('challenge')
    .setDescription('Challenge another Planeswalker')
    .addUserOption(option =>
        option
            .setName('name')
            .setDescription('Planeswalker to challenge')
            .setRequired(true),
        );

export async function execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply({ ephemeral: true });

    try {
        const guild = client.guilds.cache.get(process.env.GUILD_ID!);
        const logChannel = guild?.channels.cache.find(
            c => c.isTextBased() && c.name === 'challenge-log'
        ) as TextChannel | undefined;
        
        if (!logChannel || !logChannel?.isTextBased()) {
            await interaction.editReply({
                content: '⚠️ Could not find the challenge-log channel.'
            });

            return;
        }

        const messages = await logChannel.messages.fetch({ limit: 100 });

        if (messages.size >= 10) {
            await interaction.editReply({
                content: '⚠️ Maximum daily challenges reached. Please try again tomorrow.'
            });

            return;
        }

        const targetUser = interaction.options.getUser('name', true);
        const challengerUser = interaction.user;

        const challengeKey = getChallengeKey(challengerUser.id, targetUser.id);
        if (activeChallenges.has(challengeKey)) {
            await interaction.editReply({
                content: 'There is already an active challenge between you two!'
            });
            return;
        }
        else
            activeChallenges.add(challengeKey);

        const challengerUserDeckOneButton = new ButtonBuilder()
            .setCustomId(`challengerDeckOne-${challengerUser.id}`)
            .setLabel('Deck 1')
            .setStyle(ButtonStyle.Primary)
    
        const challengerUserDeckTwoButton = new ButtonBuilder()
            .setCustomId(`challengerDeckTwo-${challengerUser.id}`)
            .setLabel('Deck 2')
            .setStyle(ButtonStyle.Primary)

        const targetUserDeckOneButton = new ButtonBuilder()
            .setCustomId(`targetDeckOne-${targetUser.id}`)
            .setLabel('Deck 1')
            .setStyle(ButtonStyle.Primary)
    
        const targetUserDeckTwoButton = new ButtonBuilder()
            .setCustomId(`targetDeckTwo-${targetUser.id}`)
            .setLabel('Deck 2')
            .setStyle(ButtonStyle.Primary)
    
        const challengerRow = new ActionRowBuilder<ButtonBuilder>().addComponents(challengerUserDeckOneButton, challengerUserDeckTwoButton);
        const targetRow = new ActionRowBuilder<ButtonBuilder>().addComponents(targetUserDeckOneButton, targetUserDeckTwoButton);

        if (targetUser === challengerUser) {
            await interaction.editReply({
                content: '⚠️ You cannot challenge yourself!'
            });

            return;
        }
    
        try {
            // DM both users with their deck selection choices
            await targetUser.send({
                content: `You have been challenged by <@${challengerUser.id}>!  Choose to play Deck 1 or Deck 2.`,
                components: [
                    targetRow,
                ],
            });
            await challengerUser.send({
                content: `You have challenged <@${targetUser.id}>!  Choose to play Deck 1 or Deck 2.`,
                components: [
                    challengerRow,
                ],
            });
        }
        catch (err) {
            console.error('Failed to DM target user:', err);
        }

        // Notify challenger in server chat
        await interaction.editReply({
            content: `Challenge sent to <@${targetUser.id}> via DM!`
        });
    }
    catch (err) {
        console.error('Error executing challenge command:', err);
        
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
                content: '⚠️ An unexpected error occurred while sending the challenge.'
            });
        }
        else {
            await interaction.reply({
                content: '⚠️ An unexpected error occurred while sending the challenge.',
                ephemeral: true,
            });
        }
    }
}