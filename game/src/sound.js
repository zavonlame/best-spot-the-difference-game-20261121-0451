// Small synthesised sounds, all WebAudio oscillators — no audio files, no
// network. The context is created on the first user gesture (browsers refuse
// sound before one), and every call is a no-op until then or while muted.

export function createSound() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context === null) {
      try {
        const AudioContext = window.AudioContext ?? window.webkitAudioContext;
        if (!AudioContext) return null;
        context = new AudioContext();
      } catch {
        return null;
      }
    }
    if (context.state === 'suspended') {
      context.resume().catch(() => {});
    }
    return context;
  }

  /** One note: a sine/triangle/sawtooth tone that fades out over `seconds`. */
  function note(frequency, seconds, type, gain, delay) {
    const audio = ensure();
    if (audio === null || muted) return;
    const start = audio.currentTime + (delay ?? 0);
    const oscillator = audio.createOscillator();
    const volume = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    volume.gain.setValueAtTime(0, start);
    volume.gain.linearRampToValueAtTime(gain, start + 0.012);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    oscillator.connect(volume);
    volume.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + seconds + 0.05);
  }

  return {
    /** Call from any user gesture so later sounds are allowed to play. */
    unlock() {
      ensure();
    },
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    click() {
      note(880, 0.05, 'sine', 0.05, 0);
    },
    start() {
      note(523, 0.12, 'sine', 0.1, 0);
      note(784, 0.18, 'sine', 0.1, 0.08);
    },
    found() {
      note(660, 0.14, 'sine', 0.12, 0);
      note(880, 0.22, 'sine', 0.12, 0.09);
    },
    wrong() {
      note(140, 0.18, 'sawtooth', 0.07, 0);
    },
    hint() {
      note(520, 0.16, 'triangle', 0.09, 0);
      note(780, 0.2, 'triangle', 0.07, 0.08);
    },
    roundClear() {
      note(523, 0.16, 'sine', 0.11, 0);
      note(659, 0.16, 'sine', 0.11, 0.11);
      note(784, 0.28, 'sine', 0.11, 0.22);
    },
    win() {
      note(523, 0.18, 'sine', 0.11, 0);
      note(659, 0.18, 'sine', 0.11, 0.13);
      note(784, 0.18, 'sine', 0.11, 0.26);
      note(1046, 0.4, 'sine', 0.12, 0.39);
    },
    lose() {
      note(330, 0.2, 'sine', 0.1, 0);
      note(220, 0.34, 'sine', 0.1, 0.16);
    },
  };
}
