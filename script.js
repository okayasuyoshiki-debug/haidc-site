// ===== Neural Network Canvas Animation =====
(function() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height, particles, mouse, animationId;

  mouse = { x: -1000, y: -1000 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = Math.random() * 3 + 1;
      this.baseAlpha = Math.random() * 0.5 + 0.4;
      this.alpha = this.baseAlpha;
      this.pulseSpeed = Math.random() * 0.02 + 0.005;
      this.pulseOffset = Math.random() * Math.PI * 2;
      // Color: mix of blue and purple tones
      const hue = 220 + Math.random() * 60; // 220-280 range (blue to purple)
      const sat = 80 + Math.random() * 20;
      const light = 65 + Math.random() * 20;
      this.color = `hsl(${hue}, ${sat}%, ${light}%)`;
      this.colorR = 0;
      this.colorG = 0;
      this.colorB = 0;
      // Parse HSL to approximate RGB for line drawing
      const c = (1 - Math.abs(2 * light / 100 - 1)) * sat / 100;
      const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
      const m = light / 100 - c / 2;
      if (hue < 240) {
        this.colorR = Math.round((0 + m) * 255);
        this.colorG = Math.round((x + m) * 255);
        this.colorB = Math.round((c + m) * 255);
      } else {
        this.colorR = Math.round((x + m) * 255);
        this.colorG = Math.round((0 + m) * 255);
        this.colorB = Math.round((c + m) * 255);
      }
    }
    update(time) {
      this.x += this.vx;
      this.y += this.vy;

      // Pulse
      this.alpha = this.baseAlpha + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.15;

      // Mouse interaction
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        const force = (200 - dist) / 200;
        this.alpha = Math.min(1, this.baseAlpha + force * 0.5);
        this.vx += (dx / dist) * force * 0.03;
        this.vy += (dy / dist) * force * 0.03;
      }

      // Damping
      this.vx *= 0.999;
      this.vy *= 0.999;

      // Wrap
      if (this.x < -20) this.x = width + 20;
      if (this.x > width + 20) this.x = -20;
      if (this.y < -20) this.y = height + 20;
      if (this.y > height + 20) this.y = -20;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha;
      ctx.fill();

      // Glow
      if (this.radius > 1) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(
          this.x, this.y, this.radius * 0.5,
          this.x, this.y, this.radius * 3
        );
        grad.addColorStop(0, this.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.globalAlpha = this.alpha * 0.5;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  // Data stream / flowing line class
  class DataStream {
    constructor() {
      this.reset();
    }
    reset() {
      this.startX = Math.random() * width;
      this.startY = Math.random() * height;
      this.angle = Math.random() * Math.PI * 2;
      this.speed = Math.random() * 1.5 + 0.5;
      this.length = Math.random() * 80 + 40;
      this.life = 0;
      this.maxLife = Math.random() * 200 + 100;
      this.alpha = 0;
      const hue = 220 + Math.random() * 60;
      this.color = `hsl(${hue}, 80%, 65%)`;
    }
    update() {
      this.life++;
      this.startX += Math.cos(this.angle) * this.speed;
      this.startY += Math.sin(this.angle) * this.speed;
      // Fade in/out
      if (this.life < 30) {
        this.alpha = this.life / 30;
      } else if (this.life > this.maxLife - 30) {
        this.alpha = (this.maxLife - this.life) / 30;
      } else {
        this.alpha = 1;
      }
      this.alpha *= 0.3;
      // Slight curve
      this.angle += (Math.random() - 0.5) * 0.02;
      if (this.life >= this.maxLife || this.startX < -100 || this.startX > width + 100 || this.startY < -100 || this.startY > height + 100) {
        this.reset();
      }
    }
    draw() {
      const endX = this.startX - Math.cos(this.angle) * this.length;
      const endY = this.startY - Math.sin(this.angle) * this.length;
      const grad = ctx.createLinearGradient(this.startX, this.startY, endX, endY);
      grad.addColorStop(0, this.color);
      grad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.moveTo(this.startX, this.startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = grad;
      ctx.globalAlpha = this.alpha;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // Hexagon grid background
  function drawHexGrid(time) {
    const size = 60;
    const h = size * Math.sqrt(3);
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = '#5577ff';
    ctx.lineWidth = 0.7;
    for (let row = -1; row < height / h + 1; row++) {
      for (let col = -1; col < width / (size * 1.5) + 1; col++) {
        const cx = col * size * 1.5;
        const cy = row * h + (col % 2 ? h / 2 : 0);
        const pulse = Math.sin(time * 0.001 + col * 0.3 + row * 0.3) * 0.02;
        ctx.globalAlpha = 0.06 + pulse;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i + Math.PI / 6;
          const px = cx + size * 0.4 * Math.cos(angle);
          const py = cy + size * 0.4 * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  let streams;
  function init() {
    resize();
    const count = Math.min(Math.floor((width * height) / 4000), 300);
    particles = Array.from({ length: count }, () => new Particle());
    streams = Array.from({ length: 25 }, () => new DataStream());
  }

  function drawConnections() {
    const maxDist = 160;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = dx * dx + dy * dy;
        if (dist < maxDist * maxDist) {
          const alpha = (1 - Math.sqrt(dist) / maxDist) * 0.25;
          const r = Math.round((particles[i].colorR + particles[j].colorR) / 2);
          const g = Math.round((particles[i].colorG + particles[j].colorG) / 2);
          const b = Math.round((particles[i].colorB + particles[j].colorB) / 2);
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate(time) {
    ctx.clearRect(0, 0, width, height);

    // Background hex grid
    drawHexGrid(time);

    // Data streams
    streams.forEach(s => { s.update(); s.draw(); });

    // Particle connections
    drawConnections();

    // Particles
    particles.forEach(p => { p.update(time); p.draw(); });

    animationId = requestAnimationFrame(animate);
  }

  // Mouse tracking
  canvas.parentElement.addEventListener('mousemove', (e) => {
    const rect = canvas.parentElement.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.parentElement.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  // Visibility API: pause when hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      animationId = requestAnimationFrame(animate);
    }
  });

  window.addEventListener('resize', () => {
    resize();
    particles.forEach(p => {
      if (p.x > width) p.x = Math.random() * width;
      if (p.y > height) p.y = Math.random() * height;
    });
  });

  init();
  animationId = requestAnimationFrame(animate);
})();

// ===== Navigation scroll effect =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
});

// ===== Mobile menu toggle =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('active');
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('active');
    navLinks.classList.remove('open');
  });
});

// ===== Intersection Observer for fade-in =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ===== Smooth scroll for nav links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
