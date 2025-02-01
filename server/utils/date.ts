/**
 * Parse a date string or Date object to ISO string
 */
export function parseDate(dateString: string | Date | null): string | null {
  if (!dateString) return null;
  
  try {
    if (dateString instanceof Date) {
      return dateString.toISOString();
    }
    const date = new Date(dateString);
    return date.toISOString();
  } catch (error) {
    console.error('Date parsing error:', error);
    return null;
  }
}

/**
 * Format a date for consistent output
 */
export function formatDate(date: Date | string | null): string | null {
  if (!date) return null;
  
  try {
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    return parsedDate.toISOString();
  } catch (error) {
    console.error('Date formatting error:', error);
    return null;
  }
}
