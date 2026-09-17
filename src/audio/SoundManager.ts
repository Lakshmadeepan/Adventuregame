// Web Audio API procedural sound synthesizer for fantasy game

class SoundManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.7;
  private ambientInterval: number | null = null;
  private isMuted: boolean = false;

  private initContext() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();

        this.musicGain.gain.value = this.musicVolume;
        this.sfxGain.gain.value = this.sfxVolume;

        this.musicGain.connect(this.ctx.destination);
        this.sfxGain.connect(this.ctx.destination);
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {
          // Handled silently until user interaction
        });
      }
    } catch {
      // AudioContext deferred
    }
  }

  public setVolumes(music: number, sfx: number) {
    this.musicVolume = music;
    this.sfxVolume = sfx;
    if (this.musicGain) this.musicGain.gain.value = this.isMuted ? 0 : music;
    if (this.sfxGain) this.sfxGain.gain.value = this.isMuted ? 0 : sfx;
  }

  public startAmbient(
    location:
      | 'GRAND_GATE'
      | 'HIDDEN_FOREST'
      | 'RAINBOW_BRIDGE'
      | 'CASTLE_PLACE'
      | 'MYSTERY_ISLAND'
      | 'FAIRY_GARDEN'
      | 'DRAGON_VALLEY'
  ) {
    this.initContext();
    this.stopAmbient();

    let notes: number[];
    switch (location) {
      case 'GRAND_GATE':
        notes = [110, 164.81, 220, 277.18, 329.63]; // A minor mystic drone
        break;
      case 'HIDDEN_FOREST':
        notes = [130.81, 196.00, 261.63, 329.63, 392.00]; // C major / mystical forest chords
        break;
      case 'RAINBOW_BRIDGE':
        notes = [174.61, 220.00, 261.63, 349.23, 440.00]; // F major / airy prismatic breeze
        break;
      case 'CASTLE_PLACE':
        notes = [146.83, 174.61, 220.00, 293.66, 349.23]; // D minor / noble ancient castle
        break;
      case 'MYSTERY_ISLAND':
        notes = [98.00, 130.81, 164.81, 196.00, 246.94]; // G minor / subterranean mystery
        break;
      case 'FAIRY_GARDEN':
        notes = [196.00, 246.94, 293.66, 392.00, 493.88]; // G major / sparkling fairy whimsy
        break;
      case 'DRAGON_VALLEY':
        notes = [110.00, 130.81, 146.83, 174.61, 220.00]; // Deep dramatic restorative chords
        break;
      default:
        notes = [130.81, 196.00, 261.63, 329.63];
    }

    const playChord = () => {
      try {
        if (!this.ctx || !this.musicGain || this.isMuted) return;
        const root = notes[Math.floor(Math.random() * notes.length)];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(root, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(root * 1.01, this.ctx.currentTime + 6);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 2.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 7.5);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 8);
      } catch {
        // Safe fail
      }
    };

    playChord();
    this.ambientInterval = window.setInterval(playChord, 5000);
  }

  public stopAmbient() {
    if (this.ambientInterval !== null) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }

  public playFootstep() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100 + Math.random() * 40, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {
      // Audio protected
    }
  }

  public playJump() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(360, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.19);
    } catch {
      // Audio protected
    }
  }

  public playInteract() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch {
      // Audio protected
    }
  }

  public playDialogueBlip() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320 + Math.random() * 60, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {
      // Audio protected
    }
  }

  public playPickup() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(520, this.ctx.currentTime + 0.16);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.21);
    } catch {
      // Audio protected
    }
  }

  public playRotate() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(550, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.11);
    } catch {
      // Audio protected
    }
  }

  public playPlaceSuccess() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      // Harmonious chord snap
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.04);
        gain.gain.setValueAtTime(0.25, this.ctx!.currentTime + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(this.ctx!.currentTime + i * 0.04);
        osc.stop(this.ctx!.currentTime + 0.5);
      });
    } catch {
      // Audio protected
    }
  }

  public playPlaceWrong() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch {
      // Audio protected
    }
  }

  public playQuestFanfare() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const fanfareNotes = [440, 554.37, 659.25, 880];
      fanfareNotes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        const startTime = this.ctx!.currentTime + idx * 0.12;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.28, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(startTime);
        osc.stop(startTime + 0.7);
      });
    } catch {
      // Audio protected
    }
  }

  public playFairyChime() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      // Cheerful sparkling music-box bell arpeggio
      const chimeNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      chimeNotes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        const t = this.ctx!.currentTime + i * 0.07;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t);
        osc.stop(t + 0.45);
      });
    } catch {
      // Audio protected
    }
  }

  public playCheer() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const notes = [587.33, 739.99, 880.00, 1174.66];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        const t = this.ctx!.currentTime + i * 0.08;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    } catch {
      // Audio protected
    }
  }

  public playHurt() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.16);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch {
      // Audio protected
    }
  }

  public playHeal() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        const t = this.ctx!.currentTime + i * 0.06;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t);
        osc.stop(t + 0.4);
      });
    } catch {
      // Audio protected
    }
  }

  public playExhausted() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    } catch {
      // Audio protected
    }
  }

  public playElderVoice() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const notes = [220, 261.63, 293.66, 329.63];
      const pitch = notes[Math.floor(Math.random() * notes.length)];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.98, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // Audio protected
    }
  }
}

export const sound = new SoundManager();
