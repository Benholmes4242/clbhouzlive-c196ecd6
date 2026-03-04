/**
 * HLS Manifest Parser — extracts quality levels and segment URLs
 * from M3U8 manifests for segment prefetching.
 */

interface ParsedLevel {
  bandwidth: number;
  width: number;
  height: number;
  uri: string;
}

interface ParsedSegment {
  uri: string;
  duration: number;
}

interface ParsedManifest {
  levels: ParsedLevel[];
  lowestLevel: ParsedLevel | null;
}

interface ParsedSegmentManifest {
  segments: ParsedSegment[];
  targetDuration: number;
}

function resolveUrl(relative: string, base: string): string {
  if (relative.startsWith('http://') || relative.startsWith('https://')) {
    return relative;
  }
  const basePath = base.substring(0, base.lastIndexOf('/') + 1);
  return basePath + relative;
}

export function parseMasterManifest(manifestText: string, baseUrl: string): ParsedManifest {
  const levels: ParsedLevel[] = [];
  const lines = manifestText.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXT-X-STREAM-INF:')) {
      const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/);
      const resolutionMatch = line.match(/RESOLUTION=(\d+)x(\d+)/);
      const bandwidth = bandwidthMatch ? parseInt(bandwidthMatch[1]) : 0;
      const width = resolutionMatch ? parseInt(resolutionMatch[1]) : 0;
      const height = resolutionMatch ? parseInt(resolutionMatch[2]) : 0;

      const nextLine = lines[i + 1]?.trim();
      if (nextLine && !nextLine.startsWith('#')) {
        levels.push({ bandwidth, width, height, uri: resolveUrl(nextLine, baseUrl) });
      }
    }
  }

  const lowestLevel = levels.length > 0
    ? levels.reduce((a, b) => (a.bandwidth < b.bandwidth ? a : b))
    : null;

  return { levels, lowestLevel };
}

export function parseSegmentManifest(manifestText: string, baseUrl: string): ParsedSegmentManifest {
  const segments: ParsedSegment[] = [];
  const lines = manifestText.split('\n');
  let targetDuration = 0;
  let currentDuration = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#EXT-X-TARGETDURATION:')) {
      targetDuration = parseFloat(trimmed.split(':')[1]);
    } else if (trimmed.startsWith('#EXTINF:')) {
      currentDuration = parseFloat(trimmed.split(':')[1].replace(',', ''));
    } else if (trimmed && !trimmed.startsWith('#')) {
      segments.push({ uri: resolveUrl(trimmed, baseUrl), duration: currentDuration });
      currentDuration = 0;
    }
  }

  return { segments, targetDuration };
}
