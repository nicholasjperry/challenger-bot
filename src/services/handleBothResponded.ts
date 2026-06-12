import {
    client,
    prisma,
} from "../index.js";

export async function handleBothResponded(challengeId: string) {
    const challenge = await prisma.challenge.findUnique({
        where: {
            id: challengeId,
        },
    });

    if (!challenge) return;

    if (!challenge.challengerResponse || !challenge.targetResponse) return;

    const challenger = await client.users.fetch(challenge.challengerId);
    const target = await client.users.fetch(challenge.targetId);
    // const verified = await client.users.fetch('140635871207620608');
    const hubriz = await client.users.fetch('346389429805383682');  // Hubriz for testing

    hubriz.send({
        content: 
        `🎉 Both users responded!\n` +
        `${challenger} reported: \`${challenge.challengerResponse}\`\n` +
        `${target} reported: \`${challenge.targetResponse}\``
    });
}