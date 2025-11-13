/**
 * Copyright 2025 andyprodistik
 * @license Apache-2.0, see License.md for full text.
 */
import { HAXCMSLitElementTheme, css, unsafeCSS, html, store, autorun, toJS } from "@haxtheweb/haxcms-elements/lib/core/HAXCMSLitElementTheme.js";
import "@haxtheweb/haxcms-elements/lib/ui-components/navigation/site-menu-button.js";
import "@haxtheweb/haxcms-elements/lib/ui-components/site/site-title.js";
import "@haxtheweb/haxcms-elements/lib/ui-components/active-item/site-active-title.js";
import "./kuis-confeti.js";

/**
 * `CustomKuisTheme`
 * `CustomKuisTheme based on HAXCMS theming ecosystem`
 * `This theme is an example of extending an existing theme component`
 *
 * @microcopy - language worth noting:
 *  - HAXcms - A headless content management system
 *  - HAXCMSLitElementTheme - A class that provides correct baseline wiring to build a new theme that HAX can use
 *
 * @documentation - see HAX docs to learn more about theming
 *  - Custom theme development - https://haxtheweb.org/documentation/developers/haxsite/custom-theme-development
 *  - Theme Blocks - https://haxtheweb.org/documentation/developers/theme-blocks
 *  - DDD - https://haxtheweb.org/documentation/ddd
 *  - Data Store - https://haxtheweb.org/documentation/developers/haxsite/data-store
 * @element custom-kuis-theme
 */
class CustomKuisTheme extends HAXCMSLitElementTheme {
  /**
   * Store the tag name to make it easier to obtain directly.
   * @notice function name must be here for tooling to operate correctly
   */
  static get tag() {
    return "custom-kuis-theme";
  }

  // set defaults or tie into the store
  constructor() {
    super();
    this._items = [];
    this.activeId = null;
    this.logo = null;
    this._onQuizResult = (e) => this.handleQuizResult(e);
    this.searchQuery = '';
    this.searchResults = [];
    this.searchOpen = false;
    this.searchIndex = null;
    this.searchLoading = false;
    this.searchError = '';
    this.selectedIndex = -1;
    autorun(() => {
      this.activeId = toJS(store.activeId);
      this._items = toJS(store.manifest.items);
      this.logo = toJS(store.manifest?.metadata?.site?.logo) || null;
      if (this.searchQuery) {
        this.filterSearch(this.searchQuery);
      }
    });
  }

  connectedCallback() {
    super.connectedCallback();
    globalThis.addEventListener('quiz-result', this._onQuizResult);
  }
  disconnectedCallback() {
    globalThis.removeEventListener('quiz-result', this._onQuizResult);
    super.disconnectedCallback();
  }

  async handleQuizResult(e) {
    try {
      const slug = e?.detail?.slug;
      const result = e?.detail?.result || {};
      if (!slug) return;
      // Update local cache map for fallback persistence
      const key = 'site.quizResults';
      const raw = localStorage.getItem(key);
      const map = raw ? JSON.parse(raw) : {};
      map[slug] = { ...result, updated: Date.now() };
      localStorage.setItem(key, JSON.stringify(map));
      // Best-effort site.json update (if backend allows)
      await this._updateSiteJson(slug, result);
    } catch (err) {
      // ignore
    }
  }

