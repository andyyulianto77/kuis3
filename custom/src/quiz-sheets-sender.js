import { LitElement, html } from 'https://cdn.jsdelivr.net/npm/lit@3.1.4/+esm';

class QuizSheetsSender extends LitElement {
    static properties = {
        webAppUrl: { type: String, attribute: 'web-app-url' },
        listen: { type: Boolean, reflect: true },
        lastStatus: { type: String, state: true },
    };

    constructor() {
        super();
        this.webAppUrl = '';
        this.listen = true;
        this.lastStatus = '';
        this._onFinished = this._onFinished.bind(this);
        this._lastSentId = null;
    }

    connectedCallback() {
        super.connectedCallback();
        if (this.listen) {
            window.addEventListener('quiz-finished', this._onFinished);
        }
    }

    disconnectedCallback() {
        if (this.listen) {
            window.removeEventListener('quiz-finished', this._onFinished);
        }
        super.disconnectedCallback();
    }

    render() {
        return html`<span aria-hidden="true" style="display:none">${this.lastStatus}</span>`;
    }

    async _onFinished(e) {
        if (!this.webAppUrl) {
            this.lastStatus = 'No webAppUrl configured; skipping send.';
            return;
        }
        try {
            const detail = e.detail || {};
            const result = detail.result || {};
            const user = detail.user || {};
            const iddata = String(result.finished ? (result.score + '-' + (result.total || 0) + '-' + (user.name || '') + '-' + (user.phone || '') + '-' + (user.address || '') + '-' + (detail.slug || '') + '-' + Date.now()) : Date.now());
            if (this._lastSentId === iddata) {
                return;
            }
            this._lastSentId = iddata;
            const params = new URLSearchParams({
                action: 'tambah',
                iddata,
                namaorng: user.name || 'Anonymous',
                nilai: String(result.score || 0),
                nope: user.phone || '',
                alamatorng: user.address || '',
                keterangan: `Kuis: ${detail.slug || ''} - ${result.percentage || 0}% (${result.score || 0}/${result.total || 0})`
            });
            console.log('[quiz-sheets-sender] Sending:', this.webAppUrl, params.toString());
            await fetch(this.webAppUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params,
                mode: 'no-cors'
            });
            this.lastStatus = 'Sent to Google Sheets';
        } catch (err) {
            this.lastStatus = `Failed: ${String(err)}`;
            console.error('[quiz-sheets-sender] Error:', err);
        }
    }
}

customElements.define('quiz-sheets-sender', QuizSheetsSender);