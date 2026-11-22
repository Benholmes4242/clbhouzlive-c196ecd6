/** One fit rule for live and saved text. Width measurement belongs to the caller's actual font/run. */
export interface TextRun { text: string }

export function fitTextRuns<T extends TextRun>(runs: T[], maxWidth: number, measure: (text: string, run: T) => number): string[] {
  const full = runs.map((run) => run.text);
  if (runs.reduce((width, run) => width + measure(run.text, run), 0) <= maxWidth) return full;
  const result = runs.map(() => '');
  let used = 0;
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    const chars = Array.from(run.text);
    const next = runs[i + 1];
    if (next && used + measure(run.text, run) + measure('…', next) <= maxWidth) {
      result[i] = run.text;
      used += measure(run.text, run);
      continue;
    }
    let count = chars.length;
    while (count > 0 && used + measure(chars.slice(0, count).join('') + '…', run) > maxWidth) count--;
    result[i] = measure('…', run) + used <= maxWidth ? chars.slice(0, count).join('') + '…' : '';
    break;
  }
  return result;
}