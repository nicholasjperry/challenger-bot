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
            interactionHandlerType: InteractionHandlerTypes.Button
        });
    }

    parse(interaction: ButtonInteraction) {
        const action = interaction.customId.split('-')[0] as Action;

        if (!(action in deckFieldMap)) return this.none();
        return this.some();
    }

    async run(interaction: ButtonInteraction) {
        
        const [action, challengeKey] = interaction.customId.split('-') as [Action, string];
        
        const challenge = activeChallenges.get(challengeKey);
        if (!challenge) return;
        
        const { challengerId, targetId } = challenge;
        
        if (![challengerId, targetId].includes(interaction.user.id)) {
            return interaction.reply({
                content: 'This is not your challenge.',
                ephemeral: true,
            });
        }
        
        const decks = getPlayerDecks(interaction.user.id);
        if (!decks) return;
        
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
            content: 'Deck selected.',
            components: [],
        });

        await resolveChallenge(challengeKey);
    }
}
