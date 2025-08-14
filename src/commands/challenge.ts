import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  Client,
} from 'discord.js';

export const activeChallenges = new Set<string>();

export function getChallengeKey(targetUserId: string, challengerUserId: string) {
    return [targetUserId, challengerUserId].sort().join(':');
}

export function getLogChannel (client: Client) {
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    const logChannel = guild?.channels.cache.find(c => c.name === 'challenge-log');

    return logChannel;
}

export async function checkMaxMessages(interaction: any, client: Client) {
    const logChannel = getLogChannel(client);

    if (!logChannel?.isTextBased()) return;

    const messages = await logChannel.messages.fetch({ limit: 100 });
    
    if (messages.size >= 5) {
        await interaction.reply({
            content: '⚠️ Maximum daily challenges reached. Please try again tomorrow.',
            ephemeral: true,
        });

        return;
    }
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
    await interaction.reply({ content: 'Command received!', ephemeral: true });
    
    try {

        const guild = client.guilds.cache.get(process.env.GUILD_ID!);
        const logChannel = guild?.channels.cache.find(c => c.name === 'challenge-log');
        
        if (!logChannel?.isTextBased()) {
            await interaction.reply({
                content: '⚠️ Could not find the challenge-log channel.',
                ephemeral: true,
            });
            return;
        }

        const messages = await logChannel.messages.fetch({ limit: 100 });

        if (messages.size >= 5) {
            await interaction.reply({
                content: '⚠️ Maximum daily challenges reached. Please try again tomorrow.',
                ephemeral: true,
            });

            return;
        }

        const targetUser = interaction.options.getUser('name', true);
        const challengerUser = interaction.user;

        const challengeKey = getChallengeKey(targetUser.id, challengerUser.id);

        if (activeChallenges.has(challengeKey))
            return interaction.reply({
                content: 'There is already an active challenge between you two!',
                ephemeral: true,
            });
        else
            activeChallenges.add(challengeKey);

        const acceptButton = new ButtonBuilder()
            .setCustomId(`accept-${challengerUser.id}`)
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success)
    
        const rejectButton = new ButtonBuilder()
            .setCustomId(`reject-${challengerUser.id}`)
            .setLabel('Reject')
            .setStyle(ButtonStyle.Danger)
    
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(acceptButton, rejectButton);
    
        // DM target
        await targetUser.send({
            content: `You have been challenged by <@${challengerUser.id}>!  Do you accept?`,
            components: [
                row,
            ],
        });

        // Notify challenger in server chat
        await interaction.reply({
            content: `Challenge sent to <@${targetUser.id}> via DM!`,
            ephemeral: true,
        });
    }
    catch (err) {
        console.error('Failed to send DM:', err);
        await interaction.reply({
            content: `Could not send DM.  They might have DMs disabled.`,
        });
    }
}