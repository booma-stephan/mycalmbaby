import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { debugError } from './debug';

const FADE_DURATION = 2000; // 2 seconds for crossfade

class WhiteNoiseGenerator {
  private static instance: WhiteNoiseGenerator;
  private sound1: Audio.Sound | null = null;
  private sound2: Audio.Sound | null = null;
  private activeSound: 'sound1' | 'sound2' = 'sound1';
  private isPlaying: boolean = false;
  private isInitialized: boolean = false;
  private isCrossfading: boolean = false;
  private volume: number = 1.0;
  private playbackInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {}

  public static getInstance(): WhiteNoiseGenerator {
    if (!WhiteNoiseGenerator.instance) {
      WhiteNoiseGenerator.instance = new WhiteNoiseGenerator();
    }
    return WhiteNoiseGenerator.instance;
  }

  public async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
      });
      this.isInitialized = true;
      return true;
    } catch (error) {
      debugError('Failed to initialize audio:', error);
      return false;
    }
  }

  private async createSoundInstance(): Promise<Audio.Sound | null> {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/audio/white-noise.mp3'),
        { shouldPlay: false, isLooping: false } // Looping is handled manually
      );
      return sound;
    } catch (error) {
      debugError('Failed to create sound instance:', error);
      return null;
    }
  }

  public async loadSound(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (!this.sound1) {
      this.sound1 = await this.createSoundInstance();
    }
    if (!this.sound2) {
      this.sound2 = await this.createSoundInstance();
    }
    return !!(this.sound1 && this.sound2);
  }

  public async play(): Promise<boolean> {
    if (!(await this.loadSound())) return false;

    if (!this.isPlaying) {
      this.isPlaying = true;
      const sound = this.activeSound === 'sound1' ? this.sound1 : this.sound2;
      if (sound) {
        await sound.setVolumeAsync(this.volume);
        await sound.playAsync();
        this.monitorPlayback();
      } else {
        this.isPlaying = false;
        return false;
      }
    }
    return true;
  }

  public async stop(): Promise<boolean> {
    if (!this.isPlaying) return true;
    this.isPlaying = false;
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
    await this.sound1?.stopAsync();
    await this.sound2?.stopAsync();
    return true;
  }

  private monitorPlayback() {
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }

    this.playbackInterval = setInterval(async () => {
      // Clear interval when stopped to prevent memory leak
      if (!this.isPlaying) {
        if (this.playbackInterval) {
          clearInterval(this.playbackInterval);
          this.playbackInterval = null;
        }
        return;
      }

      const currentSound = this.activeSound === 'sound1' ? this.sound1 : this.sound2;
      if (!currentSound) return;

      const status = await currentSound.getStatusAsync();

      if (status?.isLoaded && status.isPlaying) {
        const duration = status.durationMillis ?? 0;
        const position = status.positionMillis;

        if (duration - position < FADE_DURATION) {
          await this.crossfade();
        }
      }
    }, 1000);
  }

  private async crossfade(): Promise<void> {
    // Prevent multiple simultaneous crossfades
    if (this.isCrossfading) return;
    this.isCrossfading = true;

    try {
      const inactiveSound = this.activeSound === 'sound1' ? this.sound2 : this.sound1;
      const activeSound = this.activeSound === 'sound1' ? this.sound1 : this.sound2;

      if (!inactiveSound || !activeSound) {
        this.isCrossfading = false;
        return;
      }

      // Switch active sound
      this.activeSound = this.activeSound === 'sound1' ? 'sound2' : 'sound1';

      await inactiveSound.setPositionAsync(0);
      await inactiveSound.setVolumeAsync(0);
      await inactiveSound.playAsync();

      // Fade in the new sound and fade out the old sound in parallel
      await Promise.all([
        this.fade(inactiveSound, this.volume),
        this.fade(activeSound, 0).then(async () => {
          await activeSound.stopAsync();
        }),
      ]);
    } finally {
      this.isCrossfading = false;
    }
  }

  private async fade(sound: Audio.Sound, toVolume: number): Promise<void> {
    const status = await sound.getStatusAsync();
    const fromVolume = status.isLoaded ? (status.volume ?? 0) : 0;
    const steps = 20;
    const stepDuration = FADE_DURATION / steps;

    for (let i = 0; i < steps; i++) {
      const newVolume = fromVolume + (toVolume - fromVolume) * (i / steps);
      await sound.setVolumeAsync(newVolume);
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
    await sound.setVolumeAsync(toVolume);
  }

  public async setVolume(volume: number): Promise<void> {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.isPlaying) {
      const sound = this.activeSound === 'sound1' ? this.sound1 : this.sound2;
      if (sound) {
        await sound.setVolumeAsync(this.volume);
      }
    }
  }

  public isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  public async cleanup(): Promise<void> {
    await this.stop();
    await this.sound1?.unloadAsync();
    await this.sound2?.unloadAsync();
    this.sound1 = null;
    this.sound2 = null;
    this.isInitialized = false;
    this.isCrossfading = false;
  }
}

export default WhiteNoiseGenerator.getInstance();
