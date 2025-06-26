import { 
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Client,
    EmbedBuilder,
    Events,
    GatewayIntentBits,
    Guild,
    InteractionType,
    Partials,
} from 'discord.js';
import dotenv from 'dotenv';
import cron from 'node-cron';

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
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
        try {
            if (interaction.commandName === 'challenge') {
                // Check #channel-log message count
                // TODO: Check it upon 'Accept' or 'Reject' as well  
                const guild = client.guilds.cache.get(process.env.GUILD_ID!);
                const logChannel = guild?.channels.cache.find(c => c.name === 'challenge-log');
                
                if (!logChannel?.isTextBased()) return;

                const messages = await logChannel.messages.fetch({ limit: 100 });

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
        }
        catch (err) {
            console.error('Failed to send DM:', err);
            await interaction.reply({
                content: `Could not send DM.  They might have DMs disabled.`,
            });
        }
    }
    else if (interaction.isButton()) {
        const [action, challengerId] = interaction.customId.split('-');
        const challengerUser = await client.users.fetch(challengerId);

        if (action === 'accept') {
            await interaction.update({
                content: `✅ You accepted the challenge from <@${challengerId}>!`,
                components: [],
            });

            // Notify the challenger
            await challengerUser.send(
                `🎉 <@${interaction.user.id}> accepted your challenge!`
            );

            const embed = new EmbedBuilder()
                .setTitle('✅ Challenge Accepted!')
                .setDescription(`<@${interaction.user.id}> 🆚 <@${challengerId}>`)
                .setColor(0xDC143C)
                .setTimestamp();

            const guild = client.guilds.cache.get(process.env.GUILD_ID!);
            const logChannel = guild?.channels.cache.find(c => c.name === 'challenge-log');

            if (logChannel?.isTextBased())
                await logChannel.send({ embeds: [embed] });
        }

        if (action === 'reject') {
            await interaction.update({
                content: `❌ You rejected the challenge from <@${challengerId}>.`,
                components: [],
            });
    
            await challengerUser.send(
                `❌ <@${interaction.user.id}> rejected your challenge.`
            );
        }
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