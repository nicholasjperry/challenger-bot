import { runChallengeReminder } from "./runChallengeReminder.js";

export function scheduleChallengeReminder(challengeId: string, createdAt: Date) {
    const ONE_HOUR = 60 * 60 * 1000;
    const elapsed = Date.now() - createdAt.getTime();
    const delay = ONE_HOUR - elapsed;

    if (delay <= 0) {
        runChallengeReminder(challengeId);
        return;
    }

    setTimeout(() => {
        runChallengeReminder(challengeId);
    }, delay);
}