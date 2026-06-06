import { prisma } from '../index.js';
import { deckChoices, activeChallenges } from './challengeStore.js';
import { scheduleChallengeReminder } from '../services/scheduleChallengeReminder.js';

export async function resolveChallenge(key: string) {
    const entry = deckChoices.get(key);
    if (!entry?.challenger || !entry?.target) return;

    const challenge = activeChallenges.get(key);
    if (!challenge) return;

    const { challengerId, targetId } = challenge;

    // cleanup
    activeChallenges.delete(key);
    deckChoices.delete(key);

    const client = (globalThis as { client?: { guilds: { cache: Map<string, any> } } }).client;
    const guild = client?.guilds.cache.get(process.env.GUILD_ID!);
    if(!guild) return;

    const logChannel = await guild?.channels
        .fetch(process.env.LOG_CHANNEL_ID!)
        .catch(() => null);

    if (!logChannel || !logChannel.isTextBased()) return;

    // Send message to #challenge-log
    await logChannel.send({
        content:
        `🎴 Deck Choices Revealed 🎴\n` +
        `<@${challengerId}> chose ${entry.challenger}\n` +
        `<@${targetId}> chose ${entry.target}`,
    });

    // Create reminder timestamp - SOURCE OF TRUTH
    const remindAt = new Date(Date.now() + 60 * 60 * 1000);

    // Store in db
    const newChallenge = await prisma.challenge.create({
        data: {
            challengerId: challengerId,
            targetId: targetId,
            remindAt: remindAt,
        }
    });

    // Schedule runtime trigger
    scheduleChallengeReminder(newChallenge.id, remindAt);
}