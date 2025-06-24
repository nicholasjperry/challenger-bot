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
    if (interaction.type !== InteractionType.ApplicationCommand) return;

    if (!interaction.isChatInputCommand()) return;
    
    try {
        if (interaction.commandName === 'challenge') {}
            const targetUser = interaction.options.getUser('name', true);

        const acceptButton = new ButtonBuilder()
            .setCustomId('accept')
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success)
    
        const rejectButton = new ButtonBuilder()
            .setCustomId('reject')
            .setLabel('Reject')
            .setStyle(ButtonStyle.Danger)
    
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(acceptButton, rejectButton);
    
        await targetUser.send({
            content: `You have been challenged by <@${interaction.user.id}>!  Do you accept?`,
            components: [
                row,
            ],
        });

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

});

client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user?.tag}`);
});
client.login(process.env.TOKEN);