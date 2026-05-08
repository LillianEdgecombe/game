/**
 * Prokaryote: The Colonization
 * A Strategic Deckbuilding Game on Marine Microbial Ecology
 */

class Card {
    constructor(id, name, type, value, description) {
        this.id = id;
        this.name = name;
        this.type = type; // 'Metabolism', 'Structure', 'Event'
        this.value = value;
        this.description = description;
    }
}

class Ecosystem {
    constructor(name, requirements, threshold, description) {
        this.name = name;
        this.requirements = requirements; // e.g. { photo: 5, buoyancy: 2 }
        this.threshold = threshold; // Total "Colonization Points" needed
        this.description = description;
    }
}

const GENE_POOL = [
    { name: "Proteorhodopsin", type: "Metabolism", value: { photo: 2 }, desc: "Harvest light energy in the surface ocean." },
    { name: "RuBisCO", type: "Metabolism", value: { photo: 3, biomass: 1 }, desc: "Fix carbon through the Calvin cycle." },
    { name: "Nitrogenase", type: "Metabolism", value: { nitrogen: 3 }, desc: "Convert N2 to ammonia for growth." },
    { name: "Sulfide Dehydrogenase", type: "Metabolism", value: { chemo: 3 }, desc: "Oxidize sulfide in dark environments." },
    { name: "Transporters", type: "Metabolism", value: { nutrients: 2 }, desc: "High-affinity uptake of organic matter." },
    { name: "Flagella", type: "Structure", value: { mobility: 2 }, desc: "Swim towards nutrient patches." },
    { name: "Pilus", type: "Structure", value: { adhesion: 2, mobility: 1 }, desc: "Attach to particles or other cells." },
    { name: "S-Layer", type: "Structure", value: { resilience: 2 }, desc: "Crystalline protein layer for protection." },
    { name: "Gas Vesicle", type: "Structure", value: { buoyancy: 3 }, desc: "Regulate vertical position in the water column." },
    { name: "Siderophores", type: "Structure", value: { iron: 3 }, desc: "Scavenge rare iron from the seawater." },
    { name: "EPS", type: "Structure", value: { biofilm: 3, resilience: 1 }, desc: "Form protective biofilms on marine snow." }
];

const ECOSYSTEMS = [
    new Ecosystem("Euphotic Zone", { photo: 5, buoyancy: 2 }, 15, "Sunlit surface waters where light is abundant but nutrients are scarce."),
    new Ecosystem("Marine Snow Particle", { adhesion: 3, nutrients: 4 }, 12, "Organic aggregates sinking through the water column, rich in DOM."),
    new Ecosystem("Hydrothermal Vent", { chemo: 6, resilience: 5 }, 20, "Extreme heat and chemical-rich fluids in the deep sea."),
    new Ecosystem("Hadopelagic Trench", { resilience: 8, nutrients: 2 }, 18, "The deepest parts of the ocean with immense pressure.")
];

const EVENTS = [
    { name: "Upwelling", type: "Event", value: { boost: 'nutrients' }, desc: "Deep, nutrient-rich water rises to the surface." },
    { name: "Viral Shunt", type: "Event", value: { penalty: 'biomass' }, desc: "Viral lysis releases DOM back into the water." },
    { name: "Marine Heatwave", type: "Event", value: { penalty: 'resilience' }, desc: "Sudden temperature spike stresses the population." },
    { name: "Algal Bloom", type: "Event", value: { boost: 'photo' }, desc: "Massive phytoplankton growth provides energy." }
];

let state = {
    deck: [],
    hand: [],
    discard: [],
    genome: [],
    currentEcosystem: null,
    currentEvent: null,
    turn: 1,
    atp: 5,
    biomass: 0,
    colonization: 0,
    gameOver: false
};

const dom = {
    turn: document.getElementById('turn-count'),
    atp: document.getElementById('atp-count'),
    biomass: document.getElementById('biomass-count'),
    event: document.getElementById('event-display'),
    ecosystem: document.getElementById('ecosystem-display'),
    progressText: document.getElementById('progress-text'),
    progressBar: document.getElementById('progress-bar'),
    genome: document.getElementById('genome-list'),
    hand: document.getElementById('hand'),
    deck: document.getElementById('deck-count'),
    discard: document.getElementById('discard-count'),
    endTurnBtn: document.getElementById('end-turn-btn'),
    overlay: document.getElementById('ui-overlay'),
    uiTitle: document.getElementById('ui-title'),
    uiText: document.getElementById('ui-text'),
    restartBtn: document.getElementById('restart-btn')
};

