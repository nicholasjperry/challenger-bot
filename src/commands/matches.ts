import {
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder,
    SlashCommandBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('matches')
  .setDescription(`List today's challenges`);

export async function execute(interaction: ChatInputCommandInteraction, client: Client) {
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    const logChannel = guild?.channels.cache.find(c => c.name === 'challenge-log');

    if (!logChannel?.isTextBased()) return;

    const messages = await logChannel.messages.fetch({ limit: 100 });
    
    const challengeEmbeds = messages
        .filter(m => m.author?.id === client.user?.id && m.embeds.length)
        .map(m => m.embeds[0]);

    const summary = challengeEmbeds.map((e, i) => `${i + 1}. ${e.description}`).join('\n');

    const embed = new EmbedBuilder()
        .setTitle(`📋 Today's Matches`)
        .setDescription(summary || 'No active challenges.')
        .setColor(0x00bfff)
        .setTimestamp();

    await interaction.reply({ 
        embeds: [embed], 
        ephemeral: true,
    });
}
