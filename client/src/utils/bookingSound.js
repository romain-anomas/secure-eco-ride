let context;

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

export function playBookingSound() {
  if (!context || context.state === 'closed') return;
  if (context.state === 'suspended') {
    context.resume().then(() => playBookingSound()).catch(() => {});
    return;
  }
  [0, 0.22].forEach((delay) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.15);
  });
}