function init() {
    state.deck = [];
    state.discard = [];
    state.hand = [];
    state.genome = [];
    state.turn = 1;
    state.atp = 5;
    state.biomass = 0;
    state.colonization = 0;
    state.gameOver = false;

    // Create starting deck
    for (let i = 0; i < 10; i++) {
        const template = GENE_POOL[Math.floor(Math.random() * GENE_POOL.length)];
        state.deck.push(new Card(Date.now() + i, template.name, template.type, template.value, template.desc));
    }
    shuffle(state.deck);

    selectEcosystem();
    nextTurn();

    dom.endTurnBtn.onclick = endTurn;
    dom.restartBtn.onclick = init;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function selectEcosystem() {
    state.currentEcosystem = ECOSYSTEMS[Math.floor(Math.random() * ECOSYSTEMS.length)];
    state.colonization = 0;
}

function nextTurn() {
    state.atp = 5 + Math.floor(state.biomass / 5);

    // Environmental Event
    if (Math.random() > 0.6) {
        const evTemplate = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        state.currentEvent = evTemplate;
    } else {
        state.currentEvent = null;
    }

    // Draw Hand
    drawCards(5);
    calculateColonization(); // Ensure stats reflect new event state
    updateUI();
}

function drawCards(count) {
    for (let i = 0; i < count; i++) {
        if (state.deck.length === 0) {
            if (state.discard.length === 0) break;
            state.deck = [...state.discard];
            state.discard = [];
            shuffle(state.deck);
        }
        state.hand.push(state.deck.pop());
    }
}

function playCard(cardId) {
    if (state.gameOver) return;

    const cardIdx = state.hand.findIndex(c => c.id === cardId);
    if (cardIdx === -1) return;

    const card = state.hand[cardIdx];

    // Resource cost: 2 ATP to play a card
    if (state.atp < 2) {
        alert("Not enough ATP!");
        return;
    }

    state.atp -= 2;
    state.hand.splice(cardIdx, 1);
    state.genome.push(card);

    // Calculate Colonization Impact
    calculateColonization();
    updateUI();
}

function calculateColonization() {
    let cp = 0;
    const traits = {};

    // Aggregate traits from genome
    state.genome.forEach(card => {
        for (let key in card.value) {
            traits[key] = (traits[key] || 0) + card.value[key];
        }
    });

    // Check against ecosystem requirements
    for (let req in state.currentEcosystem.requirements) {
        if (traits[req]) {
            cp += Math.min(traits[req], state.currentEcosystem.requirements[req] * 2);
        }
    }

    // Event modifiers
    if (state.currentEvent) {
        if (state.currentEvent.value.boost && traits[state.currentEvent.value.boost]) {
            cp += 5;
        }
        if (state.currentEvent.value.penalty && traits[state.currentEvent.value.penalty]) {
            cp -= 3;
        }
    }

    state.colonization = Math.max(0, cp);
    state.biomass = state.genome.length * 2 + state.colonization;

    if (state.colonization >= state.currentEcosystem.threshold) {
        winEcosystem();
    }
}

function winEcosystem() {
    state.gameOver = true;
    dom.overlay.classList.remove('hidden');
    dom.uiTitle.innerText = "Ecosystem Colonized!";
    dom.uiText.innerHTML = `
        <p>Your prokaryote successfully dominated the <strong>${state.currentEcosystem.name}</strong>!</p>
        <p>Colonization Points: ${state.colonization}</p>
        <p>Total Turn: ${state.turn}</p>
        <hr>
        <p><small>${state.currentEcosystem.description}</small></p>
    `;
}

function endTurn() {
    if (state.gameOver) return;

    state.turn++;
    // Discard remaining hand
    state.discard.push(...state.hand);
    state.hand = [];

    if (state.turn > 20) {
        loseGame();
    } else {
        nextTurn();
    }
}

function loseGame() {
    state.gameOver = true;
    dom.overlay.classList.remove('hidden');
    dom.uiTitle.innerText = "Extinction";
    dom.uiText.innerText = "You failed to colonize the ecosystem in time. Your population drifted into the deep sea and perished.";
}

function updateUI() {
    dom.turn.innerText = state.turn;
    dom.atp.innerText = state.atp;
    dom.biomass.innerText = state.biomass;

    dom.event.innerText = state.currentEvent ? `${state.currentEvent.name}: ${state.currentEvent.desc}` : "No Event";
    dom.ecosystem.innerText = `${state.currentEcosystem.name}`;
    dom.progressText.innerText = `${state.colonization} / ${state.currentEcosystem.threshold} CP`;

    const progressPerc = (state.colonization / state.currentEcosystem.threshold) * 100;
    dom.progressBar.style.width = `${Math.min(100, progressPerc)}%`;

    dom.deck.innerText = state.deck.length;
    dom.discard.innerText = state.discard.length;

    // Render Genome
    dom.genome.innerHTML = '';
    state.genome.forEach(card => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <div class="card-title">${card.name}</div>
            <div class="card-type">${card.type}</div>
            <div class="card-desc">${card.description}</div>
        `;
        dom.genome.appendChild(div);
    });

    // Render Hand
    dom.hand.innerHTML = '';
    state.hand.forEach(card => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <div class="card-title">${card.name}</div>
            <div class="card-type">${card.type}</div>
            <div class="card-desc">${card.description}</div>
        `;
        div.onclick = () => playCard(card.id);
        dom.hand.appendChild(div);
    });

    if (state.gameOver) {
        dom.overlay.classList.remove('hidden');
    } else {
        dom.overlay.classList.add('hidden');
    }
}

init();
