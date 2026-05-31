/**
 * Input sanitization utilities for XSS prevention and data safety.
 */

/**
 * Strip HTML tags from a string to prevent XSS.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Escape HTML entities for safe rendering in non-React contexts.
 */
export function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return input.replace(/[&<>"']/g, (c) => map[c] || c);
}

/**
 * Remove null bytes and control characters from input.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/\0/g, '')                        // null bytes
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, '') // control chars (keep \n, \r, \t)
    .trim();
}

/**
 * Validate and sanitize a URL to prevent javascript: and data: injection.
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Truncate string to max length, adding ellipsis if needed.
 */
export function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return input.slice(0, maxLength - 1) + '…';
}
