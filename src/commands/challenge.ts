import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  Client,
} from 'discord.js';

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
    try {
        // Check #channel-log message count
        // TODO: Check it upon 'Accept' or 'Reject' as well
        const guild = client.guilds.cache.get(process.env.GUILD_ID!);
        const logChannel = guild?.channels.cache.find(c => c.name === 'challenge-log');
        
        if (!logChannel?.isTextBased()) return;

        const messages = await logChannel.messages.fetch({ limit: 100 });

        // TODO: prevent being able to send out challenge to the same person

        if (messages.map(m => m).length >= 5) {
            await interaction.reply({
                content: '⚠️ Maximum daily challenges reached. Please try again tomorrow.',
                ephemeral: true,
            });

            return;
        }

        const targetUser = interaction.options.getUser('name', true);
        const challenger = interaction.user;

        const acceptButton = new ButtonBuilder()
            .setCustomId(`accept-${challenger.id}`)
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success)
    
        const rejectButton = new ButtonBuilder()
            .setCustomId(`reject-${challenger.id}`)
            .setLabel('Reject')
            .setStyle(ButtonStyle.Danger)
    
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(acceptButton, rejectButton);
    
        // DM target
        await targetUser.send({
            content: `You have been challenged by <@${challenger.id}>!  Do you accept?`,
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