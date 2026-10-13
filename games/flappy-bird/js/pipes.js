class Pipe {
    constructor(x, canvasHeight) {
        this.x = x;
        this.canvasHeight = canvasHeight;
        this.width = 64;
        this.speed = 1.8;
        this.gapSize = 200;
        this.capHeight = 22;
        this.capOverhang = 6;
        this.passed = false;

        const groundY = canvasHeight - 30;
        const margin = 80;
        const maxGapTop = groundY - this.gapSize - margin;
        this.gapY = Math.random() * (maxGapTop - margin) + margin;

        this.hasCoin = Math.random() < 0.65;
        this.coinCollected = false;
        this.coinR = 11;

        // Power-up 2x moedas (raro, só aparece se não houver moeda)
        this.hasDoublePowerup = !this.hasCoin && Math.random() < 0.12;
        this.doubleCollected = false;
        this.doubleR = 13;
    }

    update() { this.x -= this.speed; }

    getCoinPos() {
        return { x: this.x + this.width / 2, y: this.gapY + this.gapSize / 2 };
    }

    getDoublePowerupPos() {
        return { x: this.x + this.width / 2, y: this.gapY + this.gapSize / 2 };
    }

    draw(ctx) {
        const { x, width, gapY, gapSize, capHeight, capOverhang, canvasHeight } = this;
        const bottomY = gapY + gapSize;
        const groundY = canvasHeight - 30;

        // Tubo superior
        ctx.fillStyle = '#3CB043';
        ctx.fillRect(x, 0, width, gapY - capHeight);
        ctx.fillStyle = '#2E8B38';
        ctx.fillRect(x - capOverhang, gapY - capHeight, width + capOverhang * 2, capHeight);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x + 4, 0, 8, gapY - capHeight);

        // Tubo inferior
        ctx.fillStyle = '#3CB043';
        ctx.fillRect(x, bottomY + capHeight, width, groundY - bottomY - capHeight);
        ctx.fillStyle = '#2E8B38';
        ctx.fillRect(x - capOverhang, bottomY, width + capOverhang * 2, capHeight);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x + 4, bottomY + capHeight, 8, groundY - bottomY - capHeight);

        if (this.hasCoin && !this.coinCollected)            this._drawCoin(ctx);
        if (this.hasDoublePowerup && !this.doubleCollected) this._drawDoublePowerup(ctx);
    }

    _drawCoin(ctx) {
        ctx.save();
        const { x: cx, y: cy } = this.getCoinPos();
        const pulse = Math.sin(Date.now() * 0.005) * 1.5;
        const r = this.coinR + pulse;

        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.2);
        glow.addColorStop(0, 'rgba(255,215,0,0.45)');
        glow.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(cx, cy, r * 2.2, 0, Math.PI * 2); ctx.fill();

        const g = ctx.createRadialGradient(cx - r * .3, cy - r * .3, 0, cx, cy, r);
        g.addColorStop(0,   '#FFE566');
        g.addColorStop(0.6, '#FFD700');
        g.addColorStop(1,   '#CC9900');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#B8860B'; ctx.lineWidth = 1.5; ctx.stroke();

        ctx.fillStyle = '#996600';
        ctx.font = `bold ${Math.round(r * 1.15)}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('$', cx, cy + 0.5);
        ctx.textBaseline = 'alphabetic';
        ctx.restore();
    }

    _drawDoublePowerup(ctx) {
        ctx.save();
        const { x: cx, y: cy } = this.getDoublePowerupPos();
        const t = Date.now() * 0.005;
        const pulse = Math.sin(t) * 1.8;
        const r = this.doubleR + pulse;

        // Halo pulsante magenta
        const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.6);
        halo.addColorStop(0, 'rgba(200,0,255,0.5)');
        halo.addColorStop(1, 'rgba(200,0,255,0)');
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(cx, cy, r * 2.6, 0, Math.PI * 2); ctx.fill();

        // Corpo roxo-magenta
        const g = ctx.createRadialGradient(cx - r * .3, cy - r * .3, 0, cx, cy, r);
        g.addColorStop(0,   '#FF66FF');
        g.addColorStop(0.5, '#CC00CC');
        g.addColorStop(1,   '#660066');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#FF00FF'; ctx.lineWidth = 2; ctx.stroke();

        // Texto "x2"
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.round(r * 1.3)}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = '#FF00FF'; ctx.shadowBlur = 6;
        ctx.fillText('x2', cx, cy + 0.5);
        ctx.shadowBlur = 0;
        ctx.textBaseline = 'alphabetic';
        ctx.restore();
    }

    isOffScreen() { return this.x + this.width + this.capOverhang < 0; }

    collidesWith(bird) {
        const b = bird.getBounds();
        const { x, width, gapY, gapSize, capOverhang } = this;
        const pipeLeft  = x - capOverhang;
        const pipeRight = x + width + capOverhang;
        const bottomY   = gapY + gapSize;
        const overlapX = b.x + b.width > pipeLeft && b.x < pipeRight;
        if (!overlapX) return false;
        return b.y < gapY || b.y + b.height > bottomY;
    }
}
