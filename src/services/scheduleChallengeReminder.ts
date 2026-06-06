import { runChallengeReminder } from "./runChallengeReminder.js";

export function scheduleChallengeReminder(challengeId: string, remindAt: Date) {
    const delay = remindAt.getTime() - Date.now();
    
    const execute = async () => {
        try {
            await runChallengeReminder(challengeId);
        } catch (err) {
            console.error(`Reminder failed for ${challengeId}`, err);
        }
    };

    if (delay <= 0) {
        void execute();
        return;
    }

    setTimeout(() => {
        void execute();
    }, delay);
}