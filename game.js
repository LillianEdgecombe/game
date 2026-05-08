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
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 3;
        this.color = '#ffff99';
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

class Microbe {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.color = '#00ffcc';
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
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        // Draw "cilia" or some details
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + Date.now() * 0.01;
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

    player = new Microbe(canvas.width / 2, canvas.height / 2);
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
    nutrients.push(new Nutrient(x, y));
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
            nutrients.splice(i, 1);
            score += 10;
            scoreElement.innerText = `Score: ${score}`;
            spawnNutrient();

            // Growth
            player.radius += 0.5;

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
    uiTitle.innerText = "The Microbial Loop Continues...";
    uiText.innerHTML = `
        <p>Your microbe was consumed by a grazer or lysed by a virus.</p>
        <p><strong>Final Score: ${score}</strong></p>
        <hr>
        <p><small>In the ocean, the "Microbial Loop" describes how bacteria consume dissolved organic matter,
        and are in turn eaten by protists or killed by viruses, recycling nutrients back into the ecosystem.</small></p>
    `;
}

restartBtn.addEventListener('click', init);

// Start the game
init();
