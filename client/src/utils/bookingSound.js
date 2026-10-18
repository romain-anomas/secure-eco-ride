let context;
let activeOscillators = [];
let endTimer;
let onSoundEnd;

export async function unlockBookingSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error('This browser does not support audio alerts.');
  context ||= new AudioContextClass();
  if (context.state === 'suspended') await context.resume();
}

export async function enableBookingSound() {
  await unlockBookingSound();
  playBookingSound();
}

export function stopBookingSound() {
  clearTimeout(endTimer);
  endTimer = undefined;
  for (const oscillator of activeOscillators) {
    try { oscillator.stop(); } catch { /* oscillator may have ended */ }
    oscillator.disconnect();
  }
  activeOscillators = [];
  const ended = onSoundEnd;
  onSoundEnd = undefined;
  ended?.();
}

// A finite, short two-tone horn pattern. Browsers never loop this alert forever.
export function playBookingSound(onEnd, onBlocked, onStart) {
  if (!context || context.state === 'closed') {
    onBlocked?.();
    return false;
  }
  if (context.state === 'suspended') {
    context.resume().then(() => {
      if (context.state === 'running') playBookingSound(onEnd, onBlocked, onStart);
      else onBlocked?.();
    }).catch(() => onBlocked?.());
    return false;
  }

  stopBookingSound();
  onSoundEnd = onEnd;
  const pattern = [0, 0.48, 0.96];
  for (const delay of pattern) {
    for (const frequency of [392, 494]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + delay;
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.035);
      gain.gain.setValueAtTime(0.12, start + 0.19);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.25);
      activeOscillators.push(oscillator);
    }
  }
  onStart?.();
  endTimer = setTimeout(stopBookingSound, 1400);
  return true;
}
