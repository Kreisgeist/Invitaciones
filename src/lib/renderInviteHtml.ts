/**
 * Transform raw editor HTML for invitation display.
 * Replaces <hr> tags with ornamental dividers.
 */
export function renderInviteHtml(html: string): string {
  return html.replace(
    /<hr\s*\/?>/gi,
    '<div class="divider-ornament"><span>✦</span></div>'
  );
}
