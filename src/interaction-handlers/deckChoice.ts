import {
    InteractionHandler,
    InteractionHandlerTypes
} from '@sapphire/framework';

import type { ButtonInteraction } from 'discord.js';

import {
    activeChallenges,
    deckChoices
} from '../lib/challengeStore.js';

import { getPlayerDecks } from '../lib/playerDecks.js';
import { resolveChallenge } from '../lib/resolveChallenge.js';

type Action = 
| 'challengerDeckOne'
| 'challengerDeckTwo'
| 'targetDeckOne'
| 'targetDeckTwo';

const deckFieldMap = {
    challengerDeckOne: 'deckOne',
    challengerDeckTwo: 'deckTwo',
    targetDeckOne: 'deckOne',
    targetDeckTwo: 'deckTwo',
};

export class DeckChoiceHandler extends InteractionHandler {
    constructor(context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
        super(context, {
            ...options,
            interactionHandlerType: InteractionHandlerTypes.Button,
        });
    }

    parse(interaction: ButtonInteraction) {
        const separatorIndex = interaction.customId.indexOf('-');
        if (separatorIndex === -1) return this.none();

        const action = interaction.customId.slice(0, separatorIndex) as Action;

        if (!(action in deckFieldMap)) return this.none();
        return this.some();
    }

    async run(interaction: ButtonInteraction) {
        const separatorIndex = interaction.customId.indexOf('-');
        if (separatorIndex === -1) return;

        const action = interaction.customId.slice(0, separatorIndex) as Action;
        const challengeKey = interaction.customId.slice(separatorIndex + 1);

        const challenge = activeChallenges.get(challengeKey);
        if (!challenge) {
            return interaction.reply({
                content: '⚠️ This challenge is no longer active!',
                ephemeral: true,
            });
        }
        
        const { challengerId, targetId } = challenge;
        
        if (![challengerId, targetId].includes(interaction.user.id)) {
            return interaction.reply({
                content: '⚠️ This is not your challenge!',
                ephemeral: true,
            });
        }
        
        const decks = getPlayerDecks(interaction.user.id);
        if (!decks) {
            return interaction.reply({
                content: '⚠️ No deck data found for your user!',
                ephemeral: true,
            });
        }
        
        const entry = deckChoices.get(challengeKey) ?? {
            challenger: undefined,
            target: undefined,
        };
        const field = deckFieldMap[action];
        
        if (interaction.user.id === challengerId)
            entry.challenger = decks?.[field];

        if (interaction.user.id === targetId)
            entry.target = decks?.[field];

        deckChoices.set(challengeKey, entry);

        await interaction.update({
            content: `🫵 ${decks[field]} - I choose you!`,
            components: [],
        });

        await resolveChallenge(challengeKey);
    }
}
