/** Shared You/Champions selection; existing You-tab translation keys stay put. */
export type RecordRangeForm = 'rangeRecordAbove' | 'rangeRecordInside' | 'rangeRecordBelow';
export function recordProjectionForm(record: number | null, range: { lowGross: number; highGross: number }, thinField: boolean): RecordRangeForm | 'rangeWithRecordThin' | 'range' {
  if (record == null) return 'range';
  if (thinField) return 'rangeWithRecordThin';
  if (record > range.highGross) return 'rangeRecordAbove';
  if (record < range.lowGross) return 'rangeRecordBelow';
  return 'rangeRecordInside';
}