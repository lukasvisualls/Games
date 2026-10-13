const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const BASE_H = 640;
const GROUND_Y = BASE_H - 30;
const STATE = { IDLE: 0, PLAYING: 1, DYING: 2, GAME_OVER: 3, SHOP: 4 };

// ─── Dados persistentes ───────────────────────────────────────────────────────

let totalCoins   = parseInt(localStorage.getItem('fb_coins') || '0');
let ownedSkins   = JSON.parse(localStorage.getItem('fb_owned') || '[0]');
let activeSkinId = parseInt(localStorage.getItem('fb_skin')  || '0');
if (!ownedSkins.includes(activeSkinId)) activeSkinId = 0;

function saveProgress() {
    localStorage.setItem('fb_coins', totalCoins);
    localStorage.setItem('fb_owned', JSON.stringify(ownedSkins));
    localStorage.setItem('fb_skin',  activeSkinId);
}

const SKINS = [
    { id: 0, name: 'Clássico',  cost: 0   },
    { id: 1, name: 'Oceano',    cost: 10  },
    { id: 2, name: 'Galáxia',   cost: 30  },
    { id: 3, name: 'Chama',     cost: 60  },
    { id: 4, name: 'Gelo',      cost: 100 },
    { id: 5, name: 'Floresta',  cost: 150 },
    { id: 6, name: 'Fantasma',  cost: 220 },
    { id: 7, name: 'Robô',      cost: 320 },
    { id: 8, name: 'Dragão',    cost: 460 },
    { id: 9, name: 'Lendário',  cost: 650 }
];

// ─── Estado do jogo ───────────────────────────────────────────────────────────

let state = STATE.IDLE;
let score = 0;
let bestScore = parseInt(localStorage.getItem('fb_best') || '0');
let pipes = [];
let frameCount = 0;
let playFrames = 0;

const MIN_SPEED = 2.5;
const MAX_SPEED = 8.0;
let gameSpeed = MIN_SPEED;

let deathTimer = 0;
let deathAngle = 0;
let deathFlash = 0;
let startFlash = 0;
let gameOverAlpha = 0;

// Power-up 2x moedas
const DOUBLE_DURATION = 600;
let doubleActive = false;
let doubleTimer  = 0;

const coinPopups = [];

// ─── Pássaro e nuvens ─────────────────────────────────────────────────────────

const bird = new Bird(0, BASE_H / 2);
bird.skinId = activeSkinId;

const clouds = Array.from({ length: 6 }, () => ({
    x: Math.random() * 700,
    y: Math.random() * (BASE_H * 0.38),
    w: 55 + Math.random() * 65,
    speed: 0.25 + Math.random() * 0.35
}));

// ─── Escala adaptativa ────────────────────────────────────────────────────────

function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}

function getScale() { return canvas.height / BASE_H; }
function getVW()    { return canvas.width / getScale(); }

function toVirtual(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    const s = getScale();
    return { x: (cx - rect.left) / s, y: (cy - rect.top) / s };
}

function repositionBird() {
    const bx = Math.round(getVW() * 0.33);
    bird.startX = bx;
    if (state === STATE.IDLE || state === STATE.SHOP) bird.x = bx;
}

window.addEventListener('resize', () => { resizeCanvas(); repositionBird(); });
resizeCanvas();
repositionBird();

// ─── Draw helpers ─────────────────────────────────────────────────────────────

