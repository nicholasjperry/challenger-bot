import { Command } from '@sapphire/framework';
import {
    ChatInputCommandInteraction,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} from 'discord.js';
import { getPlayerDecks } from '../lib/playerDecks.js';
import { activeChallenges, getChallengeKey } from '../lib/challengeStore.js';
import { prisma } from '../index.js';

export class ChallengeCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: 'challenge',
            description: 'Challenge another Planeswalker',
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(builder => 
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addUserOption(option => 
                    option
                        .setName('name')
                        .setDescription('Planeswalker to challenge')
                        .setRequired(true)
                )
        );
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        
        const challenger = interaction.user;
        const target = interaction.options.getUser('name', true);

        if (challenger.id === target.id) {
            return interaction.editReply({ content: '⚠️ You cannot challenge yourself!' });
        }

        const challengeKey = getChallengeKey(challenger.id, target.id);

        if (activeChallenges.has(challengeKey)) {
            return interaction.editReply({
                content: '⚠️ There is already an active challenge between you two!'
            });
        }

        // Update activeChallenges Map
        activeChallenges.set(challengeKey, {
            challengerId: challenger.id,
            targetId: target.id,
        });

        // Store in db
        await prisma.challenge.create({
            data: {
                challengerId: challenger.id,
                targetId: target.id,
            }
        });
        
        // Lookup decks
        const challengerDecks = getPlayerDecks(challenger.id);
        const targetDecks = getPlayerDecks(target.id);

        // Buttons
        const challengerRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`challengerDeckOne-${challengeKey}`)
                .setLabel(challengerDecks?.deckOne ?? 'Deck 1')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`challengerDeckTwo-${challengeKey}`)
                .setLabel(challengerDecks?.deckTwo ?? 'Deck 2')
                .setStyle(ButtonStyle.Primary)
        );
        const targetRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`targetDeckOne-${challengeKey}`)
                .setLabel(targetDecks?.deckOne ?? 'Deck 1')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`targetDeckTwo-${challengeKey}`)
                .setLabel(targetDecks?.deckTwo ?? 'Deck 2')
                .setStyle(ButtonStyle.Primary)
        );

        try {
            await challenger.send({
                content: `Choose your deck vs. <@${target.id}>`,
                components: [challengerRow],
            });

            await target.send({
                content: `Choose your deck vs <@${challenger.id}>`,
                components: [targetRow],
            });
        } catch {
            activeChallenges.delete(challengeKey);

            return interaction.editReply({
                content: 'Failed to DM users.',
            });
        }

        await interaction.editReply({
            content: `Challenge sent to <@${target.id}>`,
        });
    }
}