import React, { useEffect, useRef } from 'react';

/**
 * 3D Interactive AICTE Sovereign Cogwheel & Dynamic Chronometer Engine
 * + Real Verlet Physics Silk Cloth
 * 
 * Fresh Next-Gen Capabilities:
 * 1. Fixed Centered Viewport Background: Stays fixed and visible as you scroll down
 *    the entire portal, gleaming through frosted translucent glass panels & tables.
 * 2. Inertial Rotational Momentum: User can FLING and SPIN the cogwheel with mouse drags.
 * 3. Dynamic Cursor-Tracking Specular Light: Highlights sweep across 3D gold facets with the cursor.
 * 4. Dual Astrolabe Chronometer Ring: Counter-rotating calibration ring with 64 precision ticks.
 * 5. Living Sacred Diya / Flame: Central flame organically breathes and sways in 3D perspective.
 * 6. Cross-Bureau Radar Scanning Waves: 3D holographic pulse rings expanding outward across space.
 * 7. Orbiting Constellation with Magnetic Mouse Resonance.
 */
export default function InteractiveCanvas({ theme = 'purple-white' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const setupDimensions = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    setupDimensions();

    // ========================================================
    // 1. REAL VERLET PHYSICS SILK CLOTH SIMULATION
    // ========================================================
    const clothCols = Math.min(48, Math.floor(width / 28));
    const clothRows = 26;
    const spacingX = width / (clothCols - 1);
    const spacingY = (height * 0.96) / (clothRows - 1);

    const points = [];
    const constraints = [];

    for (let y = 0; y < clothRows; y++) {
      for (let x = 0; x < clothCols; x++) {
        const posX = x * spacingX;
        const posY = y * spacingY;
        const isPinned = y === 0 && (x % 3 === 0 || x === 0 || x === clothCols - 1);

        points.push({
          x: posX,
          y: posY,
          px: posX,
          py: posY,
          pinned: isPinned,
          baseX: posX,
          baseY: posY
        });
      }
    }

    for (let y = 0; y < clothRows; y++) {
      for (let x = 0; x < clothCols; x++) {
        const idx = y * clothCols + x;

        if (x < clothCols - 1) {
          constraints.push({
            p1: idx,
            p2: idx + 1,
            length: spacingX
          });
        }

        if (y < clothRows - 1) {
          constraints.push({
            p1: idx,
            p2: idx + clothCols,
            length: spacingY
          });
        }
      }
    }

    // ========================================================
    // 2. ORBITING PARTICLES & SCANNING RADAR WAVES
    // ========================================================
    const numParticles = 150;
    const particles = [];
    for (let i = 0; i < numParticles; i++) {
      const radius = 130 + Math.random() * 140;
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.15 + Math.random() * 0.35) * (Math.random() > 0.45 ? 1 : -1);
      const z = (Math.random() - 0.5) * 180;
      const isGold = Math.random() > 0.32;
      particles.push({ radius, angle, speed, z, isGold, size: Math.random() * 2.0 + 0.8 });
    }

    // Radar Scanning Wave Rings (Expanding 3D pulses)
    const scanWaves = [
      { radius: 190, maxRadius: 480, alpha: 0.6, speed: 1.2 },
      { radius: 290, maxRadius: 480, alpha: 0.4, speed: 1.2 },
      { radius: 390, maxRadius: 480, alpha: 0.2, speed: 1.2 }
    ];

    // Mouse Tracking & Inertial Fling Physics
    const mouse = {
      x: width * 0.5,
      y: height * 0.5,
      px: width * 0.5,
      py: height * 0.5,
      vx: 0,
      vy: 0,
      radius: 110,
      isDown: false
    };

    let gearSpin = 0;
    let gearVelocity = 0.007; // Base majestic cruise rotation
    let smoothRotX = 0;
    let smoothRotY = 0;
    let currentCenterX = width * 0.5;
    let currentCenterY = 335;

    const handleResize = () => {
      setupDimensions();
    };

    const handleMouseMove = (e) => {
      mouse.px = mouse.x;
      mouse.py = mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.vx = (mouse.x - mouse.px);
      mouse.vy = (mouse.y - mouse.py);

      // If user drags, impart spin momentum to the gear!
      if (mouse.isDown) {
        gearVelocity += (mouse.vx * 0.0004);
      }
    };

    const handleMouseDown = () => {
      mouse.isDown = true;
    };

    const handleMouseUp = () => {
      mouse.isDown = false;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    let time = 0;

    // 3D Perspective Projection Function
    const project3D = (x, y, z, rotX, rotY, cx, cy, fov = 520) => {
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      // Rotate around Y
      const x1 = x * cosY - z * sinY;
      const z1 = z * cosY + x * sinY;

      // Rotate around X
      const y2 = y * cosX - z1 * sinX;
      const z2 = z1 * cosX + y * sinX;

      const scale = fov / (fov + z2 + 250);
      return {
        px: cx + x1 * scale,
        py: cy + y2 * scale,
        x1,
        y2,
        z2,
        scale
      };
    };

    // ========================================================
    // RENDER LOOP
    // ========================================================
    const render = () => {
      time += 0.016;

      // Damping mouse velocity
      mouse.vx *= 0.88;
      mouse.vy *= 0.88;

      // Inertial rotational physics (glide back to cruise speed 0.007)
      gearVelocity = gearVelocity * 0.96 + 0.007 * 0.04;
      gearSpin += gearVelocity;

      const breeze = Math.sin(time * 1.2) * 0.15;

      // 1. UPDATE VERLET SILK CLOTH PARTICLES
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (p.pinned) continue;

        const vx = (p.x - p.px) * 0.94;
        const vy = (p.y - p.py) * 0.94;

        p.px = p.x;
        p.py = p.y;

        p.x += vx + breeze;
        p.y += vy + 0.08;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius && dist > 0) {
          const force = (1 - dist / mouse.radius) * (mouse.isDown ? 20 : 10);
          const angle = Math.atan2(dy, dx);
          p.x += Math.cos(angle) * force + mouse.vx * 0.4;
          p.y += Math.sin(angle) * force + mouse.vy * 0.4;
        }

        p.x += (p.baseX - p.x) * 0.003;
        p.y += (p.baseY - p.y) * 0.003;
      }

      // Relax constraints
      for (let iter = 0; iter < 3; iter++) {
        for (let i = 0; i < constraints.length; i++) {
          const c = constraints[i];
          const p1 = points[c.p1];
          const p2 = points[c.p2];

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) continue;

          const diff = (dist - c.length) / dist;
          const offsetX = dx * 0.5 * diff;
          const offsetY = dy * 0.5 * diff;

          if (!p1.pinned) {
            p1.x += offsetX;
            p1.y += offsetY;
          }
          if (!p2.pinned) {
            p2.x -= offsetX;
            p2.y -= offsetY;
          }
        }
      }

      // 2. DRAW LUXURY WHITE & ROYAL PURPLE or MIDNIGHT NAVY BACKGROUND
      if (theme === 'purple-white') {
        const bgGrad = ctx.createRadialGradient(
          width * 0.5, height * 0.35, 60,
          width * 0.5, height * 0.5, Math.max(width, height) * 0.90
        );
        bgGrad.addColorStop(0, '#ffffff');        // Pure radiant pearl white
        bgGrad.addColorStop(0.35, '#faf5ff');     // Soft lilac/lavender glow
        bgGrad.addColorStop(0.70, '#f3e8ff');     // Luminous royal purple tint
        bgGrad.addColorStop(1, '#ede9fe');        // Ethereal royal amethyst border
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Render Cloth as woven purple silk mesh
        ctx.save();
        for (let y = 0; y < clothRows - 1; y++) {
          for (let x = 0; x < clothCols - 1; x++) {
            const idx = y * clothCols + x;
            const p1 = points[idx];
            const p2 = points[idx + 1];
            const p3 = points[idx + clothCols + 1];
            const p4 = points[idx + clothCols];

            const foldDepth = Math.sin((p1.x - p1.baseX) * 0.08 + (p1.y - p1.baseY) * 0.08);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.closePath();

            const lightness = 0.045 + Math.max(0, foldDepth * 0.05);
            ctx.fillStyle = `rgba(168, 85, 247, ${lightness})`;
            ctx.fill();

            ctx.strokeStyle = `rgba(147, 51, 234, ${0.08 + foldDepth * 0.06})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
        ctx.restore();
      } else {
        const bgGrad = ctx.createRadialGradient(
          width * 0.5, height * 0.38, 60,
          width * 0.5, height * 0.5, Math.max(width, height) * 0.88
        );
        bgGrad.addColorStop(0, '#0e1830'); // Luminous deep midnight sapphire
        bgGrad.addColorStop(0.45, '#0a1124'); // Sovereign Prussian blue
        bgGrad.addColorStop(1, '#060a16'); // Deep obsidian royal navy
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Render Cloth as woven luxury silk mesh
        ctx.save();
        for (let y = 0; y < clothRows - 1; y++) {
          for (let x = 0; x < clothCols - 1; x++) {
            const idx = y * clothCols + x;
            const p1 = points[idx];
            const p2 = points[idx + 1];
            const p3 = points[idx + clothCols + 1];
            const p4 = points[idx + clothCols];

            const foldDepth = Math.sin((p1.x - p1.baseX) * 0.08 + (p1.y - p1.baseY) * 0.08);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.closePath();

            const lightness = 0.026 + Math.max(0, foldDepth * 0.04);
            ctx.fillStyle = `rgba(215, 228, 255, ${lightness})`;
            ctx.fill();

            ctx.strokeStyle = `rgba(180, 205, 255, ${0.035 + foldDepth * 0.035})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // ========================================================
      // 3. FIXED VIEWPORT 3D AICTE SOVEREIGN COGWHEEL & CHRONOMETER
      // Always centered in viewport: visible even as user scrolls down!
      // ========================================================
      ctx.save();

      // Exclusive Hero Aperture Position (Fixed resting viewport position)
      const anchor = document.getElementById('aicte-hero-anchor');
      let targetCX = width * 0.5;
      let targetCY = Math.min(height * 0.38, 280);

      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        targetCX = rect.left + rect.width * 0.5;
        targetCY = rect.top + rect.height * 0.5;
      }

      currentCenterX += (targetCX - currentCenterX) * 0.12;
      currentCenterY += (targetCY - currentCenterY) * 0.12;

      const centerX = currentCenterX;
      const centerY = currentCenterY;

      // Responsive emblem sizing (Enlarged prominent sovereign scale)
      const emblemScale = Math.min(0.92, Math.max(0.72, width / 1280));
      const NUM_TEETH = 16;
      const R_ROOT = 175 * emblemScale;
      const R_TIP = 230 * emblemScale;
      const Z_THICK = 15 * emblemScale;

      // 3D Parallax & Smooth Responsive Tilt
      const targetRotY = (mouse.x - width * 0.5) * 0.00075 + Math.sin(time * 0.35) * 0.07;
      const targetRotX = (mouse.y - height * 0.5) * 0.00055 + Math.cos(time * 0.3) * 0.05;

      smoothRotY += (targetRotY - smoothRotY) * 0.08;
      smoothRotX += (targetRotX - smoothRotX) * 0.08;

      const rotY = smoothRotY;
      const rotX = smoothRotX;

      // Dynamic Specular Light Source following cursor
      const lightDirX = (mouse.x - centerX) / (width * 0.5);
      const lightDirY = (mouse.y - centerY) / (height * 0.5);

      // Sovereign Golden & Purple Aura
      const auraGradient = ctx.createRadialGradient(
        centerX, centerY, 65 * emblemScale,
        centerX, centerY, 340 * emblemScale
      );
      if (theme === 'purple-white') {
        auraGradient.addColorStop(0, 'rgba(245, 158, 11, 0.28)');
        auraGradient.addColorStop(0.40, 'rgba(168, 85, 247, 0.22)');
        auraGradient.addColorStop(0.75, 'rgba(124, 58, 237, 0.08)');
        auraGradient.addColorStop(1, 'rgba(250, 245, 255, 0)');
      } else {
        auraGradient.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
        auraGradient.addColorStop(0.45, 'rgba(217, 119, 6, 0.07)');
        auraGradient.addColorStop(0.75, 'rgba(47, 91, 255, 0.03)');
        auraGradient.addColorStop(1, 'rgba(10, 11, 14, 0)');
      }
      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 340 * emblemScale, 0, Math.PI * 2);
      ctx.fill();

      // --------------------------------------------------------
      // 3A. 3D RADAR SCANNING WAVES (Cross-Bureau Overlap Scan)
      // --------------------------------------------------------
      scanWaves.forEach((wave) => {
        wave.radius += wave.speed * emblemScale;
        if (wave.radius > wave.maxRadius * emblemScale) {
          wave.radius = R_ROOT;
        }

        const progress = (wave.radius - R_ROOT) / ((wave.maxRadius - 180) * emblemScale);
        const curAlpha = Math.max(0, (1 - progress) * 0.28);

        // Project circular wave in 3D perspective
        ctx.beginPath();
        const waveSegs = 36;
        for (let s = 0; s <= waveSegs; s++) {
          const ang = (s * Math.PI * 2) / waveSegs;
          const p = project3D(
            wave.radius * Math.cos(ang),
            wave.radius * Math.sin(ang),
            -5,
            rotX,
            rotY,
            centerX,
            centerY
          );
          if (s === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(245, 158, 11, ${curAlpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Delicate outer secondary harmonic wave
        ctx.strokeStyle = theme === 'purple-white'
          ? `rgba(147, 51, 234, ${curAlpha * 0.85})`
          : `rgba(47, 91, 255, ${curAlpha * 0.6})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      });

      // --------------------------------------------------------
      // 3B. 3D ORBITING CONSTELLATION PARTICLES (With Mouse Pull)
      // --------------------------------------------------------
      particles.forEach((part) => {
        const curAngle = part.angle + time * part.speed * 0.4;
        let lx = part.radius * emblemScale * Math.cos(curAngle);
        let ly = part.radius * emblemScale * Math.sin(curAngle);

        // Subtle harmonic magnetic attraction to cursor
        const distToMouse = Math.hypot((centerX + lx) - mouse.x, (centerY + ly) - mouse.y);
        if (distToMouse < 180 && distToMouse > 0) {
          const pull = (1 - distToMouse / 180) * 16;
          lx += ((mouse.x - centerX) - lx) * 0.08 * (pull / 16);
          ly += ((mouse.y - centerY) - ly) * 0.08 * (pull / 16);
        }

        const pt = project3D(lx, ly, part.z * emblemScale, rotX, rotY, centerX, centerY);

        const alpha = Math.max(0.12, Math.min(0.85, 0.4 + (pt.z2 / 200) * 0.3));
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, part.size * pt.scale, 0, Math.PI * 2);
        if (part.isGold) {
          ctx.fillStyle = `rgba(245, 158, 11, ${alpha})`;
        } else {
          ctx.fillStyle = theme === 'purple-white'
            ? `rgba(168, 85, 247, ${alpha * 0.95})`
            : `rgba(59, 130, 246, ${alpha * 0.85})`;
        }
        ctx.fill();
      });

      // --------------------------------------------------------
      // 3C. 16 3D EXTRUDED GEAR TEETH (With Dynamic Specular Shading)
      // --------------------------------------------------------
      const toothStep = (Math.PI * 2) / NUM_TEETH;
      const halfRoot = toothStep * 0.28;
      const halfTip = toothStep * 0.20;

      const toothPolygons = [];

      for (let i = 0; i < NUM_TEETH; i++) {
        const baseAngle = i * toothStep + gearSpin;

        const aRl = baseAngle - halfRoot;
        const aTl = baseAngle - halfTip;
        const aTr = baseAngle + halfTip;
        const aRr = baseAngle + halfRoot;

        // Front Face Vertices (z = +Z_THICK)
        const pFrl = project3D(R_ROOT * Math.cos(aRl), R_ROOT * Math.sin(aRl), Z_THICK, rotX, rotY, centerX, centerY);
        const pFtl = project3D(R_TIP * Math.cos(aTl), R_TIP * Math.sin(aTl), Z_THICK, rotX, rotY, centerX, centerY);
        const pFtr = project3D(R_TIP * Math.cos(aTr), R_TIP * Math.sin(aTr), Z_THICK, rotX, rotY, centerX, centerY);
        const pFrr = project3D(R_ROOT * Math.cos(aRr), R_ROOT * Math.sin(aRr), Z_THICK, rotX, rotY, centerX, centerY);

        // Back Face Vertices (z = -Z_THICK)
        const pBrl = project3D(R_ROOT * Math.cos(aRl), R_ROOT * Math.sin(aRl), -Z_THICK, rotX, rotY, centerX, centerY);
        const pBtl = project3D(R_TIP * Math.cos(aTl), R_TIP * Math.sin(aTl), -Z_THICK, rotX, rotY, centerX, centerY);
        const pBtr = project3D(R_TIP * Math.cos(aTr), R_TIP * Math.sin(aTr), -Z_THICK, rotX, rotY, centerX, centerY);
        const pBrr = project3D(R_ROOT * Math.cos(aRr), R_ROOT * Math.sin(aRr), -Z_THICK, rotX, rotY, centerX, centerY);

        // Tooth direction vector for dynamic specular lighting
        const toothDirX = Math.cos(baseAngle);
        const toothDirY = Math.sin(baseAngle);
        const lightDot = Math.max(0, toothDirX * lightDirX + toothDirY * lightDirY);

        // Front tooth face
        toothPolygons.push({
          type: 'front',
          points: [pFrl, pFtl, pFtr, pFrr],
          avgZ: (pFrl.z2 + pFtl.z2 + pFtr.z2 + pFrr.z2) * 0.25,
          light: lightDot
        });

        // Tip side face
        toothPolygons.push({
          type: 'tip',
          points: [pFtl, pFtr, pBtr, pBtl],
          avgZ: (pFtl.z2 + pFtr.z2 + pBtr.z2 + pBtl.z2) * 0.25,
          light: lightDot
        });

        // Left side flank
        toothPolygons.push({
          type: 'left',
          points: [pFrl, pFtl, pBtl, pBrl],
          avgZ: (pFrl.z2 + pFtl.z2 + pBtl.z2 + pBrl.z2) * 0.25,
          light: lightDot
        });

        // Right side flank
        toothPolygons.push({
          type: 'right',
          points: [pFrr, pFtr, pBtr, pBrr],
          avgZ: (pFrr.z2 + pFtr.z2 + pBtr.z2 + pBrr.z2) * 0.25,
          light: lightDot
        });
      }

      // Sort tooth facets back-to-front (Painter's algorithm)
      toothPolygons.sort((a, b) => b.avgZ - a.avgZ);

      // Render tooth facets
      toothPolygons.forEach((poly) => {
        ctx.beginPath();
        ctx.moveTo(poly.points[0].px, poly.points[0].py);
        for (let k = 1; k < poly.points.length; k++) {
          ctx.lineTo(poly.points[k].px, poly.points[k].py);
        }
        ctx.closePath();

        const zNorm = Math.max(0.35, Math.min(1.0, 0.72 + poly.avgZ * 0.002));
        const specGleam = poly.light * 0.25;

        if (poly.type === 'front') {
          ctx.fillStyle = `rgba(${Math.round(245 + specGleam * 10)}, ${Math.round(158 + specGleam * 40)}, 11, ${0.9 * zNorm})`;
          ctx.strokeStyle = specGleam > 0.15 ? '#fef08a' : '#fbbf24';
          ctx.lineWidth = 1.2;
        } else if (poly.type === 'tip') {
          ctx.fillStyle = `rgba(${Math.round(217 + specGleam * 25)}, ${Math.round(119 + specGleam * 30)}, 6, ${0.92 * zNorm})`;
          ctx.strokeStyle = '#92400e';
          ctx.lineWidth = 0.8;
        } else {
          ctx.fillStyle = `rgba(180, 83, 9, ${0.82 * zNorm})`;
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 0.8;
        }
        ctx.fill();
        ctx.stroke();
      });

      // --------------------------------------------------------
      // 3D. DUAL ASTROLABE CALIBRATION RING (Counter-Rotating Ticks)
      // High-precision horology aesthetic: 64 calibration indices
      // --------------------------------------------------------
      const numTicks = 64;
      const rTickOuter = R_ROOT - 2 * emblemScale;
      const rTickInnerMajor = R_ROOT - 13 * emblemScale;
      const rTickInnerMinor = R_ROOT - 7 * emblemScale;
      const counterSpin = -gearSpin * 0.5; // Precision counter-rotation

      ctx.save();
      for (let t = 0; t < numTicks; t++) {
        const ang = (t * Math.PI * 2) / numTicks + counterSpin;
        const isMajor = t % 4 === 0;
        const rIn = isMajor ? rTickInnerMajor : rTickInnerMinor;

        const p1 = project3D(rTickOuter * Math.cos(ang), rTickOuter * Math.sin(ang), Z_THICK - 1, rotX, rotY, centerX, centerY);
        const p2 = project3D(rIn * Math.cos(ang), rIn * Math.sin(ang), Z_THICK - 1, rotX, rotY, centerX, centerY);

        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.strokeStyle = isMajor ? 'rgba(254, 240, 138, 0.75)' : 'rgba(180, 83, 9, 0.45)';
        ctx.lineWidth = isMajor ? 1.4 : 0.8;
        ctx.stroke();
      }
      ctx.restore();

      // --------------------------------------------------------
      // 3E. RENDER 3D GOLDEN MEDALLION DISC (Front Plane)
      // --------------------------------------------------------
      const discSegments = 40;
      const discPoints = [];
      const zDisc = 7 * emblemScale;
      const rMedallion = R_ROOT - 15 * emblemScale;

      for (let s = 0; s < discSegments; s++) {
        const ang = (s * Math.PI * 2) / discSegments;
        discPoints.push(project3D(rMedallion * Math.cos(ang), rMedallion * Math.sin(ang), zDisc, rotX, rotY, centerX, centerY));
      }

      ctx.beginPath();
      ctx.moveTo(discPoints[0].px, discPoints[0].py);
      for (let s = 1; s < discPoints.length; s++) {
        ctx.lineTo(discPoints[s].px, discPoints[s].py);
      }
      ctx.closePath();

      // Golden Sovereign Radial Gradient with Specular Cursor Glint
      const goldGrad = ctx.createRadialGradient(
        centerX + lightDirX * 45 * emblemScale,
        centerY + lightDirY * 45 * emblemScale,
        15,
        centerX,
        centerY,
        rMedallion
      );
      goldGrad.addColorStop(0, '#fef9c3'); // Bright sunburst specular glint
      goldGrad.addColorStop(0.25, '#fde047');
      goldGrad.addColorStop(0.55, '#f59e0b');
      goldGrad.addColorStop(0.88, '#d97706');
      goldGrad.addColorStop(1, '#92400e');
      ctx.fillStyle = goldGrad;
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // Inner Inscription Gold Rim
      ctx.beginPath();
      for (let s = 0; s < discSegments; s++) {
        const ang = (s * Math.PI * 2) / discSegments;
        const p = project3D((rMedallion - 22 * emblemScale) * Math.cos(ang), (rMedallion - 22 * emblemScale) * Math.sin(ang), zDisc + 2, rotX, rotY, centerX, centerY);
        if (s === 0) ctx.moveTo(p.px, p.py);
        else ctx.lineTo(p.px, p.py);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(120, 53, 15, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // --------------------------------------------------------
      // 3F. 3D CURVED PERIMETER INSCRIPTION:
      // "ALL INDIA COUNCIL FOR TECHNICAL EDUCATION"
      // --------------------------------------------------------
      const inscription = 'ALL INDIA COUNCIL FOR TECHNICAL EDUCATION';
      const startAngle = -Math.PI * 0.86;
      const endAngle = -Math.PI * 0.14;
      const charStep = (endAngle - startAngle) / (inscription.length - 1);
      const rText = rMedallion - 12 * emblemScale;

      ctx.save();
      ctx.font = `bold ${Math.round(11 * emblemScale)}px "Inter", -apple-system, sans-serif`;
      ctx.fillStyle = '#291807';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let c = 0; c < inscription.length; c++) {
        const char = inscription[c];
        const ang = startAngle + c * charStep;

        const xPos = rText * Math.cos(ang);
        const yPos = rText * Math.sin(ang);

        const pChar = project3D(xPos, yPos, zDisc + 4, rotX, rotY, centerX, centerY);
        const pNormal = project3D(
          (rText + 10) * Math.cos(ang),
          (rText + 10) * Math.sin(ang),
          zDisc + 4,
          rotX,
          rotY,
          centerX,
          centerY
        );

        const charAngle = Math.atan2(pNormal.py - pChar.py, pNormal.px - pChar.px) + Math.PI / 2;

        ctx.save();
        ctx.translate(pChar.px, pChar.py);
        ctx.rotate(charAngle);
        ctx.scale(pChar.scale, pChar.scale);
        ctx.fillText(char, 0, 0);
        ctx.restore();
      }
      ctx.restore();

      // --------------------------------------------------------
      // 3G. 3D CENTRAL BOLD "AICTE" TYPOGRAPHY (Extruded Crimson)
      // --------------------------------------------------------
      ctx.save();
      const pCenter = project3D(0, -22 * emblemScale, zDisc + 12, rotX, rotY, centerX, centerY);
      const pShadow = project3D(0, -21 * emblemScale, zDisc + 6, rotX, rotY, centerX, centerY);

      // Shadow / 3D extrusion layer
      ctx.save();
      ctx.translate(pShadow.px, pShadow.py);
      ctx.scale(pShadow.scale, pShadow.scale);
      ctx.font = `900 ${Math.round(44 * emblemScale)}px "Inter", "Impact", -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#450a0a';
      ctx.fillText('AICTE', 2.2, 3.2);
      ctx.restore();

      // Front Bold Crimson Lettering
      ctx.save();
      ctx.translate(pCenter.px, pCenter.py);
      ctx.scale(pCenter.scale, pCenter.scale);
      ctx.font = `900 ${Math.round(44 * emblemScale)}px "Inter", "Impact", -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 1.6;
      ctx.strokeText('AICTE', 0, 0);
      ctx.fillText('AICTE', 0, 0);
      ctx.restore();
      ctx.restore();

      // --------------------------------------------------------
      // 3H. SANSKRIT MOTTO: "योगः कर्मसु कौशलम्"
      // --------------------------------------------------------
      ctx.save();
      const pMotto = project3D(0, 16 * emblemScale, zDisc + 8, rotX, rotY, centerX, centerY);
      ctx.translate(pMotto.px, pMotto.py);
      ctx.scale(pMotto.scale, pMotto.scale);
      ctx.font = `bold ${Math.round(15 * emblemScale)}px "Inter", "Devanagari Sangam MN", "Noto Sans Devanagari", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#291807';
      ctx.fillText('योगः कर्मसु कौशलम्', 0, 0);
      ctx.restore();

      // --------------------------------------------------------
      // 3I. ROYAL SAPPHIRE BLUE CHAKRA & LIVING BREATHING DIYA
      // --------------------------------------------------------
      const rDiya = 45 * emblemScale;
      const diyaCenterY = 72 * emblemScale;
      const zDiya = zDisc + 9;

      const pDiyaCenter = project3D(0, diyaCenterY, zDiya, rotX, rotY, centerX, centerY);

      // Royal Blue Circular Chakra Medallion
      const diyaPoints = [];
      for (let s = 0; s < 28; s++) {
        const ang = (s * Math.PI * 2) / 28;
        diyaPoints.push(
          project3D(
            rDiya * Math.cos(ang),
            diyaCenterY + rDiya * Math.sin(ang),
            zDiya,
            rotX,
            rotY,
            centerX,
            centerY
          )
        );
      }

      ctx.beginPath();
      ctx.moveTo(diyaPoints[0].px, diyaPoints[0].py);
      for (let s = 1; s < diyaPoints.length; s++) {
        ctx.lineTo(diyaPoints[s].px, diyaPoints[s].py);
      }
      ctx.closePath();

      const blueGrad = ctx.createRadialGradient(
        pDiyaCenter.px, pDiyaCenter.py, 6,
        pDiyaCenter.px, pDiyaCenter.py, rDiya * pDiyaCenter.scale
      );
      blueGrad.addColorStop(0, '#3b82f6');
      blueGrad.addColorStop(0.65, '#1d4ed8');
      blueGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = blueGrad;
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Organic Living Flame Sway & Breathing Ember
      const flameSway = Math.sin(time * 3.5) * 1.8 * emblemScale;
      const flameBreathe = Math.sin(time * 2.2) * 1.5 * emblemScale;

      ctx.save();
      ctx.translate(pDiyaCenter.px, pDiyaCenter.py);
      ctx.scale(pDiyaCenter.scale, pDiyaCenter.scale);

      // Flame Halo Pulsing Glow
      const flameGlow = ctx.createRadialGradient(0, -3, 3, 0, -3, 30 * emblemScale);
      flameGlow.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
      flameGlow.addColorStop(0.5, 'rgba(239, 68, 68, 0.2)');
      flameGlow.addColorStop(1, 'rgba(30, 64, 175, 0)');
      ctx.fillStyle = flameGlow;
      ctx.beginPath();
      ctx.arc(0, -3, 30 * emblemScale, 0, Math.PI * 2);
      ctx.fill();

      // 1. Lamp Base Bowl (Crimson crescent)
      ctx.beginPath();
      ctx.ellipse(0, 16 * emblemScale, 21 * emblemScale, 10.5 * emblemScale, 0, 0, Math.PI);
      ctx.closePath();
      ctx.fillStyle = '#831843';
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // 2. Flanking Golden Flame Wings
      ctx.beginPath();
      ctx.ellipse(-10 * emblemScale, 6 * emblemScale, 7 * emblemScale, 14 * emblemScale, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(10 * emblemScale, 6 * emblemScale, 7 * emblemScale, 14 * emblemScale, Math.PI / 6, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();

      // 3. Central Sacred Ruby Flame Petal (with living sway)
      ctx.beginPath();
      ctx.moveTo(flameSway, -21 * emblemScale + flameBreathe);
      ctx.bezierCurveTo(10.5 * emblemScale, -10 * emblemScale, 11 * emblemScale, 10 * emblemScale, 0, 14 * emblemScale);
      ctx.bezierCurveTo(-11 * emblemScale, 10 * emblemScale, -10.5 * emblemScale, -10 * emblemScale, flameSway, -21 * emblemScale + flameBreathe);
      ctx.closePath();
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 4. Glowing Flame Core
      ctx.beginPath();
      ctx.ellipse(flameSway * 0.5, -3 + flameBreathe * 0.5, 4.5 * emblemScale, 8.5 * emblemScale, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fef08a';
      ctx.fill();

      ctx.restore();

      // --------------------------------------------------------
      // 3J. RADIAL CHAKRA SPOKES (Connecting Core to Rim)
      // --------------------------------------------------------
      for (let i = 0; i < NUM_TEETH; i++) {
        const ang = i * toothStep + gearSpin;
        const pSpokeStart = project3D(40 * emblemScale * Math.cos(ang), 40 * emblemScale * Math.sin(ang), zDisc + 1, rotX, rotY, centerX, centerY);
        const pSpokeEnd = project3D((R_ROOT - 20 * emblemScale) * Math.cos(ang), (R_ROOT - 20 * emblemScale) * Math.sin(ang), zDisc + 1, rotX, rotY, centerX, centerY);

        ctx.beginPath();
        ctx.moveTo(pSpokeStart.px, pSpokeStart.py);
        ctx.lineTo(pSpokeEnd.px, pSpokeEnd.py);
        ctx.strokeStyle = 'rgba(120, 53, 15, 0.22)';
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-auto z-0"
      style={{ cursor: 'grab' }}
      title="Interactive AICTE Sovereign Cogwheel & Silk Cloth — Swipe to fling/spin, move to tilt emblem"
    />
  );
}
