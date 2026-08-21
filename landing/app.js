(function () {
      'use strict';

      const root = document.documentElement;
      const body = document.body;

      // ------------------------------------------------------------------------
      // 1. WEB AUDIO API SYNTHESIZER (Breeze Ambience, Car Beeps & Pixel Chime)
      // ------------------------------------------------------------------------
      let audioCtx = null;
      let isAudioActive = false;
      let breezeNode = null;
      let breezeGain = null;

      function getAudioContext() {
        if (!audioCtx) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            audioCtx = new AudioContextClass();
          }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        return audioCtx;
      }

      function startBreezeAmbience() {
        const ctx = getAudioContext();
        if (!ctx) return;

        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
          b6 = white * 0.115926;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, ctx.currentTime);

        breezeGain = ctx.createGain();
        breezeGain.gain.setValueAtTime(0.01, ctx.currentTime);
        breezeGain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 1.5);

        whiteNoise.connect(filter);
        filter.connect(breezeGain);
        breezeGain.connect(ctx.destination);

        whiteNoise.start(0);
        breezeNode = whiteNoise;
      }

      function stopBreezeAmbience() {
        if (breezeGain && audioCtx) {
          breezeGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
          setTimeout(() => {
            if (breezeNode) {
              breezeNode.stop();
              breezeNode.disconnect();
              breezeNode = null;
            }
          }, 600);
        }
      }

      // Friendly Retro Car Horn Synthesizer
      function playHornSound(pitch = 340) {
        if (!isAudioActive) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'triangle';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(pitch, ctx.currentTime);
        osc2.frequency.setValueAtTime(pitch * 1.25, ctx.currentTime);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.3);
        osc2.stop(ctx.currentTime + 0.3);
      }

      // Sweet 8-bit Pixel Letterbox Chime
      function playPixelMailChime() {
        if (!isAudioActive) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = ctx.currentTime + index * 0.08;

          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.08, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.25);
        });
      }

      // Audio Toggle Button UI
      const audioToggleBtn = document.getElementById('audioToggleBtn');
      const audioIcon = document.getElementById('audioIcon');

      audioToggleBtn.addEventListener('click', () => {
        isAudioActive = !isAudioActive;
        if (isAudioActive) {
          getAudioContext();
          startBreezeAmbience();
          audioIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          `;
          audioToggleBtn.style.color = '#38bdf8';
        } else {
          stopBreezeAmbience();
          audioIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
          `;
          audioToggleBtn.style.color = '#ffffff';
        }
      });

      // ------------------------------------------------------------------------
      // 2. ATMOSPHERE / THEMES CONTROLLER
      // ------------------------------------------------------------------------
      const themeButtons = document.querySelectorAll('.theme-opt-btn');
      const themesList = ['day', 'afternoon', 'sunset', 'dusk'];
      let themeIndex = 0;

      function applyTheme(themeName) {
        body.setAttribute('data-theme', themeName);
        themeButtons.forEach(b => {
          b.classList.toggle('is-active', b.dataset.themeVal === themeName);
        });
        themeIndex = themesList.indexOf(themeName);
      }

      themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          applyTheme(btn.dataset.themeVal);
        });
      });

      setInterval(() => {
        const nextTheme = themesList[(themeIndex + 1) % themesList.length];
        applyTheme(nextTheme);
      }, 90000);

      // Settings Sheet Toggle
      const settingsSheetBtn = document.getElementById('settingsSheetBtn');
      const controlSheet = document.getElementById('controlSheet');
      settingsSheetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        controlSheet.classList.toggle('is-expanded');
      });

      document.addEventListener('click', (e) => {
        if (!controlSheet.contains(e.target) && e.target !== settingsSheetBtn) {
          controlSheet.classList.remove('is-expanded');
        }
      });

      // ------------------------------------------------------------------------
      // 3. WIND PHYSICS SYSTEM
      // ------------------------------------------------------------------------
      const windRange = document.getElementById('windRange');
      let globalWindMultiplier = 1.0;

      function updateWindSway(val) {
        const factor = parseFloat(val) || 1.0;
        globalWindMultiplier = factor;
        
        const angle = (1.8 + (factor - 0.4) * 2.8).toFixed(2);
        const duration = (4.8 / Math.sqrt(factor + 0.3)).toFixed(2);

        root.style.setProperty('--wind-sway-deg', `${angle}deg`);
        root.style.setProperty('--wind-duration', `${duration}s`);
        root.style.setProperty('--wind-multiplier', factor);
      }

      windRange.addEventListener('input', (e) => {
        updateWindSway(e.target.value);
      });
      updateWindSway(windRange.value);

      // ------------------------------------------------------------------------
      // 4. REAL MINIATURE TRAFFIC SYSTEM ENGINE
      // - Upper Lane: Traffic moving LEFT (direction: -1, Ã¢â€ Â Ã¢â€ Â Ã¢â€ Â), Left-Facing Sprites
      // - Lower Lane: Traffic moving RIGHT (direction: +1, Ã¢â€ â€™ Ã¢â€ â€™ Ã¢â€ â€™), Right-Facing Sprites
      // - Single monolithic <img> sprite per vehicle
      // - Raycast distance-based collision avoidance & organic speeds
      // ------------------------------------------------------------------------
      const trafficRange = document.getElementById('trafficRange');
      let globalTrafficMultiplier = 1.0;

      trafficRange.addEventListener('input', (e) => {
        globalTrafficMultiplier = parseFloat(e.target.value) || 1.0;
      });

      class TrafficCar {
        constructor(config) {
          this.id = config.id;
          this.lane = config.lane; // 'upper' or 'lower'
          this.direction = config.direction; // -1 for left, +1 for right
          this.el = config.el;
          this.width = config.width || 160;
          this.baseSpeed = config.baseSpeed; // px/sec
          this.currentSpeed = config.baseSpeed;
          this.targetSpeed = config.baseSpeed;
          this.acceleration = config.acceleration || 45; // px/sec^2
          this.brakingRate = config.brakingRate || 135;  // px/sec^2
          this.minSafeGap = config.minSafeGap || 50;     // px buffer
          this.speedBuffer = config.speedBuffer || 0.45; // seconds
          this.x = config.initialX || 0;
          this.honkPitch = config.honkPitch || 350;
        }

        updatePosition(dt) {
          this.x += this.currentSpeed * this.direction * dt;
          if (this.el) {
            this.el.style.transform = `translate3d(${this.x.toFixed(1)}px, 0, 0)`;
          }
        }
      }

      // Upper Lane Cars: Traffic strictly moving LEFT (direction: -1, Ã¢â€ Â Ã¢â€ Â Ã¢â€ Â)
      const upperLaneCars = [
        new TrafficCar({ id: 'carU1', el: document.getElementById('carU1'), lane: 'upper', direction: -1, width: 160, baseSpeed: 112, acceleration: 48, brakingRate: 140, minSafeGap: 52, speedBuffer: 0.45, honkPitch: 380 }),
        new TrafficCar({ id: 'carU2', el: document.getElementById('carU2'), lane: 'upper', direction: -1, width: 160, baseSpeed: 88,  acceleration: 38, brakingRate: 120, minSafeGap: 58, speedBuffer: 0.50, honkPitch: 300 }),
        new TrafficCar({ id: 'carU3', el: document.getElementById('carU3'), lane: 'upper', direction: -1, width: 160, baseSpeed: 104, acceleration: 44, brakingRate: 130, minSafeGap: 50, speedBuffer: 0.42, honkPitch: 410 }),
        new TrafficCar({ id: 'carU4', el: document.getElementById('carU4'), lane: 'upper', direction: -1, width: 160, baseSpeed: 118, acceleration: 52, brakingRate: 150, minSafeGap: 48, speedBuffer: 0.40, honkPitch: 460 }),
        new TrafficCar({ id: 'carU5', el: document.getElementById('carU5'), lane: 'upper', direction: -1, width: 160, baseSpeed: 96,  acceleration: 42, brakingRate: 125, minSafeGap: 47, speedBuffer: 0.45, honkPitch: 350 })
      ];

      // Lower Lane Cars: Traffic strictly moving RIGHT (direction: +1, Ã¢â€ â€™ Ã¢â€ â€™ Ã¢â€ â€™)
      const lowerLaneCars = [
        new TrafficCar({ id: 'carL1', el: document.getElementById('carL1'), lane: 'lower', direction: 1, width: 160, baseSpeed: 98,  acceleration: 45, brakingRate: 130, minSafeGap: 50, speedBuffer: 0.45, honkPitch: 320 }),
        new TrafficCar({ id: 'carL2', el: document.getElementById('carL2'), lane: 'lower', direction: 1, width: 160, baseSpeed: 114, acceleration: 50, brakingRate: 145, minSafeGap: 52, speedBuffer: 0.42, honkPitch: 420 }),
        new TrafficCar({ id: 'carL3', el: document.getElementById('carL3'), lane: 'lower', direction: 1, width: 160, baseSpeed: 90,  acceleration: 38, brakingRate: 120, minSafeGap: 54, speedBuffer: 0.50, honkPitch: 290 }),
        new TrafficCar({ id: 'carL4', el: document.getElementById('carL4'), lane: 'lower', direction: 1, width: 160, baseSpeed: 106, acceleration: 46, brakingRate: 135, minSafeGap: 50, speedBuffer: 0.44, honkPitch: 360 }),
        new TrafficCar({ id: 'carL5', el: document.getElementById('carL5'), lane: 'lower', direction: 1, width: 160, baseSpeed: 120, acceleration: 54, brakingRate: 155, minSafeGap: 48, speedBuffer: 0.40, honkPitch: 450 })
      ];

      // Initial organic positioning along the road
      function initTrafficLanes() {
        const screenW = window.innerWidth || 1400;
        
        // Distribute Upper Lane (moving Left Ã¢â€ Â)
        const upperSpan = screenW + 900;
        const uStep = upperSpan / upperLaneCars.length;
        upperLaneCars.forEach((car, index) => {
          car.x = (index * uStep) - 200;
          car.currentSpeed = car.baseSpeed;
          if (car.el) car.el.style.transform = `translate3d(${car.x.toFixed(1)}px, 0, 0)`;
        });

        // Distribute Lower Lane (moving Right Ã¢â€ â€™)
        const lowerSpan = screenW + 900;
        const lStep = lowerSpan / lowerLaneCars.length;
        lowerLaneCars.forEach((car, index) => {
          car.x = (index * lStep) - 350;
          car.currentSpeed = car.baseSpeed;
          if (car.el) car.el.style.transform = `translate3d(${car.x.toFixed(1)}px, 0, 0)`;
        });
      }
      initTrafficLanes();
      window.addEventListener('resize', initTrafficLanes);

      // Frame-by-frame physics simulation loop with Distance-Based Collision Avoidance
      let lastFrameTime = performance.now();

      function simulateTraffic(currentTime) {
        const dt = Math.min((currentTime - lastFrameTime) / 1000, 0.1);
        lastFrameTime = currentTime;

        const screenW = window.innerWidth;
        const speedScale = globalTrafficMultiplier;

        // ----------------------------------------------------------------------
        // 1. UPDATE UPPER LANE (TRAFFIC MOVING LEFT Ã¢â€ Â, direction: -1)
        // ----------------------------------------------------------------------
        for (let i = 0; i < upperLaneCars.length; i++) {
          const car = upperLaneCars[i];
          if (!car.el) continue;

          // Find the car immediately ahead of this car in the Upper Lane
          // In Left direction, car ahead has x < car.x
          let minDistanceAhead = Infinity;
          let leadCar = null;

          for (let j = 0; j < upperLaneCars.length; j++) {
            if (i === j) continue;
            const other = upperLaneCars[j];
            
            // Distance from front of car (car.x) to rear of other (other.x + other.width)
            if (other.x < car.x) {
              const gap = car.x - (other.x + other.width);
              if (gap >= 0 && gap < minDistanceAhead) {
                minDistanceAhead = gap;
                leadCar = other;
              }
            }
          }

          // Calculate Dynamic Safe Following Distance
          const dynamicSafeDist = car.minSafeGap + (car.currentSpeed * car.speedBuffer);
          const desiredCruiseSpeed = car.baseSpeed * speedScale;

          if (leadCar && minDistanceAhead < dynamicSafeDist) {
            // Decelerate smoothly to match or yield to the vehicle ahead
            if (minDistanceAhead <= car.minSafeGap) {
              // Critical proximity: brake hard to prevent any collision
              const targetBrakeSpeed = Math.min(leadCar.currentSpeed * 0.4, 20);
              car.currentSpeed = Math.max(targetBrakeSpeed, car.currentSpeed - (car.brakingRate * 1.5 * dt));
              // Hard guard against overlap
              if (car.x < leadCar.x + leadCar.width + 12) {
                car.x = leadCar.x + leadCar.width + 12;
              }
            } else {
              // Smooth progressive braking curve
              const gapRatio = (minDistanceAhead - car.minSafeGap) / (dynamicSafeDist - car.minSafeGap);
              const targetSpeed = Math.max(20, leadCar.currentSpeed * Math.pow(gapRatio, 0.75));
              if (car.currentSpeed > targetSpeed) {
                car.currentSpeed = Math.max(targetSpeed, car.currentSpeed - (car.brakingRate * dt));
              } else {
                car.currentSpeed = Math.min(targetSpeed, car.currentSpeed + (car.acceleration * 0.5 * dt));
              }
            }
          } else {
            // Road ahead is clear: accelerate smoothly back to cruising speed
            if (car.currentSpeed < desiredCruiseSpeed) {
              car.currentSpeed = Math.min(desiredCruiseSpeed, car.currentSpeed + (car.acceleration * dt));
            } else {
              car.currentSpeed = Math.max(desiredCruiseSpeed, car.currentSpeed - (car.brakingRate * 0.5 * dt));
            }
          }

          car.updatePosition(dt);

          // Continuous Off-Screen Respawning Logic for Upper Lane (Exits on Left, enters from Right)
          if (car.x < -car.width - 80) {
            let maxLaneX = -Infinity;
            for (let k = 0; k < upperLaneCars.length; k++) {
              if (upperLaneCars[k].x > maxLaneX) {
                maxLaneX = upperLaneCars[k].x;
              }
            }

            const organicSpawnGap = 160 + (Math.random() * 180);
            if (maxLaneX > screenW) {
              car.x = maxLaneX + organicSpawnGap;
            } else {
              car.x = screenW + 80 + (Math.random() * 120);
            }
            car.currentSpeed = car.baseSpeed * speedScale;
            car.el.style.transform = `translate3d(${car.x.toFixed(1)}px, 0, 0)`;
          }
        }

        // ----------------------------------------------------------------------
        // 2. UPDATE LOWER LANE (TRAFFIC MOVING RIGHT Ã¢â€ â€™, direction: +1)
        // ----------------------------------------------------------------------
        for (let i = 0; i < lowerLaneCars.length; i++) {
          const car = lowerLaneCars[i];
          if (!car.el) continue;

          // Find the car immediately ahead in the Lower Lane
          // In Right direction, car ahead has other.x > car.x
          let minDistanceAhead = Infinity;
          let leadCar = null;

          for (let j = 0; j < lowerLaneCars.length; j++) {
            if (i === j) continue;
            const other = lowerLaneCars[j];

            // Distance from front of car (car.x + car.width) to rear of other (other.x)
            if (other.x > car.x) {
              const gap = other.x - (car.x + car.width);
              if (gap >= 0 && gap < minDistanceAhead) {
                minDistanceAhead = gap;
                leadCar = other;
              }
            }
          }

          // Calculate Dynamic Safe Following Distance
          const dynamicSafeDist = car.minSafeGap + (car.currentSpeed * car.speedBuffer);
          const desiredCruiseSpeed = car.baseSpeed * speedScale;

          if (leadCar && minDistanceAhead < dynamicSafeDist) {
            if (minDistanceAhead <= car.minSafeGap) {
              // Critical proximity: brake hard to prevent any collision
              const targetBrakeSpeed = Math.min(leadCar.currentSpeed * 0.4, 20);
              car.currentSpeed = Math.max(targetBrakeSpeed, car.currentSpeed - (car.brakingRate * 1.5 * dt));
              // Hard guard against overlap
              if (car.x + car.width > leadCar.x - 12) {
                car.x = leadCar.x - car.width - 12;
              }
            } else {
              // Smooth progressive braking curve
              const gapRatio = (minDistanceAhead - car.minSafeGap) / (dynamicSafeDist - car.minSafeGap);
              const targetSpeed = Math.max(20, leadCar.currentSpeed * Math.pow(gapRatio, 0.75));
              if (car.currentSpeed > targetSpeed) {
                car.currentSpeed = Math.max(targetSpeed, car.currentSpeed - (car.brakingRate * dt));
              } else {
                car.currentSpeed = Math.min(targetSpeed, car.currentSpeed + (car.acceleration * 0.5 * dt));
              }
            }
          } else {
            // Road ahead is clear: accelerate smoothly back to cruising speed
            if (car.currentSpeed < desiredCruiseSpeed) {
              car.currentSpeed = Math.min(desiredCruiseSpeed, car.currentSpeed + (car.acceleration * dt));
            } else {
              car.currentSpeed = Math.max(desiredCruiseSpeed, car.currentSpeed - (car.brakingRate * 0.5 * dt));
            }
          }

          car.updatePosition(dt);

          // Continuous Off-Screen Respawning Logic for Lower Lane (Exits on Right, enters from Left)
          if (car.x > screenW + 80) {
            let minLaneX = Infinity;
            for (let k = 0; k < lowerLaneCars.length; k++) {
              if (lowerLaneCars[k].x < minLaneX) {
                minLaneX = lowerLaneCars[k].x;
              }
            }

            const organicSpawnGap = 160 + (Math.random() * 180);
            if (minLaneX < -car.width) {
              car.x = minLaneX - car.width - organicSpawnGap;
            } else {
              car.x = -car.width - 80 - (Math.random() * 120);
            }
            car.currentSpeed = car.baseSpeed * speedScale;
            car.el.style.transform = `translate3d(${car.x.toFixed(1)}px, 0, 0)`;
          }
        }

        requestAnimationFrame(simulateTraffic);
      }
      requestAnimationFrame(simulateTraffic);

      // Car Interaction (Honk Speech Bubble and Audio Synth - Zero Transform distortion)
      function attachCarInteractions(carList) {
        carList.forEach(car => {
          if (!car.el) return;
          car.el.addEventListener('click', (e) => {
            e.stopPropagation();
            playHornSound(car.honkPitch);

            const bubble = car.el.querySelector('.honk-bubble');
            if (bubble) {
              bubble.classList.add('honk-active');
              setTimeout(() => {
                bubble.classList.remove('honk-active');
              }, 1200);
            }
          });
        });
      }
      attachCarInteractions(upperLaneCars);
      attachCarInteractions(lowerLaneCars);

      // ------------------------------------------------------------------------
      // 5. RED PIXEL-ART LETTERBOX INTERACTION
      // ------------------------------------------------------------------------
      const pixelLetterbox = document.getElementById('pixelLetterbox');
      const letterboxPopup = document.getElementById('letterboxPopup');
      let isMailboxOpen = false;

      pixelLetterbox.addEventListener('click', (e) => {
        e.stopPropagation();
        isMailboxOpen = !isMailboxOpen;
        letterboxPopup.classList.toggle('is-open', isMailboxOpen);
        
        if (isMailboxOpen) {
          playPixelMailChime();
          if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
        }
      });

      document.addEventListener('click', (e) => {
        if (isMailboxOpen && !pixelLetterbox.contains(e.target)) {
          isMailboxOpen = false;
          letterboxPopup.classList.remove('is-open');
        }
      });

      // ------------------------------------------------------------------------
      // 6. INTERACTIVE TOWNHOUSE WINDOWS
      // ------------------------------------------------------------------------
      const windows = document.querySelectorAll('.interactive-window');
      windows.forEach((win, index) => {
        if (index % 7 === 2 || index % 11 === 4) {
          win.classList.add('is-lit');
        }

        win.addEventListener('click', (e) => {
          e.stopPropagation();
          win.classList.toggle('is-lit');
        });
      });

      // ------------------------------------------------------------------------
      // 7. MULTI-LAYERED LEAF PARTICLES & WIND BREEZE
      // ------------------------------------------------------------------------
      const leafLayer = document.getElementById('leafParticlesLayer');
      const leafPalette = ['#9fe266', '#6bc24e', '#46913c', '#e09f35', '#f0864c'];
      let activeLeafParticles = [];

      function spawnDriftingLeaf() {
        if (document.hidden) return;

        const leafEl = document.createElement('div');
        leafEl.className = 'leaf-particle';

        const depthRoll = Math.random();
        let scale = 1.0;
        let baseSpeedX = 110;
        let baseSpeedY = 70;
        let opacity = 0.85;

        if (depthRoll < 0.35) {
          scale = 0.55 + Math.random() * 0.25;
          baseSpeedX = 75 + Math.random() * 35;
          baseSpeedY = 45 + Math.random() * 25;
          opacity = 0.55;
        } else if (depthRoll < 0.8) {
          scale = 0.85 + Math.random() * 0.35;
          baseSpeedX = 110 + Math.random() * 50;
          baseSpeedY = 70 + Math.random() * 40;
          opacity = 0.85;
        } else {
          scale = 1.35 + Math.random() * 0.45;
          baseSpeedX = 160 + Math.random() * 70;
          baseSpeedY = 100 + Math.random() * 55;
          opacity = 0.95;
        }

        const sizeW = (9 * scale).toFixed(1);
        const sizeH = (5 * scale).toFixed(1);
        leafEl.style.width = sizeW + 'px';
        leafEl.style.height = sizeH + 'px';
        leafEl.style.backgroundColor = leafPalette[Math.floor(Math.random() * leafPalette.length)];

        let startX, startY;
        if (Math.random() > 0.4) {
          startX = Math.random() * window.innerWidth * 0.85 - 40;
          startY = -25;
        } else {
          startX = -30;
          startY = Math.random() * (window.innerHeight * 0.5);
        }

        const lifespan = 6.5 + Math.random() * 4.0;
        const rotSpeed = (80 + Math.random() * 180) * (Math.random() > 0.5 ? 1 : -1);

        leafEl.style.transform = `translate3d(${startX}px, ${startY}px, 0)`;
        leafLayer.appendChild(leafEl);

        activeLeafParticles.push({
          el: leafEl,
          x: startX,
          y: startY,
          speedX: baseSpeedX,
          speedY: baseSpeedY,
          rot: Math.random() * 360,
          rotSpeed,
          life: 0,
          maxLife: lifespan,
          baseOpacity: opacity
        });
      }

      let lastLeafTime = performance.now();

      function updateLeafParticles(currentTime) {
        const dt = Math.min((currentTime - lastLeafTime) / 1000, 0.1);
        lastLeafTime = currentTime;

        for (let i = activeLeafParticles.length - 1; i >= 0; i--) {
          const p = activeLeafParticles[i];
          p.life += dt;

          if (p.life >= p.maxLife || p.y > window.innerHeight + 40 || p.x > window.innerWidth + 80) {
            if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
            activeLeafParticles.splice(i, 1);
            continue;
          }

          p.x += (p.speedX * globalWindMultiplier) * dt;
          p.y += (p.speedY * globalWindMultiplier) * dt;
          p.rot += p.rotSpeed * dt;

          const flutter = Math.sin(p.life * 5.0) * 12;
          const fx = -flutter * 0.5;
          const fy = flutter * 0.7;

          const progress = p.life / p.maxLife;
          const fade = progress < 0.1 ? (progress * 10) : (progress > 0.8 ? (1 - progress) * 5 : 1);
          p.el.style.opacity = (p.baseOpacity * fade).toFixed(2);
          p.el.style.transform = `translate3d(${(p.x + fx).toFixed(1)}px, ${(p.y + fy).toFixed(1)}px, 0) rotate(${p.rot.toFixed(1)}deg)`;
        }

        requestAnimationFrame(updateLeafParticles);
      }
      requestAnimationFrame(updateLeafParticles);

      setInterval(spawnDriftingLeaf, 340);

      // Cursor Breeze
      let lastMouseX = 0;
      let lastMouseY = 0;
      window.addEventListener('mousemove', (e) => {
        const deltaDist = Math.hypot(e.clientX - lastMouseX, e.clientY - lastMouseY);
        if (deltaDist > 80 && activeLeafParticles.length < 35) {
          spawnDriftingLeaf();
        }
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      });

      // ------------------------------------------------------------------------
      // 8. MULTI-PLANE PARALLAX ON MOUSE, TOUCH & VERTICAL SCROLL
      // ------------------------------------------------------------------------
      let targetParallax = 0;
      let currentParallax = 0;
      let currentScrollY = 0;
      let targetScrollY = 0;

      window.addEventListener('mousemove', (e) => {
        const normalized = (e.clientX / window.innerWidth) * 2 - 1;
        targetParallax = normalized * -38;
      });

      let touchStartX = 0;
      window.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) touchStartX = e.touches[0].clientX;
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
          const deltaX = (e.touches[0].clientX - touchStartX) / window.innerWidth;
          targetParallax = Math.max(-45, Math.min(45, deltaX * -60));
        }
      }, { passive: true });

      window.addEventListener('scroll', () => {
        targetScrollY = window.scrollY || window.pageYOffset || 0;
      }, { passive: true });

      function animateParallaxShift() {
        currentParallax += (targetParallax - currentParallax) * 0.075;
        currentScrollY += (targetScrollY - currentScrollY) * 0.12;

        // Horizontal Parallax (Mouse / Touch)
        root.style.setProperty('--parallax-sky-x', `${(currentParallax * 0.12).toFixed(2)}px`);
        root.style.setProperty('--parallax-bg-x', `${(currentParallax * 0.28).toFixed(2)}px`);
        root.style.setProperty('--parallax-mid-x', `${(currentParallax * 0.55).toFixed(2)}px`);
        root.style.setProperty('--parallax-trees-x', `${(currentParallax * 0.72).toFixed(2)}px`);
        root.style.setProperty('--parallax-road-x', `${(currentParallax * 0.95).toFixed(2)}px`);

        // Vertical Scroll Parallax (Depth: Celestial orb & clouds move slowest)
        root.style.setProperty('--parallax-sky-y', `${(currentScrollY * 0.26).toFixed(2)}px`);
        root.style.setProperty('--parallax-clouds-far-y', `${(currentScrollY * 0.18).toFixed(2)}px`);
        root.style.setProperty('--parallax-clouds-near-y', `${(currentScrollY * 0.32).toFixed(2)}px`);
        root.style.setProperty('--parallax-skyline-y', `${(currentScrollY * 0.45).toFixed(2)}px`);
        root.style.setProperty('--parallax-mid-y', `${(currentScrollY * 0.65).toFixed(2)}px`);
        root.style.setProperty('--parallax-trees-y', `${(currentScrollY * 0.78).toFixed(2)}px`);

        requestAnimationFrame(animateParallaxShift);
      }
      requestAnimationFrame(animateParallaxShift);

      // Hide hint pill after 8 seconds
      setTimeout(() => {
        const hint = document.getElementById('hintPill');
        if (hint) hint.style.opacity = '0';
      }, 8500);

      // ------------------------------------------------------------------------
      // 9. SCROLL-LINKED DIRECT INTERPOLATION (CONTINUOUS SCRUBBING)
      // Calculates live opacity & translateY as a continuous function of scroll
      // ------------------------------------------------------------------------
      const lifecycleSection = document.getElementById('lifecycle-section');
      const timelineTrackFill = document.getElementById('timelineTrackFill');
      const topProgressBar = document.getElementById('topScrollProgress');
      const card1 = document.getElementById('stageCard1');
      const card2 = document.getElementById('stageCard2');
      const card3 = document.getElementById('stageCard3');

      function initLifecycleScrollTracker() {
        if (!lifecycleSection || !card1 || !card2 || !card3) return;

        let isTicking = false;

        // Subtle ease-out curve for natural entry deceleration without time delays
        function easeOutQuad(t) {
          return t * (2 - t);
        }

        function updateLifecycleOnScroll() {
          // 1. Top progress bar
          const docH = document.documentElement.scrollHeight - window.innerHeight;
          if (docH > 0 && topProgressBar) {
            topProgressBar.style.width = `${((window.scrollY / docH) * 100).toFixed(1)}%`;
          }

          // 2. Section position relative to viewport
          const rect = lifecycleSection.getBoundingClientRect();
          const windowH = window.innerHeight;

          // Convert overall scroll through the lifecycle section into 0 - 100%
          // Stretched out over extended scroll distance for dramatic pacing
          const startY = windowH * 0.85;
          const endY = -450;
          const totalDistance = startY - endY;
          const currentDistance = startY - rect.top;
          const progress = Math.min(Math.max((currentDistance / totalDistance) * 100, 0), 100);

          // 3. Update timeline connecting line (slow deliberate crawl)
          if (timelineTrackFill) {
            timelineTrackFill.style.width = `${progress.toFixed(1)}%`;
          }

          // 4. Dramatic Scroll-Linked Scrubbing with Hang Time & Scale Polish
          // Card 1 (Complaint): Reveal window [6%, 26%] | Hang-time pause [26%, 36%]
          const rawP1 = Math.min(Math.max((progress - 6) / 20, 0), 1);
          const p1 = easeOutQuad(rawP1);
          const scale1 = (0.92 + p1 * 0.08).toFixed(3);
          const translateY1 = ((1 - p1) * 50).toFixed(1);
          card1.style.opacity = p1.toFixed(3);
          card1.style.transform = `translateY(${translateY1}px) scale(${scale1})`;
          card1.style.pointerEvents = rawP1 > 0.5 ? 'auto' : 'none';
          if (rawP1 >= 0.5) {
            card1.classList.add('node-lit');
          } else {
            card1.classList.remove('node-lit');
          }

          // Card 2 (Register): Reveal window [36%, 56%] | Hang-time pause [56%, 66%]
          const rawP2 = Math.min(Math.max((progress - 36) / 20, 0), 1);
          const p2 = easeOutQuad(rawP2);
          const scale2 = (0.92 + p2 * 0.08).toFixed(3);
          const translateY2 = ((1 - p2) * 50).toFixed(1);
          card2.style.opacity = p2.toFixed(3);
          card2.style.transform = `translateY(${translateY2}px) scale(${scale2})`;
          card2.style.pointerEvents = rawP2 > 0.5 ? 'auto' : 'none';
          if (rawP2 >= 0.5) {
            card2.classList.add('node-lit');
          } else {
            card2.classList.remove('node-lit');
          }

          // Card 3 (Solved): Reveal window [66%, 86%] | Hang-time pause [86%, 100%]
          const rawP3 = Math.min(Math.max((progress - 66) / 20, 0), 1);
          const p3 = easeOutQuad(rawP3);
          const scale3 = (0.92 + p3 * 0.08).toFixed(3);
          const translateY3 = ((1 - p3) * 50).toFixed(1);
          card3.style.opacity = p3.toFixed(3);
          card3.style.transform = `translateY(${translateY3}px) scale(${scale3})`;
          card3.style.pointerEvents = rawP3 > 0.5 ? 'auto' : 'none';
          if (rawP3 >= 0.5) {
            card3.classList.add('node-lit');
          } else {
            card3.classList.remove('node-lit');
          }

          isTicking = false;
        }

        window.addEventListener('scroll', () => {
          if (!isTicking) {
            requestAnimationFrame(updateLifecycleOnScroll);
            isTicking = true;
          }
        }, { passive: true });

        // Initial check on page load
        updateLifecycleOnScroll();
      }

      initLifecycleScrollTracker();

      // Smooth scroll for Complaint Lifecycle Dropdown / Toggle Pill
      const lifecycleDropdownToggle = document.getElementById('lifecycleDropdownToggle');
      if (lifecycleDropdownToggle) {
        lifecycleDropdownToggle.addEventListener('click', (e) => {
          e.preventDefault();
          const targetSection = document.getElementById('lifecycle-section');
          if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }

      // ------------------------------------------------------------------------
      // 10. MICRO-INTERACTIONS: 3D CARD TILT & BUTTON RIPPLE PHYSICS
      // ------------------------------------------------------------------------
      function initCard3DTilt() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (window.matchMedia('(pointer: coarse)').matches) return;
        const cards = document.querySelectorAll('.stage-card');
        cards.forEach(card => {
          const body = card.querySelector('.stage-card-body');
          if (!body) return;

          card.addEventListener('mousemove', (e) => {
            if (!card.classList.contains('visible')) return;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (((y - centerY) / centerY) * -6).toFixed(2);
            const rotateY = (((x - centerX) / centerX) * 6).toFixed(2);

            body.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
          });

          card.addEventListener('mouseleave', () => {
            body.style.transform = '';
          });
        });
      }
      initCard3DTilt();

      function initButtonRipples() {
        const buttons = document.querySelectorAll('.civic-btn, button');
        buttons.forEach(btn => {
          btn.addEventListener('click', function(e) {
            const target = this.querySelector('.button_top') || this;
            const circle = document.createElement('span');
            circle.className = 'btn-ripple-circle';

            const rect = target.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            circle.style.width = circle.style.height = `${size}px`;
            circle.style.left = `${x}px`;
            circle.style.top = `${y}px`;

            target.appendChild(circle);
            setTimeout(() => {
              if (circle.parentNode) circle.parentNode.removeChild(circle);
            }, 600);
          });
        });
      }
      initButtonRipples();

      // Scroll reveal + reduced-motion tilt skip
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduceMotion) {
        const reveals = document.querySelectorAll('.reveal-on-scroll');
        if ('IntersectionObserver' in window && reveals.length) {
          const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
              }
            });
          }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
          reveals.forEach((el) => io.observe(el));
        } else {
          reveals.forEach((el) => el.classList.add('is-visible'));
        }
      } else {
        document.querySelectorAll('.reveal-on-scroll').forEach((el) => el.classList.add('is-visible'));
      }

    })();
