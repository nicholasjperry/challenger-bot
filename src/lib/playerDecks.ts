import { fileURLToPath } from 'url';
import path, { dirname }  from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataPath = path.join(__dirname, '../../data/playerDecks.json');

type PlayerDeck = {
    playerId: string;
    deckOne: string;
    deckTwo: string;
};

const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const deckMap = new Map<string, PlayerDeck>();

for (const player of raw.playerDecks) {
    deckMap.set(player.playerId, player);
}

export function getPlayerDecks(playerId: string) {
    return deckMap.get(playerId);
}