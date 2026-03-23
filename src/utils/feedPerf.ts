/**
 * feedPerf — Feed Video Performance Debugger
 *
 * Instagram/TikTok-grade per-video timing console tool.
 * Disabled by default. Enable in DevTools: feedPerf.enable()
 *
 * Measures:
 *  - Viewport entry timestamp (when slide enters view)
 *  - Prefetch status at activation (hit/miss/in-flight)
 *  - Pool hit/miss (was a pre-buffered HLS instance available?)
 *  - HLS attach time (how long to wire up HLS.js)
 *  - Time to first frame from viewport entry (THE key metric)
 *  - Time to first frame from HLS attach
 *  - Stall/rebuffer events during playback
 *  - ABR quality level on first frame + subsequent switches
 *  - Bandwidth estimate at each video start
 *  - Stop/resume events (scroll-away and scroll-back)
 *  - Per-session summary table in console
 */

interface VideoRecord {
  slideIndex: number;
  hlsUrl: string;
  shortId: string;

  // Timestamps (all performance.now())
  viewportEntryAt: number | null;
  activationAt: number | null;
  hlsAttachStartAt: number | null;
  hlsAttachEndAt: number | null;
  firstFrameAt: number | null;
  stallStartAt: number | null;

  // Derived metrics (ms)
  viewportToFirstFrame: number | null;
  viewportToActivation: number | null;
  activationToHlsAttach: number | null;
  hlsAttachToFirstFrame: number | null;

  // State
  poolHit: boolean | null;
  prefetchStatus: 'hit' | 'miss' | 'in-flight' | 'unknown';
  initialQuality: number | null;
  initialBitrate: number | null;
  bandwidthEstimate: number | null;
  stallCount: number;
  totalStallMs: number;
  qualitySwitches: number;
}

type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'dim';

class FeedPerf {
  private enabled = false;
  private records = new Map<string, VideoRecord>();
  private sessionStart = performance.now();

  private styles: Record<LogLevel, string> = {
    info:    'color:#60a5fa;font-weight:bold',
    success: 'color:#34d399;font-weight:bold',
    warn:    'color:#fbbf24;font-weight:bold',
    error:   'color:#f87171;font-weight:bold',
    dim:     'color:#6b7280',
  };

  enable() {
    this.enabled = true;
    this.records.clear();
    this.sessionStart = performance.now();
    console.log('%c[FeedPerf] 🎬 Enabled — scroll the feed to collect data', 'color:#a78bfa;font-weight:bold;font-size:13px');
    console.log('%c[FeedPerf] Commands: feedPerf.summary() | feedPerf.video(index) | feedPerf.reset()', 'color:#6b7280');
  }
  disable() { this.enabled = false; }
  reset() { this.records.clear(); this.sessionStart = performance.now(); console.log('%c[FeedPerf] Reset', 'color:#6b7280'); }

