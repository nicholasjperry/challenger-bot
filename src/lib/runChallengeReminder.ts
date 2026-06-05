import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";
import {
    client,
    prisma,
} from "../index.js";

export async function runChallengeReminder(challengeId: string) {
    const challenge = await prisma.challenge.findUnique({
        where: {
            id: challengeId
        }
    });

    if (!challenge || challenge.reminderSent) return;

    const challenger = await client.users.fetch(challenge.challengerId);
    const target = await client.users.fetch(challenge.targetId);

    const reminderMessage = `It's been 1 hour since your challenge.  Did you submit a log?`;
    const reminderRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`reminder-yes-${challenge.id}`)
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`reminder-no-${challenge.id}`)
            .setLabel('No')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId(`reminder-cannot-${challenge.id}`)
            .setLabel(`I can't`)
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