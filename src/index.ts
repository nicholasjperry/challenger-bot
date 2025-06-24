import { 
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Client,
    Events,
    GatewayIntentBits,
    InteractionType,
    Partials,
} from 'discord.js';
import dotenv from 'dotenv';

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
        const targetUser = interaction.options.getUser('name', true);
        const challenger = interaction.user;

        try {
            if (interaction.commandName === 'challenge') {}
    
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
    
            // Notify challenger in server chat (hidden)
            await interaction.reply({
                content: `Challenge sent to <@${targetUser.id}> via DM!`,
            });
        }
        catch (err) {
            console.error('Failed to send DM:', err);
            await interaction.reply({
                content: `Could not send DM.  They might have DMs disabled.`,
            })
        }
    }
    else if (interaction.isButton()) {
        // TODO: Handle button click
        const response = interaction.customId === 'accept' ? 'Challenge accepted!' : 'Challenge rejected.';

        await interaction.update({
            content: response,
            components: [],
        });
    }
});

client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user?.tag}`);
});
client.login(process.env.TOKEN);