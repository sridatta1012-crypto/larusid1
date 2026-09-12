/**
 * ROMANTIC FLOATING PARTICLES & HEARTS
 * Lightweight 60fps canvas animation with shimmering hearts and sparkles
 */

const RomanticParticles = {
  canvas: null,
  ctx: null,
  particles: [],
  maxParticles: 36,
  animationId: null,
  enabled: true,
  mouse: { x: -100, y: -100 },

  init() {
    this.canvas = document.getElementById('particles-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    const storedSetting = Storage.getString(APP_CONFIG.STORAGE_KEYS.PARTICLES_ENABLED, 'true');
    this.enabled = storedSetting === 'true';

    this.resize();
    window.addEventListener('resize', () => this.resize());

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    if (this.enabled) {
      this.createParticles();
      this.animate();
    }
  },

  createHeart(x, y) {
    const width = this.canvas ? this.canvas.width : window.innerWidth;
    const height = this.canvas ? this.canvas.height : window.innerHeight;
    return {
      x: x !== undefined ? x : Math.random() * width,
      y: y !== undefined ? y : height + 20,
      size: Math.random() * 12 + 8,
      speedY: Math.random() * 1.2 + 0.6,
      speedX: (Math.random() - 0.5) * 1.5,
      swaySpeed: Math.random() * 0.03 + 0.01,
      swayOffset: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.5 + 0.4,
      type: 'heart',
      color: 'rgba(247, 168, 184, '
    };
  },

  burstHearts(count = 25) {
    if (!this.particles) this.particles = [];
    const width = this.canvas ? this.canvas.width : window.innerWidth;
    const height = this.canvas ? this.canvas.height : window.innerHeight;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: width / 2 + (Math.random() - 0.5) * 280,
        y: height / 2 + (Math.random() - 0.5) * 160,
        size: Math.random() * 14 + 10,
        speedY: Math.random() * 1.6 + 0.8,
        speedX: (Math.random() - 0.5) * 2.2,
        swaySpeed: Math.random() * 0.03 + 0.02,
        swayOffset: Math.random() * Math.PI * 2,
        opacity: 0.95,
        type: 'heart',
        color: 'rgba(247, 168, 184, '
      });
    }
  },

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.spawnParticle(true));
    }
  },

  spawnParticle(randomY = false) {
    const width = this.canvas ? this.canvas.width : window.innerWidth;
    const height = this.canvas ? this.canvas.height : window.innerHeight;
    const types = ['heart', 'sparkle', 'bokeh'];
    const type = types[Math.floor(Math.random() * types.length)];

    return {
      x: Math.random() * width,
      y: randomY ? Math.random() * height : height + 20,
      size: type === 'heart' ? Math.random() * 10 + 8 : Math.random() * 4 + 2,
      speedY: Math.random() * 0.6 + 0.3,
      speedX: (Math.random() - 0.5) * 0.4,
      swaySpeed: Math.random() * 0.02 + 0.01,
      swayOffset: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.5 + 0.25,
      type: type,
      color: Math.random() > 0.4 ? 'rgba(247, 168, 184, ' : 'rgba(244, 217, 166, '
    };
  },

  drawHeart(ctx, x, y, size, color, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.scale(size / 15, size / 15);
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-5, -7, -12, 0, 0, 10);
    ctx.bezierCurveTo(12, 0, 5, -7, 0, 0);
    ctx.fillStyle = `${color}${opacity})`;
    ctx.fill();
    ctx.restore();
  },

  drawSparkle(ctx, x, y, size, color, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fillStyle = `${color}${opacity})`;
    ctx.shadowColor = `${color}0.8)`;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  },

  animate() {
    if (!this.enabled || !this.ctx) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Update position
      p.swayOffset += p.swaySpeed;
      p.x += Math.sin(p.swayOffset) * 0.6 + p.speedX;
      p.y -= p.speedY;

      // Mouse repulsion subtle breeze
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 80) {
        p.x += (dx / dist) * 1.5;
        p.y += (dy / dist) * 1.5;
      }

      // Draw particle
      if (p.type === 'heart') {
        this.drawHeart(this.ctx, p.x, p.y, p.size, p.color, p.opacity);
      } else {
        this.drawSparkle(this.ctx, p.x, p.y, p.size, p.color, p.opacity);
      }

      // Recycle if off screen
      if (p.y < -30 || p.x < -30 || p.x > this.canvas.width + 30) {
        this.particles[i] = this.spawnParticle(false);
      }
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  },

  toggle() {
    this.enabled = !this.enabled;
    Storage.setString(APP_CONFIG.STORAGE_KEYS.PARTICLES_ENABLED, String(this.enabled));
    if (this.enabled) {
      this.createParticles();
      this.animate();
    } else {
      if (this.animationId) cancelAnimationFrame(this.animationId);
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
    return this.enabled;
  }
};
