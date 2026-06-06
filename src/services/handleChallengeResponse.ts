import { ButtonInteraction } from "discord.js";
import { prisma } from "../index.js";
import { handleBothResponded } from "./handleBothResponded.js";

export async function handleChallengeResponse(interaction: ButtonInteraction) {
    const [type, challengeId, response] = interaction.customId.split(':');

    const userId = interaction.user.id;

    const challenge = await prisma.challenge.findUnique({
        where: {
            id: challengeId,
        }
    });

    if (!challenge)
        return interaction.reply({ 
            content: 'Challenge not found', 
            ephemeral: true 
        });

    let updateData: any = {};

    if (userId === challenge.challengerId) {
        updateData.challengerResponse = response;
    } else if (userId === challenge.targetId) {
        updateData.targetResponse = response;
    } else {
        return interaction.reply({ 
            content: "You're not part of this challenge.", 
            ephemeral: true 
        });
    }

    // Prevent double response override
    if (
        (userId === challenge.challengerId && challenge.challengerResponse) ||
        (userId === challenge.targetId && challenge.targetResponse)
    ) {
        return interaction.reply({ 
            content: "You've already responded.", 
            ephemeral: true 
        });
    }

    const updated = await prisma.challenge.update({
        where: {
            id: challengeId,
        },
        data: updateData,
    });

    await interaction.reply({
        content: `Response recorded: ${response}`,
        ephemeral: true,
    });

    if (updated.challengeResponse && updated.targetResponse) {
        await handleBothResponded(updated);
    }
}