  private shortId(hlsUrl: string): string {
    const match = hlsUrl.match(/\/([a-f0-9]{32,})\//);
    return match ? match[1].slice(0, 8) : hlsUrl.slice(-8);
  }

  private getOrCreate(hlsUrl: string, slideIndex: number): VideoRecord {
    const id = this.shortId(hlsUrl);
    if (!this.records.has(id)) {
      this.records.set(id, {
        slideIndex,
        hlsUrl,
        shortId: id,
        viewportEntryAt: null,
        activationAt: null,
        hlsAttachStartAt: null,
        hlsAttachEndAt: null,
        firstFrameAt: null,
        stallStartAt: null,
        viewportToFirstFrame: null,
        viewportToActivation: null,
        activationToHlsAttach: null,
        hlsAttachToFirstFrame: null,
        poolHit: null,
        prefetchStatus: 'unknown',
        initialQuality: null,
        initialBitrate: null,
        bandwidthEstimate: null,
        stallCount: 0,
        totalStallMs: 0,
        qualitySwitches: 0,
      });
    }
    return this.records.get(id)!;
  }

  private log(level: LogLevel, slideIndex: number, shortId: string, msg: string, data?: object) {
    if (!this.enabled) return;
    const t = Math.round(performance.now() - this.sessionStart);
    const icon = level === 'success' ? '✅' : level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'dim' ? '·' : '📍';
    console.log(
      `%c[FeedPerf]%c +${String(t).padStart(5)}ms %c[slide ${slideIndex}|${shortId}]%c ${icon} ${msg}`,
      'color:#a78bfa;font-weight:bold',
      this.styles.dim,
      'color:#f472b6',
      this.styles[level],
      ...(data ? [data] : [])
    );
  }

  // ─── Instrumentation hooks ───

  onViewportEntry(slideIndex: number, hlsUrl: string) {
    if (!this.enabled || !hlsUrl) return;
    const rec = this.getOrCreate(hlsUrl, slideIndex);
    rec.viewportEntryAt = performance.now();
    this.log('info', slideIndex, rec.shortId, 'Entered viewport');
  }

  onActivation(slideIndex: number, hlsUrl: string, bandwidthEstimate: number) {
    if (!this.enabled || !hlsUrl) return;
    const rec = this.getOrCreate(hlsUrl, slideIndex);
    rec.activationAt = performance.now();
    rec.bandwidthEstimate = bandwidthEstimate;
    if (rec.viewportEntryAt) {
      rec.viewportToActivation = rec.activationAt - rec.viewportEntryAt;
    }
    this.log('info', slideIndex, rec.shortId,
      `Activated (bw=${Math.round(bandwidthEstimate / 1000)}kbps, debounce=${rec.viewportToActivation != null ? Math.round(rec.viewportToActivation) + 'ms' : '?'})`
    );
  }

  onPoolCheck(slideIndex: number, hlsUrl: string, hit: boolean) {
    if (!this.enabled || !hlsUrl) return;
    const rec = this.getOrCreate(hlsUrl, slideIndex);
    rec.poolHit = hit;
    this.log(hit ? 'success' : 'warn', slideIndex, rec.shortId,
      hit ? 'HLS Pool HIT — using pre-buffered instance' : 'HLS Pool MISS — creating new instance'
    );
  }

  onPrefetchCheck(slideIndex: number, hlsUrl: string, status: VideoRecord['prefetchStatus']) {
    if (!this.enabled || !hlsUrl) return;
    const rec = this.getOrCreate(hlsUrl, slideIndex);
    rec.prefetchStatus = status;
    const level = status === 'hit' ? 'success' : status === 'in-flight' ? 'warn' : 'error';
    this.log(level, slideIndex, rec.shortId, `Prefetch: ${status.toUpperCase()}`);
  }

  onHlsAttachStart(slideIndex: number, hlsUrl: string) {
    if (!this.enabled || !hlsUrl) return;
    const rec = this.getOrCreate(hlsUrl, slideIndex);
    rec.hlsAttachStartAt = performance.now();
    if (rec.activationAt) {
      rec.activationToHlsAttach = rec.hlsAttachStartAt - rec.activationAt;
    }
    this.log('dim', slideIndex, rec.shortId,
      `HLS attach start (activation→attach: ${rec.activationToHlsAttach != null ? Math.round(rec.activationToHlsAttach) + 'ms' : '?'})`
    );
  }

  onHlsManifestParsed(slideIndex: number, hlsUrl: string, levels: number) {
    if (!this.enabled || !hlsUrl) return;
    const rec = this.getOrCreate(hlsUrl, slideIndex);
    rec.hlsAttachEndAt = performance.now();
    const attachDuration = rec.hlsAttachStartAt ? Math.round(rec.hlsAttachEndAt - rec.hlsAttachStartAt) : null;
    this.log('info', slideIndex, rec.shortId,
      `Manifest parsed — ${levels} quality levels (attach took ${attachDuration ?? '?'}ms)`
    );
  }

  onFirstFrame(slideIndex: number, hlsUrl: string) {
    if (!this.enabled || !hlsUrl) return;
    const rec = this.getOrCreate(hlsUrl, slideIndex);
    rec.firstFrameAt = performance.now();

    if (rec.viewportEntryAt) {
      rec.viewportToFirstFrame = rec.firstFrameAt - rec.viewportEntryAt;
    }
    if (rec.hlsAttachStartAt) {
      rec.hlsAttachToFirstFrame = rec.firstFrameAt - rec.hlsAttachStartAt;
    }

    const keyMetric = rec.viewportToFirstFrame;
    const level = keyMetric == null ? 'info' : keyMetric < 200 ? 'success' : keyMetric < 500 ? 'warn' : 'error';
    const grade = keyMetric == null ? '' : keyMetric < 200 ? '🚀 INSTANT' : keyMetric < 500 ? '✓ ACCEPTABLE' : '🐌 SLOW';

    this.log(level, slideIndex, rec.shortId,
      `FIRST FRAME ${grade}`,
      {
        'viewport→frame': keyMetric != null ? `${Math.round(keyMetric)}ms` : '?',
        'attach→frame': rec.hlsAttachToFirstFrame != null ? `${Math.round(rec.hlsAttachToFirstFrame)}ms` : '?',
        poolHit: rec.poolHit,
        prefetch: rec.prefetchStatus,
      }
    );
  }

  onStallStart(slideIndex: number, hlsUrl: string) {
    if (!this.enabled || !hlsUrl) return;
    const rec = this.getOrCreate(hlsUrl, slideIndex);
    rec.stallStartAt = performance.now();
    rec.stallCount++;
    this.log('error', slideIndex, rec.shortId, `STALL #${rec.stallCount} started`);
  }

  onStallEnd(slideIndex: number, hlsUrl: string) {
    if (!this.enabled || !hlsUrl) return;
    const rec = this.getOrCreate(hlsUrl, slideIndex);
    if (rec.stallStartAt) {
      const stallMs = performance.now() - rec.stallStartAt;
      rec.totalStallMs += stallMs;
      rec.stallStartAt = null;
      this.log('warn', slideIndex, rec.shortId, `Stall recovered (${Math.round(stallMs)}ms)`);
    }
  }

  onQualitySwitch(slideIndex: number, hlsUrl: string, heightPx: number, bitrateKbps: number) {
    if (!this.enabled || !hlsUrl) return;
    const rec = this.getOrCreate(hlsUrl, slideIndex);
    if (rec.initialQuality === null) {
      rec.initialQuality = heightPx;
      rec.initialBitrate = bitrateKbps;
      this.log('info', slideIndex, rec.shortId, `Initial quality: ${heightPx}p @ ${bitrateKbps}kbps`);
    } else {
      rec.qualitySwitches++;
      this.log('dim', slideIndex, rec.shortId, `Quality switch #${rec.qualitySwitches}: ${heightPx}p @ ${bitrateKbps}kbps`);
    }
  }

  onDeactivation(slideIndex: number, hlsUrl: string, reason: 'stopped' | 'destroyed') {
    if (!this.enabled || !hlsUrl) return;
    const rec = this.getOrCreate(hlsUrl, slideIndex);
    this.log('dim', slideIndex, rec.shortId, `Deactivated (${reason})`);
  }

  // ─── Console reporting ───

  summary() {
    const records = Array.from(this.records.values()).sort((a, b) => a.slideIndex - b.slideIndex);
    if (records.length === 0) {
      console.log('%c[FeedPerf] No data yet — enable first: feedPerf.enable()', 'color:#6b7280');
      return;
    }

    console.log('\n%c╔══════════════════════════════════════════════════════════════════╗', 'color:#a78bfa');
    console.log('%c║              FEED VIDEO PERFORMANCE SUMMARY                     ║', 'color:#a78bfa;font-weight:bold');
    console.log('%c╚══════════════════════════════════════════════════════════════════╝\n', 'color:#a78bfa');

    const ttffs = records.filter(r => r.viewportToFirstFrame != null).map(r => r.viewportToFirstFrame!);
    if (ttffs.length > 0) {
      const avg = Math.round(ttffs.reduce((a, b) => a + b, 0) / ttffs.length);
      const sorted = [...ttffs].sort((a, b) => a - b);
      const p50 = Math.round(sorted[Math.floor(sorted.length * 0.5)]);
      const p95 = Math.round(sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1]);
      const instant = ttffs.filter(t => t < 200).length;
      const slow = ttffs.filter(t => t > 500).length;

      console.log('%cViewport → First Frame (THE KEY METRIC):', 'font-weight:bold;font-size:13px');
      console.log(`  Avg: ${avg}ms | P50: ${p50}ms | P95: ${p95}ms`);
      console.log(`  🚀 Instant (<200ms): ${instant}/${ttffs.length} videos`);
      console.log(`  🐌 Slow (>500ms):    ${slow}/${ttffs.length} videos\n`);
    }

    const poolHits = records.filter(r => r.poolHit === true).length;
    const prefetchHits = records.filter(r => r.prefetchStatus === 'hit').length;
    console.log(`%cPipeline Efficiency:`, 'font-weight:bold');
    console.log(`  Pool hits:     ${poolHits}/${records.length}`);
    console.log(`  Prefetch hits: ${prefetchHits}/${records.length}`);
    console.log(`  Stall events:  ${records.reduce((a, r) => a + r.stallCount, 0)}\n`);

    console.table(records.map(r => ({
      slide: r.slideIndex,
      id: r.shortId,
      'v→frame': r.viewportToFirstFrame != null ? Math.round(r.viewportToFirstFrame) + 'ms' : '—',
      'attach→frame': r.hlsAttachToFirstFrame != null ? Math.round(r.hlsAttachToFirstFrame) + 'ms' : '—',
      pool: r.poolHit === true ? '✅ HIT' : r.poolHit === false ? '❌ MISS' : '?',
      prefetch: r.prefetchStatus,
      quality: r.initialQuality ? r.initialQuality + 'p' : '?',
      bw: r.bandwidthEstimate ? Math.round(r.bandwidthEstimate / 1000) + 'kbps' : '?',
      stalls: r.stallCount,
      grade: r.viewportToFirstFrame == null ? '?' : r.viewportToFirstFrame < 200 ? '🚀' : r.viewportToFirstFrame < 500 ? '✓' : '🐌',
    })));
  }

