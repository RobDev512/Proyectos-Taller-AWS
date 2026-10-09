/**
 * sound.js — Audio procedural de AWS ORBISHOT.
 *
 * v1.4.1 introduce una capa musical dinámica y amplía la librería de SFX
 * sin depender de archivos externos. Todo se sintetiza con Web Audio API.
 */

let ctx = null;
let masterGain = null;
let fxGain = null;
let musicGain = null;
let musicFilter = null;
let compressor = null;
let noiseBuffer = null;

let fxEnabled = true;
let musicEnabled = true;
let fxVolume = 1;
let musicVolume = 1;

const MASTER_OUTPUT_GAIN = 0.90;
const MUSIC_OUTPUT_GAIN = 0.70;

const soundtrack = {
  mode: 'none',
  step: 0,
  nextTime: 0,
  lastLevel: 1,
  lastTier: 1,
};

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx.state === 'suspended') ctx.resume();
  ensureRouting();
  return ctx;
}

function ensureRouting() {
  if (!ctx || masterGain) return;

  masterGain = ctx.createGain();
  masterGain.gain.value = MASTER_OUTPUT_GAIN;

  compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -20;
  compressor.knee.value = 18;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.18;

  fxGain = ctx.createGain();
  fxGain.gain.value = fxEnabled ? Math.max(0.0001, fxVolume) : 0.0001;

  musicFilter = ctx.createBiquadFilter();
  musicFilter.type = 'lowpass';
  musicFilter.frequency.value = 2400;
  musicFilter.Q.value = 0.4;

  musicGain = ctx.createGain();
  musicGain.gain.value = musicEnabled ? Math.max(0.0001, MUSIC_OUTPUT_GAIN * musicVolume) : 0.0001;

  fxGain.connect(masterGain);
  musicGain.connect(musicFilter);
  musicFilter.connect(masterGain);
  masterGain.connect(compressor);
  compressor.connect(ctx.destination);
}

function now() {
  return getCtx().currentTime;
}

function safeRamp(param, value, time = now(), ramp = 0.04) {
  param.cancelScheduledValues(time);
  param.setValueAtTime(Math.max(0.0001, param.value || 0.0001), time);
  param.exponentialRampToValueAtTime(Math.max(0.0001, value), time + ramp);
}

function noteFreq(root, semitones) {
  return root * Math.pow(2, semitones / 12);
}

function ensureNoiseBuffer() {
  const ac = getCtx();
  if (noiseBuffer) return noiseBuffer;
  const buffer = ac.createBuffer(1, ac.sampleRate * 1.2, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return noiseBuffer;
}

function createOsc(type, destination) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  osc.type = type;
  osc.connect(destination);
  return osc;
}

function createGain(destination) {
  const ac = getCtx();
  const gain = ac.createGain();
  gain.connect(destination);
  return gain;
}

function beep({
  type = 'sine',
  freq = 440,
  freq2 = null,
  duration = 0.1,
  gain = 0.2,
  gainEnd = 0.001,
  delay = 0,
  attack = 0.002,
  destination = null,
  detune = 0,
} = {}) {
  if (!fxEnabled) return;
  try {
    const ac = getCtx();
    const target = destination ?? fxGain;
    const osc = ac.createOscillator();
    const env = ac.createGain();

    osc.type = type;
    osc.detune.value = detune;
    osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
    if (freq2 !== null) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, freq2),
        ac.currentTime + delay + duration,
      );
    }

    osc.connect(env);
    env.connect(target);

    const start = ac.currentTime + delay;
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), start + attack);
    env.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, gainEnd),
      start + duration,
    );

    osc.start(start);
    osc.stop(start + duration + 0.03);
  } catch {
    // Silencioso si el navegador no permite audio.
  }
}

function noiseBurst({
  duration = 0.16,
  gain = 0.12,
  delay = 0,
  hp = 180,
  lp = 2800,
  pan = 0,
  destination = null,
} = {}) {
  if (!fxEnabled) return;
  try {
    const ac = getCtx();
    const target = destination ?? fxGain;
    const source = ac.createBufferSource();
    source.buffer = ensureNoiseBuffer();

    const hpFilter = ac.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.value = hp;

    const lpFilter = ac.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.value = lp;

    const env = ac.createGain();
    env.gain.value = 0.0001;

    let chainEnd = env;
    if (typeof ac.createStereoPanner === 'function') {
      const panner = ac.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      env.connect(panner);
      panner.connect(target);
      chainEnd = panner;
    } else {
      env.connect(target);
    }

    source.connect(hpFilter);
    hpFilter.connect(lpFilter);
    lpFilter.connect(env);

    const start = ac.currentTime + delay;
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(gain, start + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    source.start(start);
    source.stop(start + duration + 0.02);
    void chainEnd;
  } catch {
    // noop
  }
}

function resonantNoiseBurst({
  frequency = 240,
  q = 2.2,
  duration = 0.08,
  gain = 0.05,
  delay = 0,
  destination = null,
} = {}) {
  if (!fxEnabled) return;
  try {
    const ac = getCtx();
    const target = destination ?? fxGain;
    const source = ac.createBufferSource();
    source.buffer = ensureNoiseBuffer();

    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = Math.max(40, frequency);
    filter.Q.value = Math.max(0.1, q);

    const env = ac.createGain();
    source.connect(filter);
    filter.connect(env);
    env.connect(target);

    const start = ac.currentTime + delay;
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), start + 0.003);
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    source.start(start);
    source.stop(start + duration + 0.02);
  } catch {
    // noop
  }
}

function musicTone({
  type = 'sine',
  time = now(),
  duration = 0.2,
  freq = 440,
  freq2 = null,
  gain = 0.04,
  attack = 0.01,
  release = 0.14,
  detune = 0,
  vibrato = 0,
} = {}) {
  if (!musicEnabled) return;
  const ac = getCtx();
  const osc = ac.createOscillator();
  const env = ac.createGain();
  const filter = ac.createBiquadFilter();

  filter.type = 'lowpass';
  filter.frequency.value = 2400;
  filter.Q.value = 0.2;

  osc.type = type;
  osc.detune.value = detune;
  osc.frequency.setValueAtTime(freq, time);
  if (freq2 !== null) {
    osc.frequency.linearRampToValueAtTime(freq2, time + duration);
  }

  if (vibrato > 0) {
    const lfo = ac.createOscillator();
    const lfoGain = ac.createGain();
    lfo.frequency.value = 5.4;
    lfoGain.gain.value = vibrato;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(time);
    lfo.stop(time + duration + release + 0.05);
  }

  osc.connect(filter);
  filter.connect(env);
  env.connect(musicGain);

  env.gain.setValueAtTime(0.0001, time);
  env.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), time + attack);
  env.gain.exponentialRampToValueAtTime(
    0.0001,
    time + Math.max(attack + 0.03, duration + release),
  );

  osc.start(time);
  osc.stop(time + duration + release + 0.05);
}

