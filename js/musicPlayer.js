/**
 * ROMANTIC AMBIENT MUSIC PLAYER
 * Procedural Web Audio romantic lofi / acoustic piano soundscape
 * Loops beautifully without external file dependencies
 */

const RomanticAudioPlayer = {
  isPlaying: false,
  audioCtx: null,
  gainNode: null,
  timerId: null,
  step: 0,

  // Romantic chord progression frequencies (Cmaj9, Am9, Fmaj7, G6add9)
  chords: [
    [261.63, 329.63, 392.00, 493.88, 587.33], // Cmaj9
    [220.00, 261.63, 329.63, 392.00, 493.88], // Am9
    [174.61, 261.63, 329.63, 392.00, 440.00], // Fmaj7
    [196.00, 246.94, 293.66, 392.00, 440.00]  // G6add9
  ],

  init() {
    const playBtn = document.getElementById('music-toggle-btn');
    const vinylDisc = document.getElementById('vinyl-disc');
    
    if (playBtn) {
      playBtn.addEventListener('click', () => this.toggle());
    }
    if (vinylDisc) {
      vinylDisc.addEventListener('click', () => this.toggle());
    }
  },

  setupAudioContext() {
    if (this.audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContext();

    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.setValueAtTime(0.22, this.audioCtx.currentTime); // Soft gentle volume
    this.gainNode.connect(this.audioCtx.destination);
  },

  playNote(freq, time, duration = 2.5) {
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const noteGain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    // Warm Rhodes / Lofi electric piano sound
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    // Lowpass filter for romantic mellow warmth
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(350, time + duration);

    // Gentle attack and slow romantic decay
    noteGain.gain.setValueAtTime(0.0001, time);
    noteGain.gain.exponentialRampToValueAtTime(0.18, time + 0.12);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + duration);
  },

  playChordArpeggio() {
    if (!this.isPlaying || !this.audioCtx) return;

    const chord = this.chords[this.step % this.chords.length];
    const now = this.audioCtx.currentTime;

    // Pluck notes delicately
    chord.forEach((freq, index) => {
      const noteDelay = index * 0.28 + (Math.random() * 0.05);
      this.playNote(freq, now + noteDelay, 3.2);
    });

    this.step++;
    this.timerId = setTimeout(() => {
      this.playChordArpeggio();
    }, 2400);
  },

  toggle() {
    if (!this.audioCtx) {
      this.setupAudioContext();
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    this.isPlaying = !this.isPlaying;
    this.updateUI();

    if (this.isPlaying) {
      this.playChordArpeggio();
    } else {
      if (this.timerId) clearTimeout(this.timerId);
    }
  },

  pause() {
    if (this.isPlaying) {
      this.isPlaying = false;
      if (this.timerId) clearTimeout(this.timerId);
      this.updateUI();
    }
  },

  updateUI() {
    const vinylDisc = document.getElementById('vinyl-disc');
    const playIcon = document.getElementById('player-icon-state');
    const subtitle = document.getElementById('player-subtitle');

    if (vinylDisc) {
      if (this.isPlaying) {
        vinylDisc.classList.add('playing');
      } else {
        vinylDisc.classList.remove('playing');
      }
    }

    if (playIcon) {
      playIcon.innerHTML = this.isPlaying 
        ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
        : `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    }

    if (subtitle) {
      subtitle.textContent = this.isPlaying ? 'Now Playing • Soft Melody' : 'Click to Play';
    }
  }
};