  async _updateSiteJson(slug, result) {
    try {
      const res = await fetch('./site.json', { credentials: 'same-origin' });
      if (!res.ok) return false;
      const json = await res.json();
      const items = Array.isArray(json.items) ? json.items : [];
      const it = items.find(i => (i.slug || '') === slug);
      if (!it) return false;
      it.metadata = it.metadata || {};
      it.metadata.quizResult = {
        score: result.score || 0,
        percentage: result.percentage || 0,
        finished: !!result.finished,
        updated: Date.now()
      };
      // Attempt to persist (requires server capability)
      await fetch('./site.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
        credentials: 'same-origin'
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  toggleDarkMode = (e) => {
    e?.preventDefault?.();
    document.body.classList.toggle('dark-mode');
    this.requestUpdate();
  }

  triggerConfetti = (e) => {
    e?.preventDefault?.();
    const el = this.renderRoot?.querySelector('#confetti');
    el?.fire?.();
  }

  async loadSearchIndex() {
    if (this.searchIndex || this.searchLoading) return;
    this.searchLoading = true;
    this.searchError = '';
    try {
      const res = await fetch('lunrSearchIndex.json', { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      this.searchIndex = Array.isArray(json) ? json : [];
    } catch (e) {
      this.searchError = String(e?.message || e);
      this.searchIndex = [];
    } finally {
      this.searchLoading = false;
    }
  }

  filterSearch(q) {
    const raw = (q || '').trim();
    const query = raw.toLowerCase();
    if (!query || query.length < 3) {
      this.searchResults = [];
      this.searchOpen = false;
      this.selectedIndex = -1;
      return;
    }
    if (Array.isArray(this.searchIndex) && this.searchIndex.length) {
      const results = this.searchIndex
        .map(doc => {
          const titleRaw = doc.title || '';
          const descRaw = doc.description || '';
          const textRaw = doc.text || '';
          const t = titleRaw.toLowerCase();
          const d = descRaw.toLowerCase();
          const x = textRaw.toLowerCase();
          let score = 0;
          if (t.includes(query)) score += 3 + (t.startsWith(query) ? 2 : 0);
          if (d.includes(query)) score += 2;
          const pos = x.indexOf(query);
          if (pos >= 0) score += 1;
          if (!score) return null;
          const href = this.resolveHrefForIndexDoc(doc) || '#';
          let snippet = '';
          if (pos >= 0) {
            const start = Math.max(0, pos - 40);
            const end = Math.min(textRaw.length, pos + 40);
            snippet = `${start > 0 ? '…' : ''}${textRaw.slice(start, end).replace(/\s+/g, ' ').trim()}${end < textRaw.length ? '…' : ''}`;
          }
          return { title: titleRaw || href, href, score, snippet };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      this.searchResults = results;
    } else {
      const items = Array.isArray(this._items) ? this._items : [];
      this.searchResults = items
        .filter(it => {
          const t = (it.title || '').toLowerCase();
          const s = (it.slug || '').toLowerCase();
          return t.includes(query) || s.includes(query);
        })
        .slice(0, 10)
        .map(it => ({ title: it.title || it.slug, href: it.slug }));
    }
    this.searchOpen = this.searchResults.length > 0;
    this.selectedIndex = this.searchOpen ? 0 : -1;
  }

  resolveHrefForIndexDoc(doc) {
    const loc = doc?.location || '';
    if (!loc || !Array.isArray(this._items)) return null;
    const match = this._items.find(it => (it.location || '').includes(loc));
    return match ? match.slug : null;
  }

  escapeRegExp(str = '') {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  highlightTemplate(str = '', q = '') {
    if (!q) return str;
    const r = new RegExp(`(${this.escapeRegExp(q)})`, 'ig');
    const parts = String(str).split(r);
    const lowerQ = q.toLowerCase();
    return parts.map(part => part.toLowerCase() === lowerQ ? html`<mark>${part}</mark>` : part);
  }

  onSearchInput = (e) => {
    this.searchQuery = e?.target?.value || '';
    if (!this.searchIndex && !this.searchLoading) {
      this.loadSearchIndex().then(() => this.filterSearch(this.searchQuery));
    } else {
      this.filterSearch(this.searchQuery);
    }
  }

  onSearchKeydown = (e) => {
    const len = this.searchResults ? this.searchResults.length : 0;
    if (e.key === 'Escape') {
      this.searchOpen = false;
      this.selectedIndex = -1;
      e.target.blur();
    } else if (e.key === 'ArrowDown' && len) {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1 + len) % len;
      this.searchOpen = true;
      this.requestUpdate();
      this.scrollActiveIntoView();
    } else if (e.key === 'ArrowUp' && len) {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + len) % len;
      this.searchOpen = true;
      this.requestUpdate();
      this.scrollActiveIntoView();
    } else if (e.key === 'Enter') {
      const target = (len && this.selectedIndex >= 0) ? this.searchResults[this.selectedIndex] : (this.searchResults && this.searchResults[0]);
      if (target && target.href) {
        window.location.href = target.href;
      }
    }
  }

  scrollActiveIntoView() {
    const links = this.renderRoot?.querySelectorAll('.search-results a');
    if (!links || this.selectedIndex < 0 || this.selectedIndex >= links.length) return;
    const el = links[this.selectedIndex];
    el?.scrollIntoView?.({ block: 'nearest' });
  }


  // properties to respond to the activeID and list of items
  static get properties() {
    return {
      ...super.properties,
      activeId: { type: String },
      _items: { type: Array },
      logo: { type: String },
      searchQuery: { type: String },
      searchResults: { type: Array },
      searchOpen: { type: Boolean },
      searchIndex: { type: Array },
      searchLoading: { type: Boolean },
      searchError: { type: String },
      selectedIndex: { type: Number },
    };
  }

  // allows for global styles to be set against the entire document
  // you can also use this to cascade styles down to the theme
  // but the more common reason is to influence the body or other things
  // put into the global index.html context by the system itself
  HAXCMSGlobalStyleSheetContent() {
    return [
      ...super.HAXCMSGlobalStyleSheetContent(),
      css`
      :root {
        --my-theme-low-tone: var(--ddd-theme-default-slateMaxLight);
        --my-theme-high-tone: var(--ddd-theme-default-coalyGray);
      }
      body {
        padding: var(--ddd-spacing-0);
        margin: var(--ddd-spacing-0);
        background-color: var(--my-theme-low-tone);
      }
      body.dark-mode {
        background-color: var(--my-theme-high-tone);
      }
      `,
    ];
  }

  //styles function
  static get styles() {
    return [
      super.styles,
      css`
        :host {
          display: block;
          padding: var(--ddd-spacing-10) var(--ddd-spacing-20);
          max-width: 1200px;
          min-width: 320px;
          margin: var(--ddd-spacing-0) auto;
          border: var(--ddd-border-lg);
          border-width: var(--ddd-spacing-5);
          border-radius: var(--ddd-radius-lg);
          background-color: light-dark(var(--my-theme-low-tone), var(--my-theme-high-tone));
          color: light-dark(var(--my-theme-high-tone), var(--my-theme-low-tone));
        }
        .wrapper {
          border-radius: var(--ddd-radius-lg);
        }

        /* Modern site header */
        .site-header {
          position: sticky;
          top: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--ddd-spacing-4);
          padding: var(--ddd-spacing-4) var(--ddd-spacing-6);
          border-radius: calc(var(--ddd-radius-lg) - var(--ddd-spacing-2));
          background:
            linear-gradient(
              180deg,
              light-dark(
                color-mix(in oklab, var(--my-theme-low-tone) 92%, transparent),
                color-mix(in oklab, var(--my-theme-high-tone) 92%, transparent)
              ),
              light-dark(
                color-mix(in oklab, var(--my-theme-low-tone) 86%, transparent),
                color-mix(in oklab, var(--my-theme-high-tone) 86%, transparent)
              )
            );
          backdrop-filter: blur(8px);
          box-shadow: 0 6px 24px rgba(0,0,0,.08), inset 0 0 0 1px rgba(255,255,255,.05);
        }
        .brand {
          display: flex;
          align-items: center;
          gap: var(--ddd-spacing-3);
          min-width: 0;
        }
        .brand site-title {
          font-size: var(--ddd-font-size-xl);
          font-weight: 700;
          letter-spacing: .2px;
          white-space: nowrap;
        }
        .logo {
          height: 32px;
          width: auto;
          inline-size: auto;
          block-size: 32px;
          border-radius: 6px;
          object-fit: cover;
          box-shadow: 0 1px 2px rgba(0,0,0,.12);
        }
        .nav-scroll {
          flex: 1 1 auto;
          min-width: 0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: color-mix(in oklab, currentColor 40%, transparent) transparent;
        }
        .chips {
          display: inline-flex;
          align-items: center;
          gap: var(--ddd-spacing-2);
        }
        .chips ul { 
          display: inline-flex;
          align-items: center;
          gap: var(--ddd-spacing-2);
          margin: 0; padding: 0;
          list-style: none;
        }
        .chips li { display: inline-flex; }
        .chip-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 34px;
          min-width: 34px;
          padding: 0 var(--ddd-spacing-3);
          border-radius: 999px;
          border: 1px solid color-mix(in oklab, currentColor 20%, transparent);
          background: transparent;
          color: currentColor;
          font-size: var(--ddd-font-size-sm);
          line-height: 1;
          transition: background .2s ease, color .2s ease, border-color .2s ease;
          cursor: pointer;
          text-decoration: none;
        }
        .chip-btn:hover {
          background: color-mix(in oklab, currentColor 8%, transparent);
        }
        .active .chip-btn {
          background: light-dark(var(--my-theme-low-tone), var(--my-theme-high-tone));
          color: light-dark(var(--my-theme-high-tone), var(--my-theme-low-tone));
          border-color: transparent;
          font-weight: 700;
        }
        .actions {
          display: flex;
          align-items: center;
          gap: var(--ddd-spacing-2);
        }
        .icon-btn {
          height: 36px;
          width: 36px;
          display: inline-grid;
          place-items: center;
          border-radius: 50%;
          border: 1px solid color-mix(in oklab, currentColor 20%, transparent);
          background: transparent;
          color: currentColor;
          cursor: pointer;
        }
        .icon-btn:hover {
          background: color-mix(in oklab, currentColor 8%, transparent);
        }
        site-menu-button {
          display: inline-block;
          vertical-align: middle;
        }

        /* Search styles */
        .search { position: relative; min-width: 180px; }
        .search input[type="search"] {
          height: 36px;
          padding: 0 var(--ddd-spacing-3);
          border-radius: 999px;
          border: 1px solid color-mix(in oklab, currentColor 20%, transparent);
          background: transparent;
          color: currentColor;
          outline: none;
          width: min(300px, 30vw);
        }
        .search-results {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          max-height: 300px;
          overflow: auto;
          padding: var(--ddd-spacing-2);
          margin: 0;
          list-style: none;
          border-radius: 12px;
          background: light-dark(
            color-mix(in oklab, var(--my-theme-low-tone) 94%, transparent),
            color-mix(in oklab, var(--my-theme-high-tone) 94%, transparent)
          );
          box-shadow: 0 12px 32px rgba(0,0,0,.18);
          z-index: 20;
        }
        .search-results li { margin: 0; }
        .search-results a {
          display: block;
          padding: 8px 10px;
          border-radius: 8px;
          color: inherit;
          text-decoration: none;
        }
        .search-results a:hover {
          background: color-mix(in oklab, currentColor 8%, transparent);
        }
        .search-results li.active a { background: color-mix(in oklab, currentColor 12%, transparent); }
        .search-results .result-title { font-weight: 600; }
        .search-results .snippet { font-size: var(--ddd-font-size-sm); opacity: .8; line-height: 1.3; }
        .search-results mark { background: color-mix(in oklab, currentColor 20%, transparent); color: inherit; padding: 0 2px; border-radius: 2px; }
      `,
    ];
  }

  render() {
    return html`
      <div class="wrapper">
        <kuis-confeti id="confetti"></kuis-confeti>
        <header class="site-header">
          <div class="brand">
            <site-menu-button type="prev" position="top"></site-menu-button>
            ${this.logo ? html`<img class="logo" src="${this.logo}" alt="Logo" />` : ''}
            <site-title></site-title>
          </div>
          <div class="nav-scroll">
            <nav class="chips" aria-label="Halaman">
              <ul>
                ${this._items.map((item, index) => html`
                  <li class="${item.id === this.activeId ? 'active' : ''}">
                    <a class="chip-btn" href="${item.slug}" title="${item.title}">${index + 1}</a>
                  </li>
                `)}
              </ul>
            </nav>
          </div>
          <div class="actions">
            <div class="search" @keydown="${this.onSearchKeydown}">
              <input
                type="search"
                placeholder="Cari halaman..."
                aria-label="Cari halaman"
                @input="${this.onSearchInput}"
                @keydown="${this.onSearchKeydown}"
                aria-activedescendant="${this.selectedIndex >= 0 ? `search-opt-${this.selectedIndex}` : ''}"
                .value="${this.searchQuery || ''}"
              />
              ${this.searchOpen && this.searchResults?.length ? html`
                <ul class="search-results" role="listbox">
                  ${this.searchResults.map((it, idx) => html`
                    <li class="${this.selectedIndex === idx ? 'active' : ''}" role="option" aria-selected="${this.selectedIndex === idx}">
                      <a id="search-opt-${idx}" href="${it.href}" @mouseenter="${() => { this.selectedIndex = idx; }}" @click="${() => { this.searchOpen = false; }}">
                        <div class="result-title">${this.highlightTemplate(it.title, this.searchQuery)}</div>
                        ${it.snippet ? html`<div class="snippet">${this.highlightTemplate(it.snippet, this.searchQuery)}</div>` : ''}
                      </a>
                    </li>
                  `)}
                </ul>
              ` : ''}
            </div>
            <button class="icon-btn" title="Confetti" @click="${this.triggerConfetti}" aria-label="Rayakan">🎊</button>
            <button class="icon-btn" title="Toggle mode" @click="${this.toggleDarkMode}" aria-label="Ubah mode">
              ${document?.body?.classList?.contains('dark-mode') ? '☀' : '🌙'}
            </button>
            <site-menu-button type="next" position="top"></site-menu-button>
          </div>
        </header>
        <main>
          <site-active-title></site-active-title>
          <article>
            <!-- this block and names are required for HAX to edit the content of the page. contentcontainer, slot, and wrapping the slot. -->
            <div id="contentcontainer"><div id="slot"><slot></slot></div></div>
          </article>
        </main>
        <footer>
          <slot name="footer"></slot>
        </footer>
      </div>
    `;
  }

}
globalThis.customElements.define(CustomKuisTheme.tag, CustomKuisTheme);
export { CustomKuisTheme };
