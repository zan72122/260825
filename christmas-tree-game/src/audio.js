export class WorkAudio {
  constructor() {
    this.enabled = localStorage.getItem('biltmore-tree:audio') !== 'off';
    this.context = null;
    this.master = null;
  }

  ensure() {
    if (!this.enabled || this.context) return this.context;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = .18;
    this.master.connect(this.context.destination);
    return this.context;
  }

  unlock() {
    const context = this.ensure();
    if (context?.state === 'suspended') context.resume().catch(() => {});
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('biltmore-tree:audio', this.enabled ? 'on' : 'off');
    if (this.enabled) {
      this.unlock();
      this.play('click');
    }
    return this.enabled;
  }

  tone({ frequency = 440, endFrequency = frequency, duration = .12, type = 'sine', volume = .35, delay = 0 } = {}) {
    const context = this.ensure();
    if (!context || !this.enabled) return;
    const now = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), now + Math.min(.018, duration * .2));
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + .03);
  }

  noise({ duration = .12, volume = .22, lowpass = 1400, delay = 0 } = {}) {
    const context = this.ensure();
    if (!context || !this.enabled) return;
    const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    const now = context.currentTime + delay;
    source.start(now);
  }

  play(kind = 'touch') {
    if (!this.enabled) return;
    this.unlock();
    switch (kind) {
      case 'metal':
      case 'bolt':
        this.tone({ frequency: 360, endFrequency: 220, duration: .1, type: 'triangle', volume: .3 });
        this.tone({ frequency: 920, endFrequency: 740, duration: .045, type: 'sine', volume: .13, delay: .04 });
        break;
      case 'wood':
        this.noise({ duration: .08, volume: .13, lowpass: 760 });
        this.tone({ frequency: 130, endFrequency: 76, duration: .13, type: 'triangle', volume: .22 });
        break;
      case 'rope':
      case 'fabric':
        this.noise({ duration: .18, volume: .12, lowpass: kind === 'rope' ? 1100 : 700 });
        break;
      case 'saw':
        this.noise({ duration: .11, volume: .18, lowpass: 2500 });
        this.tone({ frequency: 170, endFrequency: 120, duration: .08, type: 'sawtooth', volume: .09 });
        break;
      case 'glass':
      case 'ornament':
        this.tone({ frequency: 980, endFrequency: 790, duration: .28, type: 'sine', volume: .22 });
        this.tone({ frequency: 1470, endFrequency: 1180, duration: .22, type: 'sine', volume: .08, delay: .025 });
        break;
      case 'water':
        this.noise({ duration: .28, volume: .11, lowpass: 900 });
        this.tone({ frequency: 320, endFrequency: 180, duration: .24, type: 'sine', volume: .07 });
        break;
      case 'reel':
        this.tone({ frequency: 145, endFrequency: 95, duration: .16, type: 'square', volume: .08 });
        this.noise({ duration: .12, volume: .08, lowpass: 500 });
        break;
      case 'step':
      case 'carry':
        this.tone({ frequency: 95, endFrequency: 62, duration: .1, type: 'triangle', volume: .18 });
        break;
      case 'sweep':
        this.noise({ duration: .19, volume: .1, lowpass: 1100 });
        break;
      case 'fix':
      case 'click':
        this.tone({ frequency: 510, endFrequency: 660, duration: .07, type: 'triangle', volume: .22 });
        break;
      case 'chime':
        [392, 494, 587, 784].forEach((frequency, index) => this.tone({ frequency, endFrequency: frequency * .995, duration: .72, type: 'sine', volume: .14, delay: index * .09 }));
        break;
      case 'hint':
        this.tone({ frequency: 420, endFrequency: 560, duration: .18, type: 'sine', volume: .16 });
        break;
      default:
        this.tone({ frequency: 230, endFrequency: 270, duration: .06, type: 'triangle', volume: .12 });
        break;
    }
  }
}
