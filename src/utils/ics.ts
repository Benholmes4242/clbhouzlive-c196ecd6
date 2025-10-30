export function buildIcs({ 
  title, 
  start, 
  durationHours = 3 
}: { 
  title: string; 
  start: string; 
  durationHours?: number;
}) {
  const dt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0].replace('T','T') + 'Z';
  const dtStart = new Date(start);
  const dtEnd = new Date(new Date(start).getTime() + durationHours * 3600 * 1000);
  
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${dt(dtStart)}`,
    `DTEND:${dt(dtEnd)}`,
    `SUMMARY:${title}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export function downloadIcs(icsContent: string, filename: string = 'golf-round.ics') {
  const blob = new Blob([icsContent], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
