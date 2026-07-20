import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(html);
  }
  return html;
}
