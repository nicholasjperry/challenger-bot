import { prisma } from "../index.js";
import { runChallengeReminder } from "./runChallengeReminder.js";

export async function hydrateChallengeReminders() {
    const pending = await prisma.challenge.findMany({
        where: {
            reminderSent: false,
        }
    });

    for (const challenge of pending) {
        const ONE_HOUR = 60 * 60 * 1000;
        const elapsed = Date.now() - challenge.createdAt.getTime();
        const delay = ONE_HOUR - elapsed;

        if (delay <= 0)
            runChallengeReminder(challenge.id);
        else
            setTimeout(() => runChallengeReminder(challenge.id), delay);
    }
}