function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawBackground() {
    const vw = getVW();
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, '#1a8fc7');
    sky.addColorStop(1, '#60d4f5');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, vw, GROUND_Y);

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (const c of clouds) {
        ctx.beginPath();
        ctx.arc(c.x,              c.y,              c.w * 0.40, 0, Math.PI * 2);
        ctx.arc(c.x + c.w * 0.3, c.y - c.w * 0.15, c.w * 0.30, 0, Math.PI * 2);
        ctx.arc(c.x + c.w * 0.6, c.y,              c.w * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = '#8B6914'; ctx.fillRect(0, GROUND_Y, vw, 30);
    ctx.fillStyle = '#5C8A1E'; ctx.fillRect(0, GROUND_Y, vw, 10);
}

function updateClouds() {
    const vw = getVW();
    for (const c of clouds) {
        c.x -= c.speed;
        if (c.x + c.w < 0) {
            c.x = vw + c.w;
            c.y = Math.random() * (BASE_H * 0.38);
            c.w = 55 + Math.random() * 65;
        }
    }
}

function drawHUD() {
    const vw = getVW();

    // Score
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px Arial';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.strokeText(score, vw / 2, 52);
    ctx.fillStyle = '#fff';
    ctx.fillText(score, vw / 2, 52);

    // Moedas (canto superior direito)
    const cx = vw - 55, cy = 28;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#B8860B'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#996600';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('$', cx, cy);
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.strokeText(totalCoins, cx + 18, cy + 8);
    ctx.fillText(totalCoins, cx + 18, cy + 8);

    // Barra de 2x moedas
    if (doubleActive) {
        const barW = Math.min(220, vw - 80);
        const barH = 20;
        const bx   = vw / 2 - barW / 2;
        const by   = 64;
        const pct  = doubleTimer / DOUBLE_DURATION;

        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        roundRect(bx - 2, by - 2, barW + 4, barH + 4, 5);
        ctx.fill();

        const barGrad = ctx.createLinearGradient(bx, by, bx + barW, by);
        barGrad.addColorStop(0, '#FF44FF');
        barGrad.addColorStop(1, '#880088');
        ctx.fillStyle = barGrad;
        roundRect(bx, by, barW * pct, barH, 4);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeText('2x MOEDAS', vw / 2, by + barH - 4);
        ctx.fillText('2x MOEDAS', vw / 2, by + barH - 4);
    }
}

// ─── Telas de UI ──────────────────────────────────────────────────────────────

function drawIdleScreen() {
    const vw = getVW();
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fillRect(0, 0, vw, BASE_H);

    ctx.textAlign = 'center';
    ctx.font = 'bold 52px Arial';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#E5A000';
    ctx.strokeText('Flappy Bird', vw / 2, BASE_H / 2 - 70);
    ctx.fillStyle = '#FFD700';
    ctx.fillText('Flappy Bird', vw / 2, BASE_H / 2 - 70);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px Arial';
    ctx.fillText('Toque para começar', vw / 2, BASE_H / 2 + 10);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = '20px Arial';
    ctx.fillText('ou pressione Espaço', vw / 2, BASE_H / 2 + 46);

    const b = getIdleShopBtn();
    ctx.fillStyle = '#2980b9';
    roundRect(b.x, b.y, b.w, b.h, 10); ctx.fill();
    ctx.fillStyle = '#1a5f8a';
    roundRect(b.x, b.y + b.h - 8, b.w, 8, 10); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Loja', vw / 2, b.y + b.h * 0.66);
}

function drawGameOverScreen() {
    if (gameOverAlpha <= 0) return;
    const vw = getVW();
    ctx.save();
    ctx.globalAlpha = gameOverAlpha;

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, vw, BASE_H);

    const L = getGameOverLayout();
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    roundRect(L.px, L.py, L.pw, L.ph, 16); ctx.fill();
    ctx.strokeStyle = '#ccc'; ctx.lineWidth = 2;
    roundRect(L.px, L.py, L.pw, L.ph, 16); ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 38px Arial';
    ctx.fillStyle = '#e74c3c';
    ctx.fillText('Game Over!', vw / 2, L.py + 55);

    ctx.fillStyle = '#ddd';
    ctx.fillRect(L.px + 20, L.py + 68, L.pw - 40, 2);

    ctx.font = '22px Arial'; ctx.fillStyle = '#333';
    ctx.fillText(`Score: ${score}`, vw / 2, L.py + 108);
    ctx.fillStyle = '#e67e22'; ctx.font = 'bold 22px Arial';
    ctx.fillText(`Melhor: ${bestScore}`, vw / 2, L.py + 145);

    // Botão Reiniciar
    ctx.fillStyle = '#2ecc71';
    roundRect(L.restart.x, L.restart.y, L.restart.w, L.restart.h, 10); ctx.fill();
    ctx.fillStyle = '#27ae60';
    roundRect(L.restart.x, L.restart.y + L.restart.h - 8, L.restart.w, 8, 10); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 19px Arial'; ctx.textAlign = 'center';
    ctx.fillText('Reiniciar', L.restart.x + L.restart.w / 2, L.restart.y + L.restart.h * 0.64);

    // Botão Loja
    ctx.fillStyle = '#2980b9';
    roundRect(L.shop.x, L.shop.y, L.shop.w, L.shop.h, 10); ctx.fill();
    ctx.fillStyle = '#1a5f8a';
    roundRect(L.shop.x, L.shop.y + L.shop.h - 8, L.shop.w, 8, 10); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('Loja', L.shop.x + L.shop.w / 2, L.shop.y + L.shop.h * 0.64);

    ctx.restore();
}

