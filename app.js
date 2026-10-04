// --- BOERENBRIDGE APP LOGICA ---

const STORAGE_KEY_SETTINGS = 'boerenbridge_settings_v2';
const STORAGE_KEY_STATE = 'boerenbridge_gamestate_v2';
const STORAGE_KEY_HISTORY = 'boerenbridge_history_v2';

let appState = {
    screen: 'setup', // setup, game, history, gameover
    players: [
        { id: 1, name: 'Speler 1', active: true },
        { id: 2, name: 'Speler 2', active: true },
        { id: 3, name: 'Speler 3', active: true },
        { id: 4, name: 'Speler 4', active: true }
    ],
    config: {
        minCards: 1,
        maxCards: 10,
        gameType: 'asc-desc', // asc, desc, asc-desc, fixed
        fixedCardsCount: 5,
        penaltyIncorrect: 5,
        penaltyDiff: true
    },
    game: null,
    history: []
};

function loadFromStorage() {
    try {
        const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            if (parsed.players) appState.players = parsed.players;
            if (parsed.config) appState.config = parsed.config;
        }

        const savedState = localStorage.getItem(STORAGE_KEY_STATE);
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            if (parsedState && parsedState.game && parsedState.screen === 'game') {
                appState.game = parsedState.game;
                appState.screen = 'game';
            }
        }

        const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
        if (savedHistory) {
            appState.history = JSON.parse(savedHistory);
        }
    } catch (e) {
        console.error('Fout bij laden LocalStorage:', e);
    }
}

function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({
            players: appState.players,
            config: appState.config
        }));
        localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify({
            game: appState.game,
            screen: appState.screen
        }));
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(appState.history));
    } catch (e) {
        console.error('Fout bij opslaan LocalStorage:', e);
    }
}

// Genereer de volgorde van kaarten per ronde
function generateRounds(config, playerCount) {
    let rounds = [];
    let min = parseInt(config.minCards);
    let max = parseInt(config.maxCards);
    
    // Zorg dat max niet hoger is dan wiskundig mogelijk (52 / aantal spelers)
    const absoluteMax = Math.floor(52 / Math.max(2, playerCount));
    if (max > absoluteMax && absoluteMax >= 1) max = absoluteMax;
    if (min > max) min = max;

    const type = config.gameType;

    if (type === 'asc') {
        for (let c = min; c <= max; c++) rounds.push(c);
    } else if (type === 'desc') {
        for (let c = max; c >= min; c--) rounds.push(c);
    } else if (type === 'asc-desc') {
        // Omhoog
        for (let c = min; c <= max; c++) rounds.push(c);
        // Naar beneden (laat max niet dubbel als type max-min is, of wel? Standaard boerenbridge doet vaak omhoog en dan omlaag)
        for (let c = max - 1; c >= min; c--) rounds.push(c);
    } else if (type === 'fixed') {
        let f = parseInt(config.fixedCardsCount) || 5;
        for (let i = 0; i < 5; i++) rounds.push(f); // bijv 5 rondes van X kaarten
    }
    return rounds;
}

// --- RENDER HOOFDFUNCTIE ---
function render() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    appEl.innerHTML = '';

    if (appState.screen === 'setup') {
        appEl.innerHTML = renderSetupScreen();
        attachSetupListeners();
    } else if (appState.screen === 'game') {
        appEl.innerHTML = renderGameScreen();
        attachGameListeners();
    } else if (appState.screen === 'gameover') {
        appEl.innerHTML = renderGameOverScreen();
        attachGameOverListeners();
    } else if (appState.screen === 'history') {
        appEl.innerHTML = renderHistoryScreen();
        attachHistoryListeners();
    }
}

// ==========================================
// 1. SETUP SCHERM
// ==========================================
function renderSetupScreen() {
    const activeCount = appState.players.filter(p => p.active).length;
    const absMax = Math.floor(52 / Math.max(2, activeCount || 2));

    return `
