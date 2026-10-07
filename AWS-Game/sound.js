/**
 * sound.js — Efectos de sonido con Web Audio API. Sin archivos externos.
 * Todos los sonidos se sintetizan proceduralmente.
 */

let ctx = null;
let enabled = true;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  // Reanudar si fue suspendido por política de autoplay
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setSoundEnabled(val) { enabled = val; }
export function isSoundEnabled()    { return enabled; }

/** Genera un sonido corto con un oscilador */
function beep({ type = 'sine', freq = 440, freq2 = null, duration = 0.1,
                gain = 0.3, gainEnd = 0.001, delay = 0 } = {}) {
  if (!enabled) return;
  try {
    const ac  = getCtx();
    const osc = ac.createOscillator();
    const env = ac.createGain();
    osc.connect(env);
    env.connect(ac.destination);

    osc.type      = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
    if (freq2 !== null)
      osc.frequency.linearRampToValueAtTime(freq2, ac.currentTime + delay + duration);

    env.gain.setValueAtTime(gain, ac.currentTime + delay);
    env.gain.exponentialRampToValueAtTime(gainEnd, ac.currentTime + delay + duration);

    osc.start(ac.currentTime + delay);
    osc.stop(ac.currentTime + delay + duration + 0.01);
  } catch(e) { /* silencioso en navegadores sin soporte */ }
}

/** Whoosh al lanzar */
export function playSoundLaunch() {
  beep({ type: 'sawtooth', freq: 800, freq2: 200, duration: 0.12, gain: 0.15 });
}

/** Thunk al aterrizar */
export function playSoundAnchor(combo = 1) {
  // Tono más alto con cada combo
  const f = 300 + combo * 60;
  beep({ type: 'triangle', freq: f, freq2: f * 0.7, duration: 0.09, gain: 0.25 });
  // Click de impacto
  beep({ type: 'square', freq: 180, freq2: 80, duration: 0.06, gain: 0.12, delay: 0.01 });
}

/** Crash en game over */
export function playSoundGameOver() {
  // Ruido descendente disonante
  beep({ type: 'sawtooth', freq: 400, freq2: 50,  duration: 0.5, gain: 0.35 });
  beep({ type: 'square',   freq: 300, freq2: 30,  duration: 0.6, gain: 0.2, delay: 0.05 });
  beep({ type: 'triangle', freq: 200, freq2: 20,  duration: 0.7, gain: 0.15, delay: 0.1 });
}

/** Chime de combo x2/x3/... */
export function playSoundCombo(level) {
  const freqs = [0, 0, 660, 784, 880, 1047];
  const f = freqs[Math.min(level, 5)] || 660;
  beep({ type: 'sine', freq: f,       duration: 0.12, gain: 0.2 });
  beep({ type: 'sine', freq: f * 1.5, duration: 0.10, gain: 0.12, delay: 0.08 });
}


/** Campanilla brillante para un Perfect Shot. */
export function playSoundPerfect() {
  beep({ type: 'sine', freq: 880,  duration: 0.10, gain: 0.20 });
  beep({ type: 'sine', freq: 1175, duration: 0.13, gain: 0.16, delay: 0.07 });
  beep({ type: 'sine', freq: 1320, duration: 0.12, gain: 0.12, delay: 0.14 });
}

/** Acorde corto al subir de Tier. */
export function playSoundTierUp() {
  beep({ type: 'triangle', freq: 523, duration: 0.12, gain: 0.20 });
  beep({ type: 'triangle', freq: 659, duration: 0.14, gain: 0.18, delay: 0.08 });
  beep({ type: 'triangle', freq: 784, duration: 0.18, gain: 0.16, delay: 0.16 });
}

/** Fanfarria breve al completar un nivel. */
export function playSoundLevelComplete() {
  beep({ type: 'triangle', freq: 523, duration: 0.14, gain: 0.22 });
  beep({ type: 'triangle', freq: 659, duration: 0.14, gain: 0.20, delay: 0.10 });
  beep({ type: 'triangle', freq: 784, duration: 0.16, gain: 0.19, delay: 0.20 });
  beep({ type: 'sine', freq: 1047, duration: 0.24, gain: 0.16, delay: 0.31 });
}

/**
 * Sonido de activación para cada Power-Up.
 *
 * @param {'freeze'|'shield'|'double'|'cleanup'} type
 */
export function playSoundPowerUp(type) {
  switch (type) {
    case 'freeze':
      beep({ type: 'sine', freq: 920, freq2: 420, duration: 0.22, gain: 0.18 });
      beep({ type: 'triangle', freq: 620, freq2: 310, duration: 0.28, gain: 0.12, delay: 0.05 });
      break;

    case 'shield':
      beep({ type: 'sine', freq: 520, freq2: 760, duration: 0.16, gain: 0.18 });
      beep({ type: 'sine', freq: 760, freq2: 1040, duration: 0.18, gain: 0.13, delay: 0.08 });
      break;

    case 'double':
      beep({ type: 'triangle', freq: 660, duration: 0.10, gain: 0.18 });
      beep({ type: 'triangle', freq: 880, duration: 0.12, gain: 0.16, delay: 0.07 });
      beep({ type: 'sine', freq: 1320, duration: 0.15, gain: 0.12, delay: 0.14 });
      break;

    case 'cleanup':
      beep({ type: 'square', freq: 420, freq2: 180, duration: 0.11, gain: 0.12 });
      beep({ type: 'triangle', freq: 520, freq2: 780, duration: 0.16, gain: 0.12, delay: 0.06 });
      break;

    default:
      break;
  }
}

/** Sonido breve cuando un Power-Up entra al inventario. */
export function playSoundPowerUpCollect(type) {
  const base = {
    freeze: 760,
    shield: 620,
    double: 880,
    cleanup: 540,
  }[type] ?? 660;

  beep({
    type: 'sine',
    freq: base,
    freq2: base * 1.28,
    duration: 0.13,
    gain: 0.14,
  });

  beep({
    type: 'triangle',
    freq: base * 1.35,
    duration: 0.12,
    gain: 0.10,
    delay: 0.07,
  });
}

/** Confirmación especial cuando Shield absorbe una colisión. */
export function playSoundShieldSave() {
  beep({ type: 'square', freq: 180, freq2: 90, duration: 0.09, gain: 0.16 });
  beep({ type: 'sine', freq: 740, freq2: 1120, duration: 0.22, gain: 0.18, delay: 0.03 });
  beep({ type: 'sine', freq: 1120, duration: 0.14, gain: 0.10, delay: 0.14 });
}
