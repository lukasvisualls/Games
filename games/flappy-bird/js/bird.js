class Bird {
    constructor(x, y) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.radius = 18;
        this.velocity = 0;
        this.gravity = 0.25;
        this.jumpForce = -6.5;
        this.skinId = 0;
    }

    update() { this.velocity += this.gravity; this.y += this.velocity; }
    jump()   { this.velocity = this.jumpForce; }

    draw(ctx, forceAngle = null) {
        const angle = forceAngle !== null
            ? forceAngle
            : Math.min(Math.PI / 2, Math.max(-Math.PI / 6, this.velocity * 0.055));
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        Bird._drawSkin(ctx, this.radius, this.skinId);
        ctx.restore();
    }

    getBounds() {
        const s = 4;
        return { x: this.x-this.radius+s, y: this.y-this.radius+s, width: (this.radius-s)*2, height: (this.radius-s)*2 };
    }

    reset() { this.x = this.startX; this.y = this.startY; this.velocity = 0; }

    static drawPreview(ctx, x, y, radius, skinId) {
        ctx.save();
        ctx.translate(x, y);
        Bird._drawSkin(ctx, radius, skinId);
        ctx.restore();
    }

    static _drawSkin(ctx, r, id) {
        switch (id) {
            case 1: Bird._drawOcean(ctx, r);    break;
            case 2: Bird._drawGalaxia(ctx, r);  break;
            case 3: Bird._drawChama(ctx, r);    break;
            case 4: Bird._drawGelo(ctx, r);     break;
            case 5: Bird._drawFloresta(ctx, r); break;
            case 6: Bird._drawFantasma(ctx, r); break;
            case 7: Bird._drawRobo(ctx, r);     break;
            case 8: Bird._drawDragao(ctx, r);   break;
            case 9: Bird._drawLendario(ctx, r); break;
            default: Bird._drawClassico(ctx, r); break;
        }
    }

    // ── Skin 0: Clássico ─────────────────────────────────────────────────────
    static _drawClassico(ctx, r) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#E5A000'; ctx.lineWidth = 2.5; ctx.stroke();

        ctx.fillStyle = '#FFA500';
        ctx.beginPath(); ctx.ellipse(-r*.33, r*.28, r*.56, r*.33, -.3, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(r*.39, -r*.28, r*.33, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(r*.50, -r*.28, r*.17, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = '#FF8C00'; ctx.beginPath();
        ctx.moveTo(r*.9,-r*.17); ctx.lineTo(r*1.5,0); ctx.lineTo(r*.9,r*.28);
        ctx.closePath(); ctx.fill();
    }

    // ── Skin 1: Oceano ────────────────────────────────────────────────────────
    static _drawOcean(ctx, r) {
        const g = ctx.createRadialGradient(-r*.2,-r*.2,r*.1,0,0,r);
        g.addColorStop(0,'#60C8FF'); g.addColorStop(1,'#1A5FAB');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#0E3D7A'; ctx.lineWidth=2.5; ctx.stroke();

        ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=1;
        for (let i=0;i<3;i++){ctx.beginPath();ctx.arc(-r*.25+i*r*.22,r*.05,r*.22,Math.PI,0);ctx.stroke();}

        ctx.fillStyle='#0E3D7A';
        ctx.beginPath(); ctx.ellipse(-r*.33,r*.28,r*.56,r*.33,-.3,0,Math.PI*2); ctx.fill();

        ctx.fillStyle='#E8F4FF'; ctx.beginPath(); ctx.arc(r*.39,-r*.28,r*.33,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#001F5B'; ctx.beginPath(); ctx.arc(r*.50,-r*.28,r*.17,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(r*.42,-r*.35,r*.08,0,Math.PI*2); ctx.fill();

        ctx.fillStyle='#FF6B35'; ctx.beginPath();
        ctx.moveTo(r*.9,-r*.17); ctx.lineTo(r*1.5,0); ctx.lineTo(r*.9,r*.28);
        ctx.closePath(); ctx.fill(); ctx.strokeStyle='#CC4400'; ctx.lineWidth=1; ctx.stroke();
    }

    // ── Skin 2: Galáxia ───────────────────────────────────────────────────────
    static _drawGalaxia(ctx, r) {
        const aura = ctx.createRadialGradient(0,0,r*.5,0,0,r*1.75);
        aura.addColorStop(0,'rgba(138,43,226,.38)'); aura.addColorStop(1,'rgba(138,43,226,0)');
        ctx.fillStyle=aura; ctx.beginPath(); ctx.arc(0,0,r*1.75,0,Math.PI*2); ctx.fill();

        const body = ctx.createRadialGradient(-r*.25,-r*.25,r*.05,0,0,r);
        body.addColorStop(0,'#8B5CF6'); body.addColorStop(.55,'#3B0764'); body.addColorStop(1,'#0A0015');
        ctx.fillStyle=body; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#A855F7'; ctx.lineWidth=2; ctx.stroke();

        ctx.fillStyle='rgba(255,255,255,.9)';
        for (const [sx,sy,sr] of [[-6,-8,1.8],[-10,2,1.2],[5,6,1.5],[-4,8,1],[8,-10,1.3],[-8,-2,1],[2,-12,.9],[10,1,1.1]])
            {ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.fill();}

        const wing=ctx.createLinearGradient(-r*.9,0,0,r*.6);
        wing.addColorStop(0,'#6D28D9'); wing.addColorStop(1,'#2D1B69');
        ctx.fillStyle=wing; ctx.beginPath(); ctx.ellipse(-r*.33,r*.28,r*.6,r*.37,-.3,0,Math.PI*2); ctx.fill();

        const eg=ctx.createRadialGradient(r*.39,-r*.28,0,r*.39,-r*.28,r*.72);
        eg.addColorStop(0,'rgba(0,255,255,.55)'); eg.addColorStop(1,'rgba(0,255,255,0)');
        ctx.fillStyle=eg; ctx.beginPath(); ctx.arc(r*.39,-r*.28,r*.72,0,Math.PI*2); ctx.fill();

        ctx.fillStyle='#D0F4FF'; ctx.beginPath(); ctx.arc(r*.39,-r*.28,r*.33,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#00FFFF'; ctx.beginPath(); ctx.arc(r*.50,-r*.28,r*.20,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#003333'; ctx.beginPath(); ctx.arc(r*.52,-r*.28,r*.10,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(r*.38,-r*.36,r*.10,0,Math.PI*2); ctx.fill();

        const beak=ctx.createLinearGradient(r*.9,-r*.17,r*1.5,0);
        beak.addColorStop(0,'#DDD6FE'); beak.addColorStop(1,'#7C3AED');
        ctx.fillStyle=beak; ctx.beginPath();
        ctx.moveTo(r*.9,-r*.17); ctx.lineTo(r*1.5,0); ctx.lineTo(r*.9,r*.28);
        ctx.closePath(); ctx.fill(); ctx.strokeStyle='#EDE9FE'; ctx.lineWidth=1; ctx.stroke();
    }

    // ── Skin 3: Chama ─────────────────────────────────────────────────────────
    static _drawChama(ctx, r) {
        const aura=ctx.createRadialGradient(0,0,r*.3,0,0,r*1.9);
        aura.addColorStop(0,'rgba(255,100,0,.4)'); aura.addColorStop(1,'rgba(255,80,0,0)');
        ctx.fillStyle=aura; ctx.beginPath(); ctx.arc(0,0,r*1.9,0,Math.PI*2); ctx.fill();

        // Chamas atrás
        for (const [fx,fy,fw,fh,fc] of [[-r*.75,-r*.35,r*.22,r*.38,'#FF4400'],[-r*.85,r*.1,r*.18,r*.32,'#FF8800'],[-r*.65,-r*.58,r*.15,r*.28,'#FFAA00']]) {
            ctx.fillStyle=fc; ctx.beginPath(); ctx.ellipse(fx,fy,fw,fh,0,0,Math.PI*2); ctx.fill();
        }

        const body=ctx.createRadialGradient(0,r*.1,0,0,0,r);
        body.addColorStop(0,'#FFD700'); body.addColorStop(.4,'#FF6600'); body.addColorStop(1,'#CC2200');
        ctx.fillStyle=body; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#881100'; ctx.lineWidth=2; ctx.stroke();

        const wing=ctx.createLinearGradient(-r*.9,0,0,r*.5);
        wing.addColorStop(0,'#FF3300'); wing.addColorStop(1,'#881100');
        ctx.fillStyle=wing; ctx.beginPath(); ctx.ellipse(-r*.33,r*.28,r*.56,r*.33,-.3,0,Math.PI*2); ctx.fill();

        ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(r*.39,-r*.28,r*.33,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#CC0000'; ctx.beginPath(); ctx.arc(r*.50,-r*.28,r*.17,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(r*.42,-r*.35,r*.08,0,Math.PI*2); ctx.fill();

        ctx.fillStyle='#661100'; ctx.beginPath();
        ctx.moveTo(r*.9,-r*.17); ctx.lineTo(r*1.5,0); ctx.lineTo(r*.9,r*.28);
        ctx.closePath(); ctx.fill();
    }

    // ── Skin 4: Gelo ──────────────────────────────────────────────────────────
    static _drawGelo(ctx, r) {
        const aura=ctx.createRadialGradient(0,0,r*.3,0,0,r*1.65);
        aura.addColorStop(0,'rgba(150,230,255,.45)'); aura.addColorStop(1,'rgba(100,200,255,0)');
        ctx.fillStyle=aura; ctx.beginPath(); ctx.arc(0,0,r*1.65,0,Math.PI*2); ctx.fill();

        const body=ctx.createRadialGradient(-r*.2,-r*.2,0,0,0,r);
        body.addColorStop(0,'#E8F8FF'); body.addColorStop(.5,'#7EC8E3'); body.addColorStop(1,'#0077AA');
        ctx.fillStyle=body; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#005588'; ctx.lineWidth=2; ctx.stroke();

        // Cristais de gelo
        ctx.strokeStyle='rgba(255,255,255,.65)'; ctx.lineWidth=1.2;
        for (let a=0;a<6;a++){
            const ax=Math.cos(a*Math.PI/3)*r*.55, ay=Math.sin(a*Math.PI/3)*r*.55;
            ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(ax,ay); ctx.stroke();
        }
        ctx.fillStyle='rgba(255,255,255,.5)';
        for (let a=0;a<6;a++){
            const ax=Math.cos(a*Math.PI/3)*r*.55, ay=Math.sin(a*Math.PI/3)*r*.55;
            ctx.beginPath(); ctx.arc(ax,ay,r*.06,0,Math.PI*2); ctx.fill();
        }

        ctx.fillStyle='#A8E0F5'; ctx.beginPath(); ctx.ellipse(-r*.33,r*.28,r*.56,r*.33,-.3,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,.5)'; ctx.lineWidth=1; ctx.stroke();

        ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(r*.39,-r*.28,r*.33,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#004488'; ctx.beginPath(); ctx.arc(r*.50,-r*.28,r*.17,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(r*.42,-r*.35,r*.08,0,Math.PI*2); ctx.fill();

        ctx.fillStyle='#B8DFF0'; ctx.beginPath();
        ctx.moveTo(r*.9,-r*.17); ctx.lineTo(r*1.5,0); ctx.lineTo(r*.9,r*.28);
        ctx.closePath(); ctx.fill(); ctx.strokeStyle='#0077AA'; ctx.lineWidth=1; ctx.stroke();
    }

    // ── Skin 5: Floresta ──────────────────────────────────────────────────────
    static _drawFloresta(ctx, r) {
        const body=ctx.createRadialGradient(-r*.2,-r*.2,0,0,0,r);
        body.addColorStop(0,'#7CCC44'); body.addColorStop(.7,'#2E8B1A'); body.addColorStop(1,'#1A5A00');
        ctx.fillStyle=body; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#1A4A00'; ctx.lineWidth=2; ctx.stroke();

        // Folhas no topo
        ctx.fillStyle='#9DE84A';
        ctx.beginPath(); ctx.ellipse(-r*.12,-r*.82,r*.24,r*.12,-0.5,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(r*.18,-r*.85,r*.20,r*.10, 0.4,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(-r*.35,-r*.72,r*.18,r*.10,-0.9,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#5AB032'; ctx.lineWidth=0.8;
        ctx.beginPath(); ctx.moveTo(0,-r*.62); ctx.lineTo(-r*.12,-r*.82); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,-r*.62); ctx.lineTo(r*.18,-r*.85); ctx.stroke();

        ctx.fillStyle='#8B5E3C'; ctx.beginPath(); ctx.ellipse(-r*.33,r*.28,r*.56,r*.33,-.3,0,Math.PI*2); ctx.fill();

        ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(r*.39,-r*.28,r*.33,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#3B1A00'; ctx.beginPath(); ctx.arc(r*.50,-r*.28,r*.17,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(r*.42,-r*.35,r*.08,0,Math.PI*2); ctx.fill();

        // Bico tucano
        ctx.fillStyle='#FF8C00'; ctx.beginPath();
        ctx.moveTo(r*.9,-r*.22); ctx.lineTo(r*1.7,0); ctx.lineTo(r*.9,r*.30);
        ctx.closePath(); ctx.fill(); ctx.strokeStyle='#CC5500'; ctx.lineWidth=1.5; ctx.stroke();
    }

    // ── Skin 6: Fantasma ──────────────────────────────────────────────────────
    static _drawFantasma(ctx, r) {
        const aura=ctx.createRadialGradient(0,0,0,0,0,r*1.6);
        aura.addColorStop(0,'rgba(220,230,255,.75)'); aura.addColorStop(1,'rgba(180,200,255,0)');
        ctx.fillStyle=aura; ctx.beginPath(); ctx.arc(0,0,r*1.6,0,Math.PI*2); ctx.fill();

        ctx.fillStyle='rgba(235,240,255,.82)'; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='rgba(160,175,230,.6)'; ctx.lineWidth=2; ctx.stroke();

        // Ondulações fantasmagóricas na base
        ctx.fillStyle='rgba(220,230,255,.9)'; ctx.beginPath();
        ctx.arc(0,r*.8,r*.3,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(200,215,255,.8)'; ctx.beginPath();
        ctx.arc(-r*.45,r*.7,r*.22,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(r*.45,r*.7,r*.22,0,Math.PI*2); ctx.fill();

        ctx.fillStyle='rgba(210,220,255,.6)'; ctx.beginPath(); ctx.ellipse(-r*.33,r*.28,r*.56,r*.33,-.3,0,Math.PI*2); ctx.fill();

        // Olho roxo assustador
        const eg=ctx.createRadialGradient(r*.35,-r*.28,0,r*.35,-r*.28,r*.5);
        eg.addColorStop(0,'rgba(180,0,255,.8)'); eg.addColorStop(1,'rgba(180,0,255,0)');
        ctx.fillStyle=eg; ctx.beginPath(); ctx.arc(r*.35,-r*.28,r*.5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#1A0030'; ctx.beginPath(); ctx.arc(r*.39,-r*.28,r*.3,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#BB00FF'; ctx.beginPath(); ctx.arc(r*.42,-r*.28,r*.14,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(r*.36,-r*.34,r*.07,0,Math.PI*2); ctx.fill();

        ctx.fillStyle='rgba(185,195,235,.7)'; ctx.beginPath();
        ctx.moveTo(r*.9,-r*.14); ctx.lineTo(r*1.4,0); ctx.lineTo(r*.9,r*.25);
        ctx.closePath(); ctx.fill();
    }

    // ── Skin 7: Robô ──────────────────────────────────────────────────────────
    static _drawRobo(ctx, r) {
        const body=ctx.createLinearGradient(-r,-r,r,r);
        body.addColorStop(0,'#C8C8D0'); body.addColorStop(.5,'#909098'); body.addColorStop(1,'#505060');
        ctx.fillStyle=body; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#303040'; ctx.lineWidth=2.5; ctx.stroke();

        // Parafusos
        ctx.fillStyle='#404050';
        for (const [bx,by] of [[-r*.55,-r*.55],[r*.3,-r*.7],[-r*.4,r*.6],[r*.55,r*.4]]){
            ctx.beginPath(); ctx.arc(bx,by,r*.08,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle='#606070'; ctx.lineWidth=.5;
            ctx.beginPath(); ctx.moveTo(bx-r*.06,by); ctx.lineTo(bx+r*.06,by); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(bx,by-r*.06); ctx.lineTo(bx,by+r*.06); ctx.stroke();
        }

        // Circuito
        ctx.strokeStyle='rgba(0,220,100,.3)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(-r*.3,r*.2); ctx.lineTo(-r*.3,r*.5); ctx.lineTo(r*.1,r*.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-r*.5,-r*.1); ctx.lineTo(-r*.1,-r*.1); ctx.stroke();

        // Asa mecânica
        const wing=ctx.createLinearGradient(-r*.8,0,0,r*.5);
        wing.addColorStop(0,'#707080'); wing.addColorStop(1,'#404050');
        ctx.fillStyle=wing; ctx.beginPath(); ctx.ellipse(-r*.33,r*.28,r*.56,r*.33,-.3,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#303040'; ctx.lineWidth=1; ctx.stroke();

        // Olho LED verde
        const led=ctx.createRadialGradient(r*.35,-r*.28,0,r*.35,-r*.28,r*.55);
        led.addColorStop(0,'rgba(0,255,80,.9)'); led.addColorStop(1,'rgba(0,255,80,0)');
        ctx.fillStyle=led; ctx.beginPath(); ctx.arc(r*.35,-r*.28,r*.55,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(r*.39,-r*.28,r*.3,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#00FF50'; ctx.beginPath(); ctx.arc(r*.50,-r*.28,r*.14,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(r*.42,-r*.35,r*.07,0,Math.PI*2); ctx.fill();

        // Antena
        ctx.strokeStyle='#909098'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(r*.1,-r*.9); ctx.lineTo(r*.1,-r*1.3); ctx.stroke();
        ctx.fillStyle='#00FF50'; ctx.beginPath(); ctx.arc(r*.1,-r*1.3,r*.07,0,Math.PI*2); ctx.fill();

        const beak=ctx.createLinearGradient(r*.9,0,r*1.5,0);
        beak.addColorStop(0,'#B0B0C0'); beak.addColorStop(1,'#707080');
        ctx.fillStyle=beak; ctx.beginPath();
        ctx.moveTo(r*.9,-r*.17); ctx.lineTo(r*1.5,0); ctx.lineTo(r*.9,r*.28);
        ctx.closePath(); ctx.fill(); ctx.strokeStyle='#505060'; ctx.lineWidth=1; ctx.stroke();
    }

    // ── Skin 8: Dragão ────────────────────────────────────────────────────────
    static _drawDragao(ctx, r) {
        const aura=ctx.createRadialGradient(0,0,r*.3,0,0,r*1.7);
        aura.addColorStop(0,'rgba(180,0,20,.35)'); aura.addColorStop(1,'rgba(180,0,20,0)');
        ctx.fillStyle=aura; ctx.beginPath(); ctx.arc(0,0,r*1.7,0,Math.PI*2); ctx.fill();

        const body=ctx.createRadialGradient(-r*.1,-r*.1,0,0,0,r);
        body.addColorStop(0,'#CC2200'); body.addColorStop(.6,'#880000'); body.addColorStop(1,'#330000');
        ctx.fillStyle=body; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#220000'; ctx.lineWidth=2; ctx.stroke();

        // Escamas
        ctx.strokeStyle='rgba(255,80,0,.3)'; ctx.lineWidth=1.2;
        for (let row=0;row<3;row++) for (let col=0;col<3;col++) {
            ctx.beginPath(); ctx.arc(-r*.4+col*r*.35,-r*.25+row*r*.28,r*.2,Math.PI,0); ctx.stroke();
        }

        // Cornos
        ctx.fillStyle='#441100';
        ctx.beginPath(); ctx.moveTo(-r*.2,-r*.85); ctx.lineTo(-r*.1,-r*1.28); ctx.lineTo(r*.02,-r*.85); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(r*.1,-r*.85); ctx.lineTo(r*.22,-r*1.22); ctx.lineTo(r*.35,-r*.85); ctx.closePath(); ctx.fill();

        const wing=ctx.createLinearGradient(-r*.9,0,0,r*.5);
        wing.addColorStop(0,'#660000'); wing.addColorStop(1,'#220000');
        ctx.fillStyle=wing; ctx.beginPath(); ctx.ellipse(-r*.33,r*.28,r*.62,r*.38,-.3,0,Math.PI*2); ctx.fill();

        // Olho com pupila vertical
        ctx.fillStyle='#FFEE00'; ctx.beginPath(); ctx.arc(r*.39,-r*.28,r*.33,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(r*.50,-r*.28,r*.07,r*.20,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(255,255,150,.8)'; ctx.beginPath(); ctx.arc(r*.42,-r*.36,r*.07,0,Math.PI*2); ctx.fill();

        ctx.fillStyle='#881100'; ctx.beginPath();
        ctx.moveTo(r*.9,-r*.22); ctx.lineTo(r*1.55,0); ctx.lineTo(r*.9,r*.32);
        ctx.closePath(); ctx.fill();
        // Dente
        ctx.fillStyle='#fff'; ctx.beginPath();
        ctx.moveTo(r*1.0,-r*.08); ctx.lineTo(r*1.14,-r*.15); ctx.lineTo(r*1.1,-r*.04); ctx.closePath(); ctx.fill();
    }

    // ── Skin 9: Lendário (animado) ────────────────────────────────────────────
    static _drawLendario(ctx, r) {
        const t = Date.now() * 0.001;

        // Halos orbitando
        for (let i=0;i<6;i++){
            const a = i/6*Math.PI*2+t;
            ctx.fillStyle=`hsla(${i/6*360},100%,60%,.18)`;
            ctx.beginPath(); ctx.arc(Math.cos(a)*r*1.35,Math.sin(a)*r*1.35,r*.45,0,Math.PI*2); ctx.fill();
        }

        // Corpo arco-íris animado
        const h0=(t*60)%360;
        const rb=ctx.createLinearGradient(-r,-r,r,r);
        rb.addColorStop(0,  `hsl(${h0},100%,55%)`);
        rb.addColorStop(.25,`hsl(${(h0+90)%360},100%,55%)`);
        rb.addColorStop(.5, `hsl(${(h0+180)%360},100%,55%)`);
        rb.addColorStop(.75,`hsl(${(h0+270)%360},100%,55%)`);
        rb.addColorStop(1,  `hsl(${h0},100%,55%)`);
        ctx.fillStyle=rb; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle=`hsl(${h0},100%,28%)`; ctx.lineWidth=2.5; ctx.stroke();

        // Coroa dourada
        ctx.fillStyle='#FFD700'; ctx.beginPath();
        ctx.moveTo(-r*.42,-r*.85); ctx.lineTo(-r*.42,-r*1.12); ctx.lineTo(-r*.2,-r*.97);
        ctx.lineTo(0,-r*1.24); ctx.lineTo(r*.2,-r*.97);
        ctx.lineTo(r*.42,-r*1.12); ctx.lineTo(r*.42,-r*.85);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle='#AA6600'; ctx.lineWidth=1.5; ctx.stroke();
        // Pedras preciosas
        for (const [gx,gy,gc] of [[0,-r*1.14,'#FF3366'],[-r*.3,-r*1.0,'#3388FF'],[r*.3,-r*1.0,'#33FF88']]){
            ctx.fillStyle=gc; ctx.beginPath(); ctx.arc(gx,gy,r*.075,0,Math.PI*2); ctx.fill();
        }

        // Asa arco-íris
        const wr=ctx.createLinearGradient(-r*.9,0,0,r*.6);
        wr.addColorStop(0,`hsl(${(h0+120)%360},100%,55%)`);
        wr.addColorStop(1,`hsl(${(h0+240)%360},100%,45%)`);
        ctx.fillStyle=wr; ctx.beginPath(); ctx.ellipse(-r*.33,r*.28,r*.6,r*.38,-.3,0,Math.PI*2); ctx.fill();

        // Estrelas cintilantes
        for (let i=0;i<5;i++){
            const px=[-r*.62,r*.45,-r*.22,r*.65,-r*.72][i];
            const py=[r*.32,r*.52,r*.72,-r*.14,r*.15][i];
            const pulse=Math.sin(t*3+i)*.5+.5;
            ctx.fillStyle=`rgba(255,255,255,${pulse})`;
            const sr=r*.09*(0.5+pulse*.5);
            ctx.save(); ctx.translate(px,py); ctx.rotate(t*2+i);
            ctx.beginPath();
            for(let p=0;p<4;p++){const a=p/4*Math.PI*2,a2=a+Math.PI/4;ctx.lineTo(Math.cos(a)*sr*2,Math.sin(a)*sr*2);ctx.lineTo(Math.cos(a2)*sr*.6,Math.sin(a2)*sr*.6);}
            ctx.closePath(); ctx.fill(); ctx.restore();
        }

        // Olho com estrela giratória
        ctx.fillStyle='#FFD700'; ctx.beginPath(); ctx.arc(r*.39,-r*.28,r*.35,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(r*.50,-r*.28,r*.15,0,Math.PI*2); ctx.fill();
        ctx.save(); ctx.translate(r*.50,-r*.28); ctx.rotate(t);
        ctx.fillStyle='#FFD700'; ctx.beginPath();
        for(let p=0;p<5;p++){const a=p/5*Math.PI*2-Math.PI/2,a2=a+Math.PI/5;ctx.lineTo(Math.cos(a)*r*.14,Math.sin(a)*r*.14);ctx.lineTo(Math.cos(a2)*r*.07,Math.sin(a2)*r*.07);}
        ctx.closePath(); ctx.fill(); ctx.restore();

        ctx.fillStyle='#FFD700'; ctx.beginPath();
        ctx.moveTo(r*.9,-r*.17); ctx.lineTo(r*1.5,0); ctx.lineTo(r*.9,r*.28);
        ctx.closePath(); ctx.fill(); ctx.strokeStyle='#CC8800'; ctx.lineWidth=1.5; ctx.stroke();
    }
}