// ─── Loja ─────────────────────────────────────────────────────────────────────

function getShopCardLayout() {
    const vw   = getVW();
    const cols = 5;
    const rows = 2;
    const rowGap = 8;
    const cardW = Math.min(90, Math.floor((vw - 60) / cols - 8));
    const cardH = Math.min(165, Math.round(cardW * 1.9));
    const gap   = Math.max(6, Math.floor((vw - 60 - cardW * cols) / (cols - 1)));
    const totalW = cardW * cols + gap * (cols - 1);
    return { cardW, cardH, gap, cols, rows, rowGap, startX: (vw - totalW) / 2, cardsY: 118 };
}

function drawShopScreen() {
    const vw = getVW();

    // Fundo estrelado
    const bg = ctx.createLinearGradient(0, 0, 0, BASE_H);
    bg.addColorStop(0, '#0D1B2A');
    bg.addColorStop(1, '#1B3060');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, vw, BASE_H);

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    for (let i = 0; i < 35; i++) {
        ctx.beginPath();
        ctx.arc((i * 79 + 13) % vw, (i * 53 + 7) % (BASE_H * 0.85), 0.5 + (i % 3) * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Título
    ctx.textAlign = 'center';
    ctx.font = 'bold 42px Arial';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#B8860B';
    ctx.strokeText('❆ LOJA ❆', vw / 2, 62);
    ctx.fillStyle = '#FFD700';
    ctx.fillText('❆ LOJA ❆', vw / 2, 62);

    // Saldo de moedas
    const coinX = vw / 2 - 45, coinY = 98;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.arc(coinX, coinY, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#B8860B'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#996600';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('$', coinX, coinY);
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 24px Arial'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
    ctx.fillText(`${totalCoins} moedas`, coinX + 20, coinY + 9);

    // Cards
    const { cardW, cardH, gap, cols, rowGap, startX, cardsY } = getShopCardLayout();

    SKINS.forEach((skin, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx  = startX + col * (cardW + gap);
        const cy  = cardsY + row * (cardH + rowGap);

        const isOwned  = ownedSkins.includes(skin.id);
        const isActive = activeSkinId === skin.id;

        ctx.fillStyle = isActive ? 'rgba(255,215,0,0.13)' : 'rgba(255,255,255,0.06)';
        roundRect(cx, cy, cardW, cardH, 10); ctx.fill();
        ctx.strokeStyle = isActive ? '#FFD700' : 'rgba(255,255,255,0.18)';
        ctx.lineWidth = isActive ? 2.5 : 1.5;
        roundRect(cx, cy, cardW, cardH, 10); ctx.stroke();

        const previewR = Math.round(cardW * 0.27);
        Bird.drawPreview(ctx, cx + cardW / 2, cy + cardH * 0.30, previewR, skin.id);

        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(9, Math.round(cardW * 0.12))}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(skin.name, cx + cardW / 2, cy + cardH * 0.60);

        const priceY = cy + cardH * 0.74;
        if (skin.cost === 0 || isOwned) {
            ctx.fillStyle = '#aaa';
            ctx.font = `${Math.max(8, Math.round(cardW * 0.09))}px Arial`;
            ctx.fillText(isOwned ? 'Desbloq.' : 'Grátis', cx + cardW / 2, priceY);
        } else {
            const iconX = cx + cardW / 2 - 16;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath(); ctx.arc(iconX, priceY - 5, 7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#996600';
            ctx.font = 'bold 7px Arial'; ctx.textBaseline = 'middle';
            ctx.fillText('$', iconX, priceY - 5);
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#FFD700';
            ctx.font = `bold ${Math.max(9, Math.round(cardW * 0.12))}px Arial`;
            ctx.textAlign = 'left';
            ctx.fillText(skin.cost, iconX + 10, priceY);
            ctx.textAlign = 'center';
        }

        const btnW = cardW * 0.82;
        const btnH = Math.max(20, Math.round(cardH * 0.14));
        const btnX = cx + (cardW - btnW) / 2;
        const btnY = cy + cardH - btnH - 8;
        const fs   = Math.max(9, Math.round(btnH * 0.52));

        ctx.fillStyle = isActive ? '#27ae60' : isOwned ? '#2980b9' : totalCoins >= skin.cost ? '#e67e22' : '#444';
        roundRect(btnX, btnY, btnW, btnH, 5); ctx.fill();
        ctx.fillStyle = isActive || isOwned || totalCoins >= skin.cost ? '#fff' : '#777';
        ctx.font = `bold ${fs}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(isActive ? '✓ Ativo' : isOwned ? 'Usar' : 'Comprar', cx + cardW / 2, btnY + btnH * 0.70);
    });

    // Botão Voltar
    const bb = getShopBackBtn();
    ctx.fillStyle = '#c0392b';
    roundRect(bb.x, bb.y, bb.w, bb.h, 10); ctx.fill();
    ctx.fillStyle = '#922b21';
    roundRect(bb.x, bb.y + bb.h - 8, bb.w, 8, 10); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px Arial'; ctx.textAlign = 'center';
    ctx.fillText('← Voltar', bb.x + bb.w / 2, bb.y + bb.h * 0.65);
}

// ─── Popups de moeda ──────────────────────────────────────────────────────────

function drawCoinPopups() {
    for (const p of coinPopups) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
    }
}

// ─── Bounds helpers ───────────────────────────────────────────────────────────

function getIdleShopBtn() {
    const vw = getVW();
    const w = 130, h = 44;
    return { x: (vw - w) / 2, y: BASE_H / 2 + 115, w, h };
}

function getShopBackBtn() {
    const vw = getVW();
    const w = 150, h = 48;
    return { x: (vw - w) / 2, y: BASE_H - 80, w, h };
}

function getGameOverLayout() {
    const vw = getVW();
    const pw = 320, ph = 298;
    const px = (vw - pw) / 2;
    const py = (BASE_H - ph) / 2 - 20;
    const bw = 128, bh = 48;
    const gap = 14;
    const totalBtnW = bw * 2 + gap;
    const by = py + 228;
    return {
        px, py, pw, ph,
        restart: { x: (vw - totalBtnW) / 2,              y: by, w: bw, h: bh },
        shop:    { x: (vw - totalBtnW) / 2 + bw + gap,   y: by, w: bw, h: bh }
    };
}

function getShopSkinButtonBounds(i) {
    const { cardW, cardH, gap, cols, rowGap, startX, cardsY } = getShopCardLayout();
    const col  = i % cols;
    const row  = Math.floor(i / cols);
    const cx   = startX + col * (cardW + gap);
    const cy   = cardsY + row * (cardH + rowGap);
    const btnW = cardW * 0.82;
    const btnH = Math.max(20, Math.round(cardH * 0.14));
    const btnX = cx + (cardW - btnW) / 2;
    const btnY = cy + cardH - btnH - 8;
    return { x: btnX, y: btnY, w: btnW, h: btnH };
}

// ─── Lógica do estado ─────────────────────────────────────────────────────────

function triggerGameOver() {
    window.JarvisAudio.hit();
    if (score > bestScore) bestScore = score;
    localStorage.setItem('fb_best', bestScore);
    saveProgress();
    state     = STATE.DYING;
    deathTimer = 0;
    deathAngle = 0;
    deathFlash = 0.85;
    gameOverAlpha = 0;
}

function resetGame() {
    repositionBird();
    bird.reset();
    bird.skinId   = activeSkinId;
    pipes         = [];
    playFrames    = 0;
    score         = 0;
    gameSpeed     = MIN_SPEED;
    deathFlash    = 0;
    startFlash    = 0.65;
    gameOverAlpha = 0;
    doubleActive  = false;
    doubleTimer   = 0;
    state         = STATE.PLAYING;
}

function openShop() { state = STATE.SHOP; }

function handleShopClick(vx, vy) {
    const bb = getShopBackBtn();
    if (vx >= bb.x && vx <= bb.x + bb.w && vy >= bb.y && vy <= bb.y + bb.h) {
        state = STATE.IDLE;
        repositionBird();
        return;
    }

    SKINS.forEach((skin, i) => {
        const b = getShopSkinButtonBounds(i);
        if (vx < b.x || vx > b.x + b.w || vy < b.y || vy > b.y + b.h) return;
        const isOwned  = ownedSkins.includes(skin.id);
        const isActive = activeSkinId === skin.id;
        if (isActive) return;
        if (isOwned) {
            activeSkinId = skin.id;
            bird.skinId  = activeSkinId;
            saveProgress();
        } else if (totalCoins >= skin.cost) {
            totalCoins  -= skin.cost;
            ownedSkins.push(skin.id);
            activeSkinId = skin.id;
            bird.skinId  = activeSkinId;
            saveProgress();
        }
    });
}

function handleAction(vx, vy) {
    if (state === STATE.IDLE || state === STATE.PLAYING) window.JarvisAudio.flap();
    if (state === STATE.DYING) return;

    if (state === STATE.SHOP) { handleShopClick(vx, vy); return; }

    if (state === STATE.IDLE) {
        const sb = getIdleShopBtn();
        if (vx >= sb.x && vx <= sb.x + sb.w && vy >= sb.y && vy <= sb.y + sb.h) {
            openShop(); return;
        }
        resetGame();   // Fix: reseta tudo (pipes, score, etc.) antes de começar
        bird.jump();
        return;
    }

    if (state === STATE.PLAYING) { bird.jump(); return; }

    if (state === STATE.GAME_OVER && gameOverAlpha > 0.8) {
        const L = getGameOverLayout();
        if (vx >= L.restart.x && vx <= L.restart.x + L.restart.w &&
            vy >= L.restart.y && vy <= L.restart.y + L.restart.h) {
            resetGame(); return;
        }
        if (vx >= L.shop.x && vx <= L.shop.x + L.shop.w &&
            vy >= L.shop.y && vy <= L.shop.y + L.shop.h) {
            openShop(); return;
        }
    }
}

// ─── Eventos ──────────────────────────────────────────────────────────────────

canvas.addEventListener('mousedown', (e) => {
    const { x, y } = toVirtual(e.clientX, e.clientY);
    handleAction(x, y);
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const { x, y } = toVirtual(t.clientX, t.clientY);
    handleAction(x, y);
}, { passive: false });

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (e.repeat) return;
        if (state === STATE.IDLE || state === STATE.PLAYING) window.JarvisAudio.flap();
        if (state === STATE.IDLE) {
            resetGame(); bird.jump();   // Fix: igual ao clique, reseta tudo
        } else if (state === STATE.PLAYING) {
            bird.jump();
        } else if (state === STATE.GAME_OVER && gameOverAlpha > 0.8) {
            resetGame();
        }
    }
    if (e.code === 'Escape' && state === STATE.SHOP) {
        state = STATE.IDLE; repositionBird();
    }
});

// ─── Loop principal ───────────────────────────────────────────────────────────

function update() {
    frameCount++;
    updateClouds();

    // Popups de moeda
    for (let i = coinPopups.length - 1; i >= 0; i--) {
        const p = coinPopups[i];
        p.y -= 1.8;
        p.life--;
        p.alpha = Math.max(0, p.life / 50);
        if (p.life <= 0) coinPopups.splice(i, 1);
    }

    if (state === STATE.IDLE) {
        bird.y = bird.startY + Math.sin(frameCount * 0.05) * 10;
        bird.velocity = 0;
        return;
    }

    if (state === STATE.DYING) {
        deathTimer++;
        deathFlash = Math.max(0, deathFlash - 0.016);
        deathAngle += 0.2;
        bird.velocity += bird.gravity;
        bird.y += bird.velocity;
        if (bird.y + bird.radius >= GROUND_Y) { bird.y = GROUND_Y - bird.radius; bird.velocity = 0; }
        if (deathTimer >= 65) state = STATE.GAME_OVER;
        return;
    }

    if (state === STATE.GAME_OVER) {
        gameOverAlpha = Math.min(1, gameOverAlpha + 0.045);
        return;
    }

    if (state === STATE.SHOP) return;

    // ── PLAYING ───────────────────────────────────────────────────────────────
    startFlash = Math.max(0, startFlash - 0.04);
    gameSpeed  = Math.min(MAX_SPEED, MIN_SPEED + score * 0.22);

    // Timer do power-up 2x
    if (doubleActive) {
        doubleTimer--;
        if (doubleTimer <= 0) { doubleActive = false; doubleTimer = 0; }
    }

    bird.update();

    if (bird.y - bird.radius < 0)         { bird.y = bird.radius; bird.velocity = 0; }
    if (bird.y + bird.radius >= GROUND_Y) { bird.y = GROUND_Y - bird.radius; triggerGameOver(); return; }

    playFrames++;
    const spawnInterval = Math.max(55, Math.round(90 - score * 1.2));
    if (playFrames % spawnInterval === 0) pipes.push(new Pipe(getVW() + 10, BASE_H));

    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.speed = gameSpeed;
        pipe.update();

        // Coleta do power-up 2x
        if (pipe.hasDoublePowerup && !pipe.doubleCollected) {
            const pos  = pipe.getDoublePowerupPos();
            const dist = Math.hypot(pos.x - bird.x, pos.y - bird.y);
            if (dist < pipe.doubleR + bird.radius) {
                pipe.doubleCollected = true;
                doubleActive = true;
                doubleTimer  = DOUBLE_DURATION;
            }
        }

        // Coleta de moeda
        if (pipe.hasCoin && !pipe.coinCollected) {
            const pos  = pipe.getCoinPos();
            const dist = Math.hypot(pos.x - bird.x, pos.y - bird.y);
            if (dist < pipe.coinR + bird.radius) {
                pipe.coinCollected = true;
                const value = doubleActive ? 2 : 1;
                totalCoins += value;
                saveProgress();
                coinPopups.push({
                    x: pos.x, y: pos.y, alpha: 1, life: 50,
                    text:  doubleActive ? '+2' : '+1',
                    color: doubleActive ? '#FF44FF' : '#FFD700'
                });
            }
        }

        if (!pipe.passed && pipe.x + pipe.width < bird.x) { pipe.passed = true; score++; }
        if (pipe.collidesWith(bird)) { triggerGameOver(); return; }
        if (pipe.isOffScreen()) pipes.splice(i, 1);
    }
}

function draw() {
    const scale = getScale();
    const vw    = getVW();

    ctx.save();
    ctx.scale(scale, scale);

    if (state === STATE.SHOP) {
        drawShopScreen();
        ctx.restore();
        return;
    }

    drawBackground();
    for (const pipe of pipes) pipe.draw(ctx);

    if (state === STATE.IDLE)       bird.draw(ctx, Math.sin(frameCount * 0.05) * 0.2);
    else if (state === STATE.DYING) bird.draw(ctx, deathAngle);
    else                             bird.draw(ctx);

    drawHUD();
    drawCoinPopups();

    if (startFlash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${startFlash})`;
        ctx.fillRect(0, 0, vw, BASE_H);
    }
    if (deathFlash > 0) {
        ctx.fillStyle = `rgba(220,30,30,${deathFlash})`;
        ctx.fillRect(0, 0, vw, BASE_H);
    }

    if (state === STATE.IDLE)      drawIdleScreen();
    if (state === STATE.GAME_OVER) drawGameOverScreen();

    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
