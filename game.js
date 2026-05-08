/**
 * Marine Microbial Ecology Game
 * Concepts: Microbial Loop, Nutrient Cycling, Trophic Interactions
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const sizeElement = document.getElementById('size');
const uiOverlay = document.getElementById('ui-overlay');
const uiTitle = document.getElementById('ui-title');
const uiText = document.getElementById('ui-text');
const restartBtn = document.getElementById('restart-btn');
const startBtn = document.getElementById('start-btn');
const selectionScreen = document.getElementById('selection-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const morphBtns = document.querySelectorAll('#morphotype-selection .select-btn');
const metabolismBtns = document.querySelectorAll('#metabolism-selection .select-btn');

// Game constants
const BASE_SPEED = 3;
const NUTRIENT_COUNT = 50;
const PROTIST_COUNT = 3;
const VIRUS_COUNT = 5;
const MAX_SIZE = 30;

// Game state
let score = 0;
let gameOver = false;
let gameRunning = false;
let player;
let nutrients = [];
let protists = [];
let viruses = [];
let mouse = { x: 0, y: 0 };
let selectedMorphotype = 'coccus';
let selectedMetabolism = 'photo';

class Virus {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.color = '#cc33ff';
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off walls
        if (this.x < this.radius || this.x > canvas.width - this.radius) this.vx *= -1;
        if (this.y < this.radius || this.y > canvas.height - this.radius) this.vy *= -1;
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.radius);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = this.x + Math.cos(angle) * this.radius;
            const y = this.y + Math.sin(angle) * this.radius;
            ctx.lineTo(x, y);
            const spikeX = this.x + Math.cos(angle) * (this.radius + 3);
            const spikeY = this.y + Math.sin(angle) * (this.radius + 3);
            ctx.moveTo(x, y);
            ctx.lineTo(spikeX, spikeY);
            ctx.moveTo(x, y);
        }
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }
}

class Protist {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 25;
        this.color = '#ff6666';
        this.speed = 1.5;
    }

    update() {
        // Chase player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.closePath();

        // Draw a "mouth" or nucleus
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();
        ctx.closePath();
    }
}

class Nutrient {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'photo', 'hetero', 'chemo'
        this.radius = 3;

        switch(type) {
            case 'photo': this.color = '#ffff00'; break; // Sunlight/Light energy
            case 'hetero': this.color = '#ffcc99'; break; // DOM/Organic matter
            case 'chemo': this.color = '#99ff99'; break; // Inorganic chemicals
        }
    }

    draw() {
        ctx.beginPath();
        if (this.type === 'photo') {
            // Star shape for light
            for (let i = 0; i < 5; i++) {
                ctx.lineTo(this.x + Math.cos((18+i*72)/180*Math.PI)*this.radius*2,
                           this.y + Math.sin((18+i*72)/180*Math.PI)*this.radius*2);
                ctx.lineTo(this.x + Math.cos((54+i*72)/180*Math.PI)*this.radius,
                           this.y + Math.sin((54+i*72)/180*Math.PI)*this.radius);
            }
        } else if (this.type === 'chemo') {
            // Diamond for chemicals
            ctx.moveTo(this.x, this.y - this.radius * 1.5);
            ctx.lineTo(this.x + this.radius * 1.5, this.y);
            ctx.lineTo(this.x, this.y + this.radius * 1.5);
            ctx.lineTo(this.x - this.radius * 1.5, this.y);
        } else {
            // Circle for DOM
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        }
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

class Microbe {
    constructor(x, y, morphotype, metabolism) {
        this.x = x;
        this.y = y;
        this.morphotype = morphotype; // 'coccus', 'bacillus', 'spirillum'
        this.metabolism = metabolism; // 'photo', 'hetero', 'chemo'
        this.radius = 10;

        switch(metabolism) {
            case 'photo': this.color = '#00ffcc'; break;
            case 'hetero': this.color = '#ff9966'; break;
            case 'chemo': this.color = '#66ff66'; break;
        }

        this.baseSpeed = BASE_SPEED;
    }

    update() {
        // Smoothly follow mouse
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            this.x += (dx / distance) * this.baseSpeed;
            this.y += (dy / distance) * this.baseSpeed;
        }

        // Boundary checks
        if (this.x < this.radius) this.x = this.radius;
        if (this.x > canvas.width - this.radius) this.x = canvas.width - this.radius;
        if (this.y < this.radius) this.y = this.radius;
        if (this.y > canvas.height - this.radius) this.y = canvas.height - this.radius;
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;

        if (this.morphotype === 'coccus') {
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else if (this.morphotype === 'bacillus') {
            ctx.ellipse(this.x, this.y, this.radius * 1.5, this.radius * 0.8, Math.atan2(mouse.y - this.y, mouse.x - this.x), 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else if (this.morphotype === 'spirillum') {
            const angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(-this.radius * 1.5, 0);
            for (let i = -1.5; i <= 1.5; i += 0.1) {
                ctx.lineTo(i * this.radius, Math.sin(i * 3 + Date.now() * 0.01) * this.radius * 0.5);
            }
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();
        }

        ctx.closePath();

        // Draw "cilia" (flagella for spirillum)
        const numCilia = this.morphotype === 'spirillum' ? 3 : 8;
        for (let i = 0; i < numCilia; i++) {
            const angle = (i / numCilia) * Math.PI * 2 + Date.now() * 0.01;
            const x1 = this.x + Math.cos(angle) * this.radius;
            const y1 = this.y + Math.sin(angle) * this.radius;
            const x2 = this.x + Math.cos(angle) * (this.radius + 4);
            const y2 = this.y + Math.sin(angle) * (this.radius + 4);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = this.color;
            ctx.stroke();
        }
    }
}

// Event Listeners
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

function resize() {
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
}

window.addEventListener('resize', () => {
    if (gameRunning) resize();
});

// Initialization
function init() {
    resize();
    showSelection();
}

function showSelection() {
    gameRunning = false;
    uiOverlay.classList.remove('hidden');
    selectionScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    uiTitle.innerText = "Welcome to Microbe Mania";
}

function startGame() {
    player = new Microbe(canvas.width / 2, canvas.height / 2, selectedMorphotype, selectedMetabolism);
    mouse.x = canvas.width / 2;
    mouse.y = canvas.height / 2;

    nutrients = [];
    for (let i = 0; i < NUTRIENT_COUNT; i++) {
        spawnNutrient();
    }

    protists = [];
    for (let i = 0; i < PROTIST_COUNT; i++) {
        spawnProtist();
    }

    viruses = [];
    for (let i = 0; i < VIRUS_COUNT; i++) {
        spawnVirus();
    }

    score = 0;
    scoreElement.innerText = `Score: ${score}`;
    player.radius = 10;
    sizeElement.innerText = `Size: 10μm`;

    gameOver = false;
    gameRunning = true;

    uiOverlay.classList.add('hidden');

    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!gameRunning) return;

    update();
    draw();

    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    } else {
        showGameOver();
    }
}

function spawnNutrient() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;

    // Weighted spawning: 50% chance for player's metabolism type, 25% for others
    const rand = Math.random();
    let type;
    if (rand < 0.5) {
        type = selectedMetabolism;
    } else {
        const others = ['photo', 'hetero', 'chemo'].filter(t => t !== selectedMetabolism);
        type = rand < 0.75 ? others[0] : others[1];
    }

    nutrients.push(new Nutrient(x, y, type));
}

function spawnVirus() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    viruses.push(new Virus(x, y));
}

function spawnProtist() {
    // Spawn far from player
    let x, y, dist;
    do {
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
        const dx = x - player.x;
        const dy = y - player.y;
        dist = Math.sqrt(dx * dx + dy * dy);
    } while (dist < 300);
    protists.push(new Protist(x, y));
}

function update() {
    player.update();

    // Virus logic
    viruses.forEach(virus => {
        virus.update();

        // Collision with player
        const dx = player.x - virus.x;
        const dy = player.y - virus.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.radius + virus.radius) {
            gameOver = true;
        }
    });

    // Protist logic
    protists.forEach(protist => {
        protist.update();

        // Collision with player
        const dx = player.x - protist.x;
        const dy = player.y - protist.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.radius + protist.radius) {
            gameOver = true;
        }
    });

    // Nutrient collision (iterating backwards to safely splice)
    for (let i = nutrients.length - 1; i >= 0; i--) {
        const nutrient = nutrients[i];
        const dx = player.x - nutrient.x;
        const dy = player.y - nutrient.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.radius + nutrient.radius) {
            const isCorrectNutrient = nutrient.type === player.metabolism;
            nutrients.splice(i, 1);

            if (isCorrectNutrient) {
                score += 10;
                // Growth
                player.radius += 0.5;
            } else {
                score += 2; // Small bonus for "wrong" nutrient? No, maybe just 0.
            }

            scoreElement.innerText = `Score: ${score}`;
            spawnNutrient();

            // Binary Fission (Division)
            if (player.radius >= MAX_SIZE) {
                player.radius = 10;
                score += 100;
                scoreElement.innerText = `Score: ${score}`;
                // Increase difficulty
                spawnProtist();
                spawnVirus();
            }

            sizeElement.innerText = `Size: ${Math.round(player.radius)}μm`;
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nutrients.forEach(n => n.draw());
    viruses.forEach(v => v.draw());
    protists.forEach(p => p.draw());
    player.draw();
}

function showGameOver() {
    gameRunning = false;
    uiOverlay.classList.remove('hidden');
    selectionScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    uiTitle.innerText = "The Microbial Loop Continues...";
    uiText.innerHTML = `
        <p>Your microbe was consumed by a grazer or lysed by a virus.</p>
        <p><strong>Final Score: ${score}</strong></p>
        <hr>
        <p><small>In the ocean, the "Microbial Loop" describes how bacteria consume dissolved organic matter,
        and are in turn eaten by protists or killed by viruses, recycling nutrients back into the ecosystem.</small></p>
    `;
}

// Event listeners for selection
morphBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        morphBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMorphotype = btn.dataset.value;
    });
});

metabolismBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        metabolismBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMetabolism = btn.dataset.value;
    });
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', showSelection);

// Start the game
init();
