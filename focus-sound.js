/* Focus sounds for the Timers page: 5 background noises made live with the Web Audio API
   (no audio files to download). Off by default; the last sound and volume are remembered. */
(function () {
  const tog = document.getElementById('noiseTog'), opts = document.getElementById('noiseOpts'),
        vol = document.getElementById('noiseVol'), lbl = document.getElementById('noiseLbl');
  if (!tog || !opts || !vol) return;
  const store = { get: k => { try { return localStorage.getItem(k); } catch (_) { return null; } },
                  set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} } };
  const NAMES = { rain: 'Rain', ocean: 'Ocean waves', white: 'White noise', pink: 'Pink noise', brown: 'Brown noise' };
  let kind = NAMES[store.get('maatram_noise')] ? store.get('maatram_noise') : 'rain';
  vol.value = store.get('maatram_noise_vol') || '0.5';
  let ctx = null, master = null, chain = null, on = false;

  /* 4-second noise buffers; random noise has no audible loop seam */
  function buffer(type) {
    const len = ctx.sampleRate * 4, b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (type === 'white') d[i] = w * 0.35;
        else if (type === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
        else { /* pink (Paul Kellet), also the base for rain */
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.09; b6 = w * 0.115926;
        }
      }
      if (type === 'rain') { /* scatter short droplet ticks over the pink base */
        for (let n = 0; n < 900; n++) {
          const at = Math.floor(Math.random() * (len - 400)), amp = 0.15 + Math.random() * 0.35;
          for (let k = 0; k < 400; k++) d[at + k] += (Math.random() * 2 - 1) * amp * Math.exp(-k / 40);
        }
      }
    }
    return b;
  }

  function build(type) {
    const src = ctx.createBufferSource(); src.buffer = buffer(type === 'ocean' ? 'brown' : type); src.loop = true;
    let out = src; const nodes = [src];
    if (type === 'rain') { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 500; out.connect(f); out = f; nodes.push(f); }
    if (type === 'ocean') { /* slow swell: brown noise, low-passed, volume rising and falling every ~10 s */
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
      const g = ctx.createGain(); g.gain.value = 0.55;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.1;
      const depth = ctx.createGain(); depth.gain.value = 0.45;
      lfo.connect(depth).connect(g.gain); lfo.start();
      out.connect(f).connect(g); out = g; nodes.push(f, g, lfo, depth);
    }
    out.connect(master); src.start();
    return nodes;
  }

  function stopChain() { if (chain) { chain.forEach(n => { try { n.stop && n.stop(); } catch (_) {} try { n.disconnect(); } catch (_) {} }); chain = null; } }

  function start() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) { lbl.textContent = 'Not supported in this browser'; return; }
      ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    }
    ctx.resume(); stopChain(); chain = build(kind);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(+vol.value, ctx.currentTime, 0.15);
    on = true; render();
  }
  function stop() {
    on = false; render();
    if (!ctx) return;
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
    setTimeout(() => { if (!on) { stopChain(); ctx.suspend(); } }, 600);
  }
  function render() {
    tog.setAttribute('aria-pressed', on); tog.classList.toggle('on', on);
    lbl.textContent = on ? NAMES[kind] + ' on' : 'Focus sound off';
    opts.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.noise === kind));
  }

  tog.addEventListener('click', () => (on ? stop() : start()));
  opts.addEventListener('click', e => {
    const b = e.target.closest('[data-noise]'); if (!b) return;
    kind = b.dataset.noise; store.set('maatram_noise', kind);
    on ? start() : render();
  });
  vol.addEventListener('input', () => {
    store.set('maatram_noise_vol', vol.value);
    if (on && ctx) master.gain.setTargetAtTime(+vol.value, ctx.currentTime, 0.05);
  });
  render();
})();
