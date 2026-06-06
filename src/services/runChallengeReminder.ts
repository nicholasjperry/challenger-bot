import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";
import {
    client,
    prisma,
} from "../index.js";
import { RESPONSES } from "../lib/responses.js";

export async function runChallengeReminder(challengeId: string) {
    const challenge = await prisma.challenge.findUnique({
        where: {
            id: challengeId
        }
    });

    if (!challenge || challenge.reminderSent) return;

    // Update reminderSent bool
    await prisma.challenge.update({
        where: {
            id: challengeId,
        },
        data: {
            reminderSent: true,
        },
    });

    const challenger = await client.users.fetch(challenge.challengerId);
    const target = await client.users.fetch(challenge.targetId);

    const reminderMessage = `It's been 1 hour since your challenge.  Did you submit a log?`;
    const reminderRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`challenge:${challenge.id}:${RESPONSES.YES}`)
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`challenge:${challenge.id}:${RESPONSES.NO}`)
            .setLabel('No')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId(`challenge:${challenge.id}:${RESPONSES.CANT}`)
            .setLabel(`Can't`)
            .setStyle(ButtonStyle.Secondary)
    );

    try {
        await challenger.send({
            content: reminderMessage,
            components: [reminderRow],
        });

        await target.send({
            content: reminderMessage,
            components: [reminderRow],
        });

        await prisma.challenge.update({
            where: {
                id: challengeId,
            },
            data: {
                reminderSent: true,
            },
        });
    }
    catch(err) {
        console.error(err);
    }

}