export const deckChoices = new Map<string, { challenger?: string; target?: string }>();

export const activeChallenges = new Map<string, { challengerId: string; targetId: string }>();

export function getChallengeKey(a: string, b: string) {
    return [a, b].sort().join('-');
}