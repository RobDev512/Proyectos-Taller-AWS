/**
 * preferences.js — Preferencias locales del jugador.
 * Se conservan entre sesiones con localStorage.
 */

const PREFS_KEY = 'awsArcadePreferencesV1';

const DEFAULTS = Object.freeze({
  difficulty: 'medium',
  sound: true,
  music: true,
  soundVolume: 1,
  musicVolume: 1,
  combo: true,
  fx: true,
});

export function loadPreferences() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    const difficulty = ['easy', 'medium', 'hard'].includes(parsed?.difficulty)
      ? parsed.difficulty
      : DEFAULTS.difficulty;
    return {
      difficulty,
      sound: typeof parsed?.sound === 'boolean' ? parsed.sound : DEFAULTS.sound,
      music: typeof parsed?.music === 'boolean' ? parsed.music : DEFAULTS.music,
      soundVolume: Number.isFinite(Number(parsed?.soundVolume))
        ? Math.max(0, Math.min(1, Number(parsed.soundVolume)))
        : DEFAULTS.soundVolume,
      musicVolume: Number.isFinite(Number(parsed?.musicVolume))
        ? Math.max(0, Math.min(1, Number(parsed.musicVolume)))
        : DEFAULTS.musicVolume,
      combo: typeof parsed?.combo === 'boolean' ? parsed.combo : DEFAULTS.combo,
      fx: typeof parsed?.fx === 'boolean' ? parsed.fx : DEFAULTS.fx,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function savePreferences(prefs) {
  const safe = {
    difficulty: ['easy', 'medium', 'hard'].includes(prefs?.difficulty)
      ? prefs.difficulty
      : DEFAULTS.difficulty,
    sound: prefs?.sound !== false,
    music: prefs?.music !== false,
    soundVolume: Number.isFinite(Number(prefs?.soundVolume))
      ? Math.max(0, Math.min(1, Number(prefs.soundVolume)))
      : DEFAULTS.soundVolume,
    musicVolume: Number.isFinite(Number(prefs?.musicVolume))
      ? Math.max(0, Math.min(1, Number(prefs.musicVolume)))
      : DEFAULTS.musicVolume,
    combo: prefs?.combo !== false,
    fx: prefs?.fx !== false,
  };

  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(safe));
  } catch {
    // El juego puede funcionar aunque el navegador bloquee localStorage.
  }
  return safe;
}