  video(slideIndex: number) {
    const rec = Array.from(this.records.values()).find(r => r.slideIndex === slideIndex);
    if (!rec) {
      console.log(`%c[FeedPerf] No data for slide ${slideIndex}`, 'color:#6b7280');
      return;
    }
    console.log(`\n%c🎬 SLIDE ${slideIndex} DEEP DIVE [${rec.shortId}]`, 'color:#f472b6;font-weight:bold;font-size:13px');
    console.log(`URL: ${rec.hlsUrl}`);
    console.log('\nTimeline:');
    if (rec.viewportEntryAt) console.log(`  +0ms          Viewport entry`);
    if (rec.viewportToActivation) console.log(`  +${Math.round(rec.viewportToActivation)}ms     Activated (observer debounce)`);
    if (rec.activationToHlsAttach) console.log(`  +${Math.round((rec.viewportToActivation ?? 0) + rec.activationToHlsAttach)}ms     HLS attach start`);
    if (rec.hlsAttachEndAt && rec.viewportEntryAt) console.log(`  +${Math.round(rec.hlsAttachEndAt - rec.viewportEntryAt)}ms     Manifest parsed`);
    if (rec.viewportToFirstFrame) console.log(`  +${Math.round(rec.viewportToFirstFrame)}ms     ← FIRST FRAME ←`);
    console.log('\nDiagnosis:');
    console.log(`  Pool hit:     ${rec.poolHit === true ? '✅ YES — instant HLS attach' : rec.poolHit === false ? '❌ NO — cold HLS init' : '?'}`);
    console.log(`  Prefetch:     ${rec.prefetchStatus}`);
    console.log(`  Quality:      ${rec.initialQuality ? rec.initialQuality + 'p' : '?'} @ ${rec.initialBitrate ? rec.initialBitrate + 'kbps' : '?'}`);
    console.log(`  Stalls:       ${rec.stallCount} (${Math.round(rec.totalStallMs)}ms total)`);
    console.log(`  ABR switches: ${rec.qualitySwitches}`);
    const v2f = rec.viewportToFirstFrame;
    if (v2f != null) {
      const verdict = v2f < 200 ? '🚀 INSTANT — excellent' : v2f < 500 ? '✓ ACCEPTABLE' : '🐌 SLOW — investigate prefetch/pool';
      console.log(`\n  Verdict: ${verdict} (${Math.round(v2f)}ms viewport→frame)`);
    }
  }
}

export const feedPerf = new FeedPerf();

if (typeof window !== 'undefined') {
  (window as any).feedPerf = feedPerf;
}
