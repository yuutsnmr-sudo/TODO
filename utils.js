// --------------------
// General helpers
// --------------------

export function generateId() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
  }
  
  export function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  
  export function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  
  export function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }
  
  export function isSameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
  
  export function formatDate(yyyyMmDd) {
    // input: "YYYY-MM-DD"
    if (!yyyyMmDd) return "";
    const [y, m, d] = yyyyMmDd.split("-").map(Number);
    if (!y || !m || !d) return yyyyMmDd;
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  }
  
  // --------------------
  // Links preview (clickable)
  // --------------------
  
  function normalizeUrl(raw) {
    const s = String(raw || "").trim();
    if (!s) return "";
    // Accept http(s) already
    if (/^https?:\/\//i.test(s)) return s;
    // Also accept mailto:
    if (/^mailto:/i.test(s)) return s;
    // If user pastes "www...." or "jira...." we prefix https://
    return `https://${s}`;
  }
  
  function isProbablyUrl(raw) {
    const s = String(raw || "").trim();
    if (!s) return false;
    if (/^https?:\/\//i.test(s)) return true;
    if (/^mailto:/i.test(s)) return true;
    // loose check: contains a dot and no spaces
    return s.includes(".") && !/\s/.test(s);
  }
  
  /**
   * Render clickable links preview under a textarea.
   * - Keeps textarea editable
   * - Preview opens links in new tab
   */
  export function renderLinksPreview(textareaEl, previewEl) {
    if (!textareaEl || !previewEl) return;
  
    const rawLines = textareaEl.value
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  
    const links = rawLines
      .filter(isProbablyUrl)
      .map((line) => ({
        label: line,
        href: normalizeUrl(line),
      }))
      .filter((x) => x.href);
  
    if (links.length === 0) {
      previewEl.innerHTML = "";
      previewEl.style.display = "none";
      return;
    }
  
    previewEl.style.display = "flex";
    previewEl.innerHTML = links
      .map(
        (l) =>
          `<a href="${escapeHtml(l.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.label)}</a>`
      )
      .join("");
  }
  