/**
 * Upload Speed & ETA Tracker
 * 
 * Tracks upload progress samples to calculate:
 * - Current upload speed (bytes/sec)
 * - Estimated time remaining
 * 
 * Uses a sliding window of samples for smooth calculations.
 */

interface SpeedSample {
  timestamp: number;
  bytesUploaded: number;
}

export class UploadSpeedTracker {
  private samples: SpeedSample[] = [];
  private readonly maxSamples: number;
  private readonly sampleIntervalMs: number;
  
  constructor(maxSamples = 10, sampleIntervalMs = 500) {
    this.maxSamples = maxSamples;
    this.sampleIntervalMs = sampleIntervalMs;
  }
  
  /**
   * Add a progress sample
   */
  addSample(bytesUploaded: number): void {
    const now = Date.now();
    
    // Only add sample if enough time has passed
    const lastSample = this.samples[this.samples.length - 1];
    if (lastSample && now - lastSample.timestamp < this.sampleIntervalMs) {
      return;
    }
    
    this.samples.push({ timestamp: now, bytesUploaded });
    
    // Keep only recent samples
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }
  
  /**
   * Get current upload speed in bytes per second
   */
  getSpeed(): number {
    if (this.samples.length < 2) return 0;
    
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    
    const timeDiffSeconds = (last.timestamp - first.timestamp) / 1000;
    const bytesDiff = last.bytesUploaded - first.bytesUploaded;
    
    if (timeDiffSeconds <= 0) return 0;
    
    return Math.round(bytesDiff / timeDiffSeconds);
  }
  
  /**
   * Get estimated time remaining in seconds
   */
  getETA(bytesRemaining: number): number {
    const speed = this.getSpeed();
    if (speed <= 0) return 0;
    
    return Math.round(bytesRemaining / speed);
  }
  
  /**
   * Reset all samples
   */
  reset(): void {
    this.samples = [];
  }
  
  /**
   * Get formatted speed string (e.g., "2.5 MB/s")
   */
  getFormattedSpeed(): string {
    const speed = this.getSpeed();
    return formatBytesPerSecond(speed);
  }
  
  /**
   * Get formatted ETA string (e.g., "2m 30s")
   */
  getFormattedETA(bytesRemaining: number): string {
    const seconds = this.getETA(bytesRemaining);
    return formatDuration(seconds);
  }
}

/**
 * Format bytes per second to human-readable string
 */
export function formatBytesPerSecond(bytesPerSecond: number): string {
  if (bytesPerSecond <= 0) return '0 B/s';
  
  if (bytesPerSecond < 1024) {
    return `${bytesPerSecond} B/s`;
  }
  if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  }
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
}

/**
 * Format seconds to human-readable duration
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '';
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
