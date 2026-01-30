import WhiteNoiseGenerator from './WhiteNoiseGenerator';
import { debugError } from './debug';

/**
 * AudioManager provides a centralized way to control audio playback
 * independently from UI animations or other components.
 */
class AudioManager {
  private static instance: AudioManager;
  private isInitialized: boolean = false;
  private isPlaying: boolean = false;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance of AudioManager
   */
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initialize audio system and prepare for playback
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      const success = await WhiteNoiseGenerator.initialize();
      this.isInitialized = success;
      return success;
    } catch (error) {
      debugError('Failed to initialize AudioManager:', error);
      return false;
    }
  }

  /**
   * Start playing white noise independent of animations
   */
  public async startWhiteNoise(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return false;
        }
      }

      if (!this.isPlaying) {
        const success = await WhiteNoiseGenerator.play();
        this.isPlaying = success;
        return success;
      }
      return true;
    } catch (error) {
      debugError('Failed to start white noise:', error);
      return false;
    }
  }

  /**
   * Stop white noise with fade out
   */
  public async stopWhiteNoise(): Promise<boolean> {
    try {
      if (this.isPlaying) {
        await WhiteNoiseGenerator.stop();
        this.isPlaying = false;
        return true;
      }
      return true;
    } catch (error) {
      debugError('Failed to stop white noise:', error);
      this.isPlaying = false; // Ensure state is updated even on error
      return false;
    }
  }

  /**
   * Set the volume of white noise
   */
  public async setVolume(volume: number): Promise<void> {
    try {
      await WhiteNoiseGenerator.setVolume(volume);
    } catch (error) {
      debugError('Failed to set volume:', error);
    }
  }

  /**
   * Check if white noise is currently playing
   */
  public isWhiteNoisePlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Play white noise (alias for startWhiteNoise for backward compatibility)
   */
  public async play(): Promise<boolean> {
    return this.startWhiteNoise();
  }

  /**
   * Stop white noise (alias for stopWhiteNoise for backward compatibility)
   */
  public async stop(): Promise<boolean> {
    return this.stopWhiteNoise();
  }

  /**
   * Release all audio resources
   */
  public async cleanup(): Promise<void> {
    try {
      await this.stopWhiteNoise();
      await WhiteNoiseGenerator.cleanup();
      this.isInitialized = false;
    } catch (error) {
      debugError('Failed to cleanup AudioManager:', error);
    }
  }
}

export default AudioManager.getInstance();
