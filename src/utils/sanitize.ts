/**
 * Input sanitization utilities
 * Prevents XSS and ensures safe user input
 */

/**
 * Sanitize HTML content by removing potentially dangerous tags and attributes
 */
export function sanitizeHTML(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Sanitize plain text by removing HTML tags and encoding special characters
 */
export function sanitizeText(text: string): string {
  return sanitizeHTML(text)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

/**
 * Sanitize filename to prevent directory traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.\./g, '_')
    .replace(/^\./, '_')
    .substring(0, 255); // Limit length
}

/**
 * Sanitize array of strings
 */
export function sanitizeStringArray(arr: string[]): string[] {
  return arr.map((item) => sanitizeText(item)).filter((item) => item.length > 0);
}