function musicNoise({
  time = now(),
  duration = 0.12,
  gain = 0.025,
  hp = 300,
  lp = 1600,
} = {}) {
  if (!musicEnabled) return;
  const ac = getCtx();
  const source = ac.createBufferSource();
  source.buffer = ensureNoiseBuffer();

  const hpFilter = ac.createBiquadFilter();
  hpFilter.type = 'highpass';
  hpFilter.frequency.value = hp;
  const lpFilter = ac.createBiquadFilter();
  lpFilter.type = 'lowpass';
  lpFilter.frequency.value = lp;
  const env = ac.createGain();

  source.connect(hpFilter);
  hpFilter.connect(lpFilter);
  lpFilter.connect(env);
  env.connect(musicGain);

  env.gain.setValueAtTime(0.0001, time);
  env.gain.exponentialRampToValueAtTime(gain, time + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  source.start(time);
  source.stop(time + duration + 0.02);
}

export function setSoundEnabled(val) {
  fxEnabled = Boolean(val);
  if (fxGain && ctx) {
    safeRamp(fxGain.gain, fxEnabled ? Math.max(0.0001, fxVolume) : 0.0001, ctx.currentTime, 0.05);
  }
}

export function isSoundEnabled() {
  return fxEnabled;
}

export function setSoundVolume(value) {
  fxVolume = Math.max(0, Math.min(1, Number(value) || 0));
  if (fxGain && ctx) {
    safeRamp(
      fxGain.gain,
      fxEnabled ? Math.max(0.0001, fxVolume) : 0.0001,
      ctx.currentTime,
      0.035,
    );
  }
}

export function getSoundVolume() {
  return fxVolume;
}

export function setMusicEnabled(val) {
  musicEnabled = Boolean(val);
  if (musicGain && ctx) {
    safeRamp(musicGain.gain, musicEnabled ? Math.max(0.0001, MUSIC_OUTPUT_GAIN * musicVolume) : 0.0001, ctx.currentTime, 0.08);
  }
  if (!musicEnabled) {
    soundtrack.mode = 'none';
    soundtrack.nextTime = 0;
  }
}

export function isMusicEnabled() {
  return musicEnabled;
}

export function setMusicVolume(value) {
  musicVolume = Math.max(0, Math.min(1, Number(value) || 0));
  if (musicGain && ctx) {
    safeRamp(
      musicGain.gain,
      musicEnabled ? Math.max(0.0001, MUSIC_OUTPUT_GAIN * musicVolume) : 0.0001,
      ctx.currentTime,
      0.05,
    );
  }
}

export function getMusicVolume() {
  return musicVolume;
}

export function primeAudio() {
  getCtx();
}

function setMusicMood(mode, state, progression) {
  if (soundtrack.mode === mode) return;
  soundtrack.mode = mode;
  soundtrack.step = 0;
  soundtrack.nextTime = now() + 0.05;
  soundtrack.lastLevel = state?.level ?? 1;
  soundtrack.lastTier = progression?.tier ?? 1;

  if (musicFilter && ctx) {
    const t = ctx.currentTime;
    musicFilter.frequency.cancelScheduledValues(t);
    musicFilter.frequency.setValueAtTime(musicFilter.frequency.value, t);
    musicFilter.frequency.exponentialRampToValueAtTime(
      mode === 'boss' ? 1700 : 2600,
      t + 0.22,
    );
  }
}

function scheduleNormalStep(stepTime, state, progression) {
  const tier = Math.max(1, progression?.tier ?? 1);
  const level = Math.max(1, state?.level ?? 1);
  const root = 174.61 * Math.pow(2, Math.min(4, tier - 1) / 12);
  const bassPattern = [0, null, 3, null, 7, null, 5, null];
  const leadPattern = [7, 10, 12, 10, 14, 12, 10, 7];
  const padPattern = [0, 5, 3, 7];
  const step = soundtrack.step % 8;

  const bass = bassPattern[step];
  if (bass !== null) {
    musicTone({
      type: 'triangle',
      time: stepTime,
      duration: 0.18,
      freq: noteFreq(root, bass - 12),
      gain: 0.05,
      attack: 0.004,
      release: 0.08,
    });
    musicTone({
      type: 'sine',
      time: stepTime,
      duration: 0.12,
      freq: noteFreq(root, bass - 24),
      gain: 0.026,
      attack: 0.002,
      release: 0.08,
    });
  }

  if (step % 2 === 0) {
    musicTone({
      type: 'sine',
      time: stepTime + 0.02,
      duration: 0.22,
      freq: noteFreq(root, leadPattern[step]),
      gain: 0.03 + tier * 0.003,
      attack: 0.012,
      release: 0.14,
      vibrato: 2,
    });
  }

  if (step % 4 === 0) {
    musicTone({
      type: 'sawtooth',
      time: stepTime,
      duration: 0.54,
      freq: noteFreq(root, padPattern[(soundtrack.step / 4) % padPattern.length] - 12),
      gain: 0.012 + Math.min(0.012, level * 0.0009),
      attack: 0.03,
      release: 0.22,
    });
  }

  if (step % 2 === 0) {
    musicNoise({
      time: stepTime,
      duration: 0.05,
      gain: 0.008,
      hp: 1800,
      lp: 5200,
    });
  }
}

function scheduleBossStep(stepTime, state, progression) {
  const tier = Math.max(1, progression?.tier ?? 1);
  const phaseIndex = Math.max(0, Math.min(2, Number(state?.boss?.phaseIndex) || 0));
  const phaseId = ['armor', 'exposed', 'core'][phaseIndex];
  const rootBase = phaseId === 'core' ? 123.47 : phaseId === 'exposed' ? 116.54 : 110;
  const pulsePattern = [0, 0, 3, 0, 5, 0, 3, -2];
  const alarmPattern = [12, null, 10, null, 7, null, 8, null];
  const step = soundtrack.step % 8;

  musicTone({
    type: 'sawtooth',
    time: stepTime,
    duration: 0.16,
    freq: noteFreq(rootBase, pulsePattern[step] - 24),
    gain: 0.05,
    attack: 0.003,
    release: 0.07,
  });

  if (step % 2 === 0) {
    musicTone({
      type: 'triangle',
      time: stepTime,
      duration: 0.12,
      freq: noteFreq(rootBase, pulsePattern[step] - 12),
      gain: 0.024,
      attack: 0.004,
      release: 0.07,
    });
  }

  const alarm = alarmPattern[step];
  if (alarm !== null) {
    musicTone({
      type: 'square',
      time: stepTime + 0.03,
      duration: 0.18,
      freq: noteFreq(rootBase, alarm),
      gain: 0.028 + tier * 0.002,
      attack: 0.01,
      release: 0.1,
      vibrato: 3,
    });
  }

  if (step % 4 === 0) {
    musicNoise({
      time: stepTime,
      duration: 0.08,
      gain: 0.012,
      hp: 900,
      lp: 2600,
    });
  }
}

export function updateMusicSystem(state, progression) {
  if (!musicEnabled) return;
  try {
    const ac = getCtx();
    let targetMode = 'none';

    if (
      state?.phase === 'playing' ||
      state?.phase === 'bossintro' ||
      state?.phase === 'levelcomplete' ||
      state?.phase === 'idle'
    ) {
      targetMode = state?.boss?.active && !state?.boss?.defeated ? 'boss' : 'normal';
    }

    if (state?.phase === 'gameover') {
      targetMode = 'none';
    }

    setMusicMood(targetMode, state, progression);
    if (targetMode === 'none') return;

    const bpm = targetMode === 'boss'
      ? 106 + Math.max(0, (progression?.tier ?? 1) - 1) * 4
      : 96 + Math.max(0, (progression?.tier ?? 1) - 1) * 3;
    const stepDuration = 60 / bpm / 2;
    const lookAhead = ac.currentTime + 0.18;

    while (soundtrack.nextTime < lookAhead) {
      if (targetMode === 'boss') {
        scheduleBossStep(soundtrack.nextTime, state, progression);
      } else {
        scheduleNormalStep(soundtrack.nextTime, state, progression);
      }
      soundtrack.nextTime += stepDuration;
      soundtrack.step += 1;
    }
  } catch {
    // noop
  }
}

// ── SFX base ────────────────────────────────────────────────────────────────

export function playSoundLaunch() {
  // Arco/flecha: chasquido seco de cuerda, resonancia breve del arco y un
  // soplo corto del proyectil. Sin tono electrónico sostenido.
  noiseBurst({ duration: 0.020, gain: 0.105, hp: 2600, lp: 9000 });
  resonantNoiseBurst({
    frequency: 235,
    q: 3.4,
    duration: 0.060,
    gain: 0.110,
    delay: 0.002,
  });
  resonantNoiseBurst({
    frequency: 480,
    q: 2.4,
    duration: 0.042,
    gain: 0.050,
    delay: 0.004,
  });
  noiseBurst({
    duration: 0.075,
    gain: 0.034,
    hp: 900,
    lp: 5200,
    delay: 0.010,
  });
}

export function playSoundAnchor(_combo = 1) {
  // Impacto tipo "thock" de una flecha penetrando un blanco: ataque muy
  // corto, cuerpo grave amortiguado y una pequeña resonancia de madera.
  noiseBurst({ duration: 0.024, gain: 0.145, hp: 260, lp: 4200 });
  resonantNoiseBurst({
    frequency: 175,
    q: 2.8,
    duration: 0.085,
    gain: 0.145,
    delay: 0.001,
  });
  resonantNoiseBurst({
    frequency: 390,
    q: 3.2,
    duration: 0.050,
    gain: 0.068,
    delay: 0.004,
  });
  noiseBurst({
    duration: 0.055,
    gain: 0.043,
    hp: 1100,
    lp: 5000,
    delay: 0.003,
  });
}

export function playSoundGameOver() {
  beep({ type: 'sawtooth', freq: 420, freq2: 50, duration: 0.52, gain: 0.30 });
  beep({ type: 'square', freq: 310, freq2: 34, duration: 0.62, gain: 0.16, delay: 0.05 });
  beep({ type: 'triangle', freq: 208, freq2: 24, duration: 0.72, gain: 0.12, delay: 0.10 });
  noiseBurst({ duration: 0.24, gain: 0.06, hp: 100, lp: 1200, delay: 0.02 });
}

export function playSoundCombo(level) {
  const freqs = [0, 0, 660, 784, 880, 1047, 1175, 1318];
  const f = freqs[Math.min(level, freqs.length - 1)] || 660;
  beep({ type: 'sine', freq: f, duration: 0.12, gain: 0.20 });
  beep({ type: 'sine', freq: f * 1.5, duration: 0.10, gain: 0.12, delay: 0.08 });
}

export function playSoundPerfect() {
  beep({ type: 'sine', freq: 880, duration: 0.10, gain: 0.20 });
  beep({ type: 'sine', freq: 1175, duration: 0.13, gain: 0.16, delay: 0.07 });
  beep({ type: 'sine', freq: 1320, duration: 0.12, gain: 0.12, delay: 0.14 });
  noiseBurst({ duration: 0.06, gain: 0.015, hp: 2500, lp: 6000, delay: 0.02 });
}

export function playSoundTierUp() {
  beep({ type: 'triangle', freq: 523, duration: 0.12, gain: 0.20 });
  beep({ type: 'triangle', freq: 659, duration: 0.14, gain: 0.18, delay: 0.08 });
  beep({ type: 'triangle', freq: 784, duration: 0.18, gain: 0.16, delay: 0.16 });
}

export function playSoundLevelComplete() {
  beep({ type: 'triangle', freq: 523, duration: 0.14, gain: 0.22 });
  beep({ type: 'triangle', freq: 659, duration: 0.14, gain: 0.20, delay: 0.10 });
  beep({ type: 'triangle', freq: 784, duration: 0.16, gain: 0.19, delay: 0.20 });
  beep({ type: 'sine', freq: 1047, duration: 0.24, gain: 0.16, delay: 0.31 });
}

export function playSoundPowerUp(type) {
  switch (type) {
    case 'freeze':
      beep({ type: 'sine', freq: 940, freq2: 390, duration: 0.24, gain: 0.18 });
      beep({ type: 'triangle', freq: 620, freq2: 300, duration: 0.30, gain: 0.12, delay: 0.05 });
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

export function playSoundPowerCoreSpawn() {
  beep({ type: 'sine', freq: 520, freq2: 920, duration: 0.20, gain: 0.16 });
  beep({ type: 'triangle', freq: 780, freq2: 1240, duration: 0.22, gain: 0.11, delay: 0.08 });
}

export function playSoundPowerCoreLock(type) {
  const base = {
    freeze: 760,
    shield: 620,
    double: 900,
    cleanup: 560,
  }[type] ?? 700;

  beep({ type: 'square', freq: base, freq2: base * 1.18, duration: 0.07, gain: 0.10 });
  beep({ type: 'sine', freq: base * 1.4, duration: 0.10, gain: 0.09, delay: 0.04 });
}

export function playSoundPowerUpCollect(type) {
  const base = {
    freeze: 760,
    shield: 620,
    double: 880,
    cleanup: 540,
  }[type] ?? 660;

  beep({ type: 'sine', freq: base, freq2: base * 1.28, duration: 0.13, gain: 0.14 });
  beep({ type: 'triangle', freq: base * 1.35, duration: 0.12, gain: 0.10, delay: 0.07 });
}

export function playSoundShieldSave() {
  beep({ type: 'square', freq: 180, freq2: 90, duration: 0.09, gain: 0.16 });
  beep({ type: 'sine', freq: 740, freq2: 1120, duration: 0.22, gain: 0.18, delay: 0.03 });
  beep({ type: 'sine', freq: 1120, duration: 0.14, gain: 0.10, delay: 0.14 });
}

export function playSoundBossIntro() {
  // Sting de suspenso: golpe subgrave, doble pulso tipo latido, ruido ascendente
  // y alarma disonante. Busca anticipar peligro antes de que entre la música boss.
  beep({ type: 'sine', freq: 72, freq2: 46, duration: 0.72, gain: 0.20, attack: 0.004 });
  beep({ type: 'triangle', freq: 118, freq2: 92, duration: 0.18, gain: 0.13, delay: 0.08 });
  beep({ type: 'triangle', freq: 118, freq2: 86, duration: 0.22, gain: 0.12, delay: 0.34 });
  noiseBurst({ duration: 0.62, gain: 0.055, hp: 190, lp: 1800, delay: 0.12 });
  beep({ type: 'sawtooth', freq: 145, freq2: 390, duration: 0.64, gain: 0.075, delay: 0.18 });
  beep({ type: 'square', freq: 392, freq2: 370, duration: 0.16, gain: 0.045, delay: 0.66 });
  beep({ type: 'square', freq: 466, freq2: 440, duration: 0.18, gain: 0.040, delay: 0.82 });
  noiseBurst({ duration: 0.11, gain: 0.07, hp: 120, lp: 1100, delay: 0.92 });
}

export function playSoundBossHit() {
  beep({ type: 'square', freq: 220, freq2: 120, duration: 0.08, gain: 0.12 });
  beep({ type: 'triangle', freq: 640, freq2: 820, duration: 0.12, gain: 0.11, delay: 0.03 });
}

export function playSoundBossBlock() {
  beep({ type: 'square', freq: 150, freq2: 95, duration: 0.10, gain: 0.13 });
  beep({ type: 'sawtooth', freq: 280, freq2: 180, duration: 0.10, gain: 0.08, delay: 0.02 });
}

export function playSoundBossPhase() {
  beep({ type: 'sawtooth', freq: 120, freq2: 58, duration: 0.24, gain: 0.18 });
  beep({ type: 'square', freq: 240, freq2: 110, duration: 0.13, gain: 0.12, delay: 0.03 });
  beep({ type: 'triangle', freq: 420, freq2: 760, duration: 0.24, gain: 0.14, delay: 0.10 });
  beep({ type: 'sine', freq: 820, freq2: 1120, duration: 0.20, gain: 0.10, delay: 0.22 });
}

export function playSoundBossBreak() {
  beep({ type: 'sawtooth', freq: 160, freq2: 54, duration: 0.36, gain: 0.19 });
  beep({ type: 'triangle', freq: 360, freq2: 940, duration: 0.28, gain: 0.14, delay: 0.06 });
  noiseBurst({ duration: 0.24, gain: 0.08, hp: 220, lp: 2600, delay: 0.01 });
  noiseBurst({ duration: 0.18, gain: 0.05, hp: 900, lp: 4200, delay: 0.09, pan: -0.35 });
  noiseBurst({ duration: 0.18, gain: 0.05, hp: 900, lp: 4200, delay: 0.13, pan: 0.35 });
}

export function playSoundBossDefeat() {
  beep({ type: 'triangle', freq: 392, duration: 0.15, gain: 0.18 });
  beep({ type: 'triangle', freq: 523, duration: 0.16, gain: 0.17, delay: 0.10 });
  beep({ type: 'triangle', freq: 659, duration: 0.17, gain: 0.16, delay: 0.20 });
  beep({ type: 'sine', freq: 988, duration: 0.28, gain: 0.14, delay: 0.32 });
}

export function playSoundOverload(value = 0, critical = false) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const base = critical ? 240 : 190 + pct * 1.1;
  beep({ type: 'square', freq: base, freq2: base * 0.78, duration: 0.10, gain: critical ? 0.18 : 0.12 });
  beep({ type: 'triangle', freq: base * 1.9, freq2: base * 1.2, duration: 0.16, gain: critical ? 0.13 : 0.08, delay: 0.03 });
}

export function playSoundTransition() {
  beep({ type: 'triangle', freq: 380, freq2: 760, duration: 0.16, gain: 0.10 });
  beep({ type: 'sine', freq: 760, freq2: 1180, duration: 0.18, gain: 0.08, delay: 0.04 });
}
