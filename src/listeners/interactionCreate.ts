import { Listener } from '@sapphire/framework';
import { Events, Interaction } from 'discord.js';
import { activeChallenges, getLogChannel, deckChoices } from '../commands/challenge.ts';
import fs from 'node:fs';
import path from 'node:path';

export class InteractionCreateListener extends Listener {
  constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: Events.InteractionCreate,
    });
  }

  async run(interaction: Interaction) {
    if (interaction.isButton()) {
      try {
        await interaction.deferUpdate();

        const [action, challengerId, targetId] = interaction.customId.split('-');
        const challengeKey = [challengerId, targetId].sort().join('-');
        const challenge = activeChallenges.get(challengeKey);

        if (!challenge) {
          console.log('Challenge not found:', challengeKey);
          return;
        }

        const { challengerId: realChallengerId, targetId: realTargetId } = challenge;

        const playerDecks = JSON.parse(
          fs.readFileSync(path.join(__dirname, '../../data/playerDecks.json'), 'utf-8')
        ).playerDecks;
        const challengerDecks = playerDecks.find((p: any) => p.playerId === realChallengerId);
        const targetDecks = playerDecks.find((p: any) => p.playerId === realTargetId);

        const deckMap = {
          challengerDeckOne: challengerDecks?.deckOne,
          challengerDeckTwo: challengerDecks?.deckTwo,
          targetDeckOne: targetDecks?.deckOne,
          targetDeckTwo: targetDecks?.deckTwo,
        };

        const value = deckMap[action];

        if (!value) {
          console.log('INVALID ACTION:', action);
          return;
        }

        let entry = deckChoices.get(challengeKey) || {
          challenger: undefined as string | undefined,
          target: undefined as string | undefined,
        };

        if (interaction.user.id === realChallengerId) {
          entry.challenger = value;
        } else if (interaction.user.id === realTargetId) {
          entry.target = value;
        } else {
          console.log('Unknown clicker:', interaction.user.id);
          return;
        }

        deckChoices.set(challengeKey, entry);

        await interaction.editReply({
          content: `You chose ${value}`,
          components: [],
        });

        if (entry.challenger && entry.target) {
          activeChallenges.delete(challengeKey);
          deckChoices.delete(challengeKey);

          const logChannel = getLogChannel(interaction.client);

          if (logChannel?.isTextBased()) {
            await logChannel.send({
              content:
                `🎴 Deck Choices Revealed 🎴\n` +
                `<@${realChallengerId}> chose ${entry.challenger}\n` +
                `<@${realTargetId}> chose ${entry.target}`,
            });
          }
        }
      } catch (err) {
        console.error('Interaction error:', err);
      }
    }
  }
}