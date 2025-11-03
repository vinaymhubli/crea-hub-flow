/**
 * Notification sound utility
 * Plays bell sound for notifications and live session requests
 */

let audioContext: AudioContext | null = null;
let bellSoundBuffer: AudioBuffer | null = null;

// Debounce/throttle mechanism for rapid notifications
let lastSoundPlayTime: number = 0;
let pendingSoundTimeout: ReturnType<typeof setTimeout> | null = null;
const SOUND_DEBOUNCE_MS = 500; // Wait 500ms between sounds to avoid noise from rapid notifications
let queuedNotifications: number = 0; // Track how many notifications are queued

/**
 * Initialize audio context and load bell sound
 * Creates a pleasant bell sound using Web Audio API
 */
async function initializeSound(): Promise<void> {
  try {
    // Initialize Web Audio API
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Generate a pleasant bell sound
    bellSoundBuffer = createBellSound(audioContext);
  } catch (error) {
    console.error('Error initializing notification sound:', error);
  }
}

/**
 * Creates a bell-like sound using Web Audio API
 * Produces a pleasant chime sound
 */
function createBellSound(context: AudioContext): AudioBuffer {
  const sampleRate = context.sampleRate;
  const duration = 0.3; // 300ms
  const length = sampleRate * duration;
  const buffer = context.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  // Create a bell-like sound using multiple harmonics
  const frequency1 = 523.25; // C5
  const frequency2 = 659.25; // E5
  const frequency3 = 783.99; // G5

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    
    // Envelope for natural decay
    const envelope = Math.exp(-t * 8);
    
    // Combine multiple frequencies for a rich bell sound
    const wave1 = Math.sin(2 * Math.PI * frequency1 * t);
    const wave2 = Math.sin(2 * Math.PI * frequency2 * t) * 0.5;
    const wave3 = Math.sin(2 * Math.PI * frequency3 * t) * 0.3;
    
    // Combine waves with envelope
    data[i] = (wave1 + wave2 + wave3) * envelope * 0.3;
  }

  return buffer;
}

/**
 * Actually plays the bell sound (internal function)
 * @param volume - Volume level (0.0 to 1.0)
 * @param notificationCount - Number of notifications in the batch (for volume adjustment)
 */
async function _playSound(volume: number = 0.7, notificationCount: number = 1): Promise<void> {
  try {
    // Check if browser requires user interaction first
    if (audioContext?.state === 'suspended') {
      await audioContext.resume();
    }

    // Initialize if needed
    if (!audioContext || !bellSoundBuffer) {
      await initializeSound();
    }

    if (!audioContext || !bellSoundBuffer) {
      console.warn('Audio context or bell sound not available');
      return;
    }

    // Create a new source for each notification
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();

    source.buffer = bellSoundBuffer;
    
    // Slightly reduce volume if multiple notifications queued (to prevent overwhelming sound)
    const adjustedVolume = notificationCount > 1 
      ? Math.min(volume, volume * (1 - (notificationCount - 1) * 0.1))
      : volume;
    gainNode.gain.value = Math.max(0.3, Math.min(1, adjustedVolume));

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Play the sound
    source.start(0);

    // Clean up after sound finishes
    source.onended = () => {
      source.disconnect();
      gainNode.disconnect();
    };
  } catch (error) {
    console.error('Error playing notification sound:', error);
    // Fallback: try using a simple beep if Web Audio API fails
    try {
      playFallbackBeep();
    } catch (fallbackError) {
      console.error('Fallback sound also failed:', fallbackError);
    }
  }
}

/**
 * Plays the bell sound notification with debouncing
 * If multiple notifications come rapidly, only plays one sound per debounce period
 * @param volume - Volume level (0.0 to 1.0, default: 0.7)
 */
export async function playNotificationSound(volume: number = 0.7): Promise<void> {
  const now = Date.now();
  const timeSinceLastSound = now - lastSoundPlayTime;
  
  // Increment queue counter
  queuedNotifications++;

  // If sound was played recently, debounce it
  if (timeSinceLastSound < SOUND_DEBOUNCE_MS) {
    // Clear any pending timeout
    if (pendingSoundTimeout) {
      clearTimeout(pendingSoundTimeout);
    }

    // Schedule to play after debounce period
    pendingSoundTimeout = setTimeout(async () => {
      lastSoundPlayTime = Date.now();
      const notificationsToPlay = queuedNotifications;
      queuedNotifications = 0; // Reset counter
      pendingSoundTimeout = null;
      
      // Play sound (only once, even if multiple notifications came)
      await _playSound(volume, notificationsToPlay);
      
      // If there were multiple notifications (3+), optionally play a second softer chime
      // to indicate batch notifications
      if (notificationsToPlay >= 3) {
        setTimeout(async () => {
          await _playSound(volume * 0.5, 1); // Softer second chime for batch
        }, 200);
      }
    }, SOUND_DEBOUNCE_MS - timeSinceLastSound);
  } else {
    // Enough time has passed, play immediately
    lastSoundPlayTime = now;
    const notificationsToPlay = queuedNotifications;
    queuedNotifications = 0; // Reset counter
    
    await _playSound(volume, notificationsToPlay);
    
    // If there were multiple notifications queued (3+), play a second softer chime
    if (notificationsToPlay >= 3) {
      setTimeout(async () => {
        await _playSound(volume * 0.5, 1); // Softer second chime for batch
      }, 200);
    }
  }
}

/**
 * Fallback beep sound using oscillator
 */
function playFallbackBeep(): void {
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = 800; // Frequency in Hz
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
}

/**
 * Initialize sound system (should be called after user interaction)
 * This ensures audio context is ready
 */
export function initializeNotificationSound(): void {
  if (typeof window !== 'undefined' && !audioContext) {
    // Pre-initialize on first call
    initializeSound();
  }
}

