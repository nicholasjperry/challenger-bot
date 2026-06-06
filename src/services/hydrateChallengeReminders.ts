import { prisma } from "../index.js";
import { runChallengeReminder } from "./runChallengeReminder.js";
import { scheduleChallengeReminder } from "./scheduleChallengeReminder.js";

export async function hydrateChallengeReminders() {
    const challenges = await prisma.challenge.findMany({
        where: {
            reminderSent: false,
        }
    });

    for (const challenge of challenges) {
        scheduleChallengeReminder(challenge.id, challenge.remindAt);
    }
}