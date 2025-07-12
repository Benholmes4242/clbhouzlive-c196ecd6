/**
 * Truncates text to a specified number of words
 * @param text - The text to truncate
 * @param wordLimit - Maximum number of words to show (default: 9)
 * @returns Truncated text with ellipsis if needed
 */
export const truncateToWords = (text: string, wordLimit: number = 9): string => {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(' ') + '...';
};