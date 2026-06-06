import { prisma } from "../index.js";

export async function handleBothResponded(challengeId: string) {
    const challenge = await prisma.challenge.findUnique({
        where: {
            id: challengeId,
        },
    });

    if (!challenge) return;

    if (!challenge.challengerResponse || !challenge.targetResponse) return;

    console.log('Both users responded!');
}