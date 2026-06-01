import { deckChoices, activeChallenges } from './challengeStore.js';

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

    // const logChannel = guild?.channels.cache.get(process.env.LOG_CHANNEL_ID!);
    const logChannel = await guild?.channels
        .fetch(process.env.LOG_CHANNEL_ID!)
        .catch(() => null);

    if (!logChannel || !logChannel.isTextBased()) return;

    await logChannel.send({
        content:
        `🎴 Deck Choices Revealed 🎴\n` +
        `<@${challengerId}> chose ${entry.challenger}\n` +
        `<@${targetId}> chose ${entry.target}`,
    });
}