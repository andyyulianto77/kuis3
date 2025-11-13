/**
 * Copyright 2025 Andy Y
 * @license Apache-2.0, see License.md for full text.
 */
import { html, css, HAXCMSLitElementTheme, unsafeCSS, store, autorun, toJS } from "@haxtheweb/haxcms-elements/lib/core/HAXCMSLitElementTheme.js";
import { LitElement } from 'https://cdn.jsdelivr.net/npm/lit@3.1.4/+esm';
import { PolarisFlexTheme } from "@haxtheweb/polaris-theme/lib/polaris-flex-theme.js";
import "@haxtheweb/haxcms-elements/lib/ui-components/blocks/site-children-block.js";
import "@haxtheweb/haxcms-elements/lib/ui-components/navigation/site-menu-button.js";
import "@haxtheweb/haxcms-elements/lib/ui-components/site/site-title.js";
import "@haxtheweb/haxcms-elements/lib/ui-components/active-item/site-active-title.js";

/**
 * Kuis Confeti Component
 */
class ConfettiQuiz extends LitElement {
    static properties = {
        message: { type: String },
        isCorrect: { type: Boolean },
        isDisabled: { type: Boolean },
        isChecked: { type: Boolean },
        currentQuestionIndex: { type: Number },
        showSummary: { type: Boolean },
        showIntroForm: { type: Boolean },
        questionsAttr: { type: String, attribute: 'questions' },
        kuisAttr: { type: String, attribute: 'kuis' },
        autoloadResults: { type: Boolean, attribute: 'autoload-results', reflect: true },
        externalSummary: { type: Object },
        externalLoaded: { type: Boolean },
        userName: { type: String, attribute: 'user-name' },
        userPhone: { type: String, attribute: 'user-phone' },
        userAddress: { type: String, attribute: 'user-address' },
    };

    constructor() {
        super();
        this.message = '';
        this.isCorrect = false;
        this.isDisabled = false;
        this.isChecked = false;
        this.currentQuestionIndex = 0;
        this.showSummary = false;
        this.showIntroForm = true;
        this.questionsAttr = '';
        this.kuisAttr = '';
        this.autoloadResults = true;
        this.questions = [];
        this.externalSummary = null;
        this.externalLoaded = false;
        this.userName = '';
        this.userPhone = '';
        this.userAddress = '';
        this.defaultQuestions = [
            { question: "Siapakah presiden pertama Indonesia?", answer: "soekarno" },
        ];
        this.userAnswers = [];
        this.correctAnswers = [];
    }

    connectedCallback() {
        super.connectedCallback();
        const raw = this.getAttribute('questions') || this.getAttribute('kuis') || '';
        const parsed = this._parseQuestions(raw);
        if (parsed && parsed.length) {
            this.questions = parsed;
        }
        if (!this.questions || !this.questions.length) {
            this.questions = this.defaultQuestions.slice();
        }
        this._resetQuizState();
    }

    async firstUpdated() {
        if (this.autoloadResults) {
            const saved = this._loadResults();
            if (saved && Array.isArray(saved.userAnswers) && Array.isArray(saved.correctAnswers) && Array.isArray(saved.questions)) {
                this.questions = saved.questions;
                this.userAnswers = saved.userAnswers;
                this.correctAnswers = saved.correctAnswers;
                this.currentQuestionIndex = Math.min(saved.currentQuestionIndex || 0, Math.max(0, this.questions.length - 1));
                const finished = Array.isArray(this.userAnswers) && this.userAnswers.length >= this.questions.length && this.correctAnswers.length >= this.questions.length;
                this.showSummary = !!saved.showSummary || finished;
                if (this.showSummary) this.isDisabled = true;
            }
        }
        await this._loadFromSiteJson();
    }

    updated(changed) {
        if (changed.has('questionsAttr') || changed.has('kuisAttr')) {
            this._applyAttrQuestions();
        }
    }

    _applyAttrQuestions() {
        const parsedPrimary = this._parseQuestions(this.questionsAttr);
        const parsedAlias = this._parseQuestions(this.kuisAttr);
        const parsed = parsedPrimary && parsedPrimary.length ? parsedPrimary : (parsedAlias && parsedAlias.length ? parsedAlias : null);
        if (parsed && parsed.length) {
            this.questions = parsed;
        }
        if (!this.questions || !this.questions.length) {
            this.questions = this.defaultQuestions.slice();
        }
        this._resetQuizState();
    }

    _parseQuestions(str) {
        if (!str || typeof str !== 'string') return null;
        try {
            const data = JSON.parse(str);
            if (Array.isArray(data)) {
                return data
                    .map(x => ({
                        question: String(x.question || '').trim(),
                        answer: String(x.answer || '').trim().toLowerCase(),
                    }))
                    .filter(x => x.question && x.answer);
            }
        } catch (e) {}
        return null;
    }

    get currentQuestion() { return this.questions[this.currentQuestionIndex]; }
    get totalQuestions() { return this.questions.length; }

    static styles = css`
        :host {
            display: block;
            color: #1f2937;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        .card {
            background-color: white;
            border-radius: 1rem;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            width: 100%;
            padding: 2rem;
            box-sizing: border-box;
            color: #1f2937;
        }
        .card h1 {
            color: #1e40af;
            font-size: 1.875rem;
            font-weight: 700;
            text-align: center;
            margin: 0 0 1.5rem 0;
        }
        .progress-bar {
            width: 100%;
            height: 8px;
            background-color: #e5e7eb;
            border-radius: 4px;
            margin-bottom: 1.5rem;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background-color: #3b82f6;
            transition: width 0.3s ease;
        }
        .question-number {
            color: #6b7280;
            font-size: 0.875rem;
            margin-bottom: 0.5rem;
        }
        .card p {
            color: #1f2937;
            font-size: 1.125rem;
            font-weight: 500;
            margin-bottom: 0.75rem;
            line-height: 1.6;
        }
        .correct-answer {
            background-color: #d1fae5;
            color: #065f46;
            padding: 0.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
        }
        .wrong-answer {
            background-color: #fee2e2;
            color: #991b1b;
            padding: 0.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
        }
        .check-button, .nav-button {
            transition: all 0.15s;
        }
        .check-button:not([disabled]):hover, .nav-button:not([disabled]):hover {
            background-color: #1d4ed8;
            transform: scale(1.01);
        }
        .check-button[disabled], .nav-button[disabled] {
            background-color: #9ca3af;
            cursor: not-allowed;
        }
        .nav-buttons {
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;
        }
        .nav-button {
            flex: 1;
            padding: 0.75rem;
            font-weight: 600;
            border-radius: 0.5rem;
            border: none;
            cursor: pointer;
            background-color: #6b7280;
            color: white;
            font-size: 0.875rem;
        }
        .nav-button.primary {
            background-color: #3b82f6;
            color: white;
        }
        .nav-button:disabled {
            color: white;
            opacity: 0.7;
        }
        #answer-input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #d1d5db;
            border-radius: 0.5rem;
            font-size: 1rem;
            color: #1f2937;
            background-color: white;
            box-sizing: border-box;
        }
        #answer-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        #answer-input:disabled {
            background-color: #f3f4f6;
            color: #6b7280;
            cursor: not-allowed;
        }
        #check-button {
            width: 100%;
            margin-top: 1rem;
            padding: 0.75rem;
            font-weight: 600;
            border-radius: 0.5rem;
            border: none;
            font-size: 1rem;
        }
        .summary {
            text-align: center;
        }
        .summary-score {
            font-size: 3rem;
            font-weight: bold;
            color: #3b82f6;
            margin: 1rem 0;
        }
        .summary-item {
            padding: 0.75rem;
            margin: 0.5rem 0;
            border-radius: 0.5rem;
            text-align: left;
        }
        .summary-item.correct {
            background-color: #d1fae5;
            border-left: 4px solid #10b981;
        }
        .summary-item.incorrect {
            background-color: #fee2e2;
            border-left: 4px solid #ef4444;
            color: #991b1b;
        }
        .summary-item.correct {
            color: #065f46;
        }
        .summary h1 {
            color: #1e40af;
            font-size: 1.875rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 1rem;
        }
        .summary h2 {
            color: #1f2937;
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1rem;
        }
        .intro {
            display: grid;
            gap: 0.75rem;
        }
        .intro input, .intro textarea {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #d1d5db;
            border-radius: 0.5rem;
            font-size: 1rem;
            color: #1f2937;
            box-sizing: border-box;
        }
        .intro button {
            padding: 0.75rem;
            border-radius: 0.5rem;
            border: none;
            background-color: #2563eb;
            color: white;
            font-weight: 600;
            cursor: pointer;
        }
        .intro button:hover {
            background-color: #1d4ed8;
        }
    `;

    _resetQuizState() {
        this.currentQuestionIndex = 0;
        this.showSummary = false;
        this.message = '';
        this.isCorrect = false;
        this.isDisabled = false;
        this.isChecked = false;
        this.userAnswers = [];
        this.correctAnswers = [];
    }

    launchConfetti() {
        const overlay = document.getElementById('confetti') || document.querySelector('kuis-confeti');
        if (overlay && typeof overlay.fire === 'function') {
            overlay.fire({ duration: 2000, particleCount: 220 });
            return;
        }
        if (window.confetti) {
            window.confetti({
                particleCount: 200,
                spread: 150, 
                angle: 90,
                startVelocity: 60,
                origin: { x: 0.5, y: 0.7 },
                colors: ['#4ade80', '#22c55e', '#10b981', '#1a73e8', '#f97316']
            });
        }
    }

    _storageKey() {
        try { return `confetti-quiz:${location.pathname}`; } catch (e) { return 'confetti-quiz'; }
    }
    _saveResults() {
        try {
            const payload = {
                questions: this.questions,
                userAnswers: this.userAnswers,
                correctAnswers: this.correctAnswers,
                currentQuestionIndex: this.currentQuestionIndex,
                showSummary: this.showSummary,
                score: this.getScore(),
                percentage: this.getPercentage(),
                savedAt: Date.now(),
                userName: this.userName,
                userPhone: this.userPhone,
                userAddress: this.userAddress,
            };
            localStorage.setItem(this._storageKey(), JSON.stringify(payload));
        } catch (e) {}
    }
    _loadResults() {
        try {
            const raw = localStorage.getItem(this._storageKey());
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) { return null; }
    }
    clearResults() {
        try { localStorage.removeItem(this._storageKey()); } catch (e) {}
        this.externalSummary = null;
        this.externalLoaded = false;
    }

    _currentSlug() {
        try {
            const p = location.pathname.replace(/\/+$/, '');
            const seg = decodeURIComponent(p.split('/').filter(Boolean).pop() || 'welcome');
            return seg;
        } catch(e) { return 'welcome'; }
    }

    async _loadFromSiteJson() {
        try {
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                return;
            }
            const res = await fetch('../site.json', { credentials: 'same-origin' });
            if (!res.ok) return;
            const site = await res.json();
            const slug = this._currentSlug();
            const items = Array.isArray(site.items) ? site.items : [];
            const it = items.find(x => (x.slug || '') === slug);
            const meta = (it && it.metadata) ? it.metadata : null;
            const q = meta && (meta.quiz || meta.quizResult);
            if (q && (q.finished || typeof q.score === 'number')) {
                const total = Array.isArray(this.questions) && this.questions.length ? this.questions.length : (q.total || 0);
                this.externalSummary = { score: q.score || 0, percentage: q.percentage || 0, total };
                this.externalLoaded = true;
                this.showSummary = true;
                this.isDisabled = true;
                this.showIntroForm = false;
            }
        } catch (e) {
        }
    }

    _handleIntroSubmit(e) {
        e.preventDefault();
        const form = this.renderRoot.querySelector('#intro-form');
        if (!form) return;
        const name = form.querySelector('#user-name')?.value?.trim() || '';
        const phone = form.querySelector('#user-phone')?.value?.trim() || '';
        const address = form.querySelector('#user-address')?.value?.trim() || '';
        this.userName = name;
        this.userPhone = phone;
        this.userAddress = address;
        this.showIntroForm = false;
        this._resetQuizState();
        this._saveResults();
    }

    _emitFinished(result) {
        try {
            const detail = {
                slug: this._currentSlug(),
                result,
                user: {
                    name: this.userName,
                    phone: this.userPhone,
                    address: this.userAddress,
                }
            };
            this.dispatchEvent(new CustomEvent('quiz-finished', { detail, bubbles: true, composed: true }));
        } catch (e) {}
    }

    checkAnswer() {
        const inputElement = this.shadowRoot.getElementById('answer-input');
        const userAnswer = inputElement.value.trim().toLowerCase();
        const correctAnswer = this.currentQuestion.answer.toLowerCase();

        this.message = '';
        this.userAnswers[this.currentQuestionIndex] = userAnswer;
        this.isChecked = true;

        if (userAnswer === correctAnswer) {
            this.isCorrect = true;
            this.correctAnswers[this.currentQuestionIndex] = true;
            this.message = '🎉 Benar! Jawaban Anda tepat. Selamat!';
            this.isDisabled = true;
            this.launchConfetti();
        } else {
            this.isCorrect = false;
            this.correctAnswers[this.currentQuestionIndex] = false;
            this.message = `❌ Salah. Jawaban yang benar adalah: "${this.currentQuestion.answer}"`;
        }
        this._saveResults();
        const result = { score: this.getScore(), percentage: this.getPercentage(), finished: false };
        this.dispatchEvent(new CustomEvent('quiz-result', { detail: { slug: this._currentSlug(), result }, bubbles: true, composed: true }));
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.totalQuestions - 1) {
            this.currentQuestionIndex++;
            this.message = '';
            this.isCorrect = false;
            this.isDisabled = false;
            this.isChecked = this.userAnswers[this.currentQuestionIndex] !== undefined;
            const inputElement = this.shadowRoot.getElementById('answer-input');
            if (inputElement) inputElement.value = this.userAnswers[this.currentQuestionIndex] || '';
        } else {
            this.showSummary = true;
            this._saveResults();
            const result = { score: this.getScore(), percentage: this.getPercentage(), finished: true, total: this.totalQuestions };
            this._emitFinished(result);
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.message = '';
            this.isCorrect = this.correctAnswers[this.currentQuestionIndex] || false;
            this.isDisabled = !!this.correctAnswers[this.currentQuestionIndex];
            this.isChecked = this.userAnswers[this.currentQuestionIndex] !== undefined;
            const inputElement = this.shadowRoot.getElementById('answer-input');
            if (inputElement) inputElement.value = this.userAnswers[this.currentQuestionIndex] || '';
            if (this.userAnswers[this.currentQuestionIndex]) {
                if (this.isCorrect) this.message = '✅ Jawaban Anda benar!';
                else this.message = `❌ Jawaban yang benar: "${this.questions[this.currentQuestionIndex].answer}"`;
            }
        }
    }

    restartQuiz() {
        this.clearResults();
        this.showIntroForm = true;
        this._resetQuizState();
    }

    getScore() { return this.correctAnswers.filter(c => c === true).length; }
    getPercentage() { return Math.round((this.getScore() / this.totalQuestions) * 100); }

    handleKeyPress(e) {
        if (e.key === 'Enter' && !this.isDisabled) {
            this.checkAnswer();
        }
    }

    renderIntroForm() {
        return html`
            <div class="card">
                <h1>Mulai Kuis</h1>
                <form id="intro-form" class="intro" @submit=${this._handleIntroSubmit}>
                    <div>
                        <label for="user-name">Nama</label>
                        <input id="user-name" type="text" placeholder="Nama Anda" required .value=${this.userName || ''}>
                    </div>
                    <div>
                        <label for="user-phone">No. HP</label>
                        <input id="user-phone" type="tel" placeholder="08xxxxxxxxxx" .value=${this.userPhone || ''}>
                    </div>
                    <div>
                        <label for="user-address">Alamat</label>
                        <textarea id="user-address" rows="3" placeholder="Alamat Anda (optional)">${this.userAddress || ''}</textarea>
                    </div>
                    <button type="submit">Mulai Kuis</button>
                </form>
            </div>
        `;
    }

    render() {
        if (!this.questions || !this.questions.length) {
            return html`<div class="card"><h1>Kuis</h1><p>Tidak ada soal.</p></div>`;
        }
        if (this.showIntroForm) {
            return this.renderIntroForm();
        }
        if (this.showSummary) {
            return this.renderSummary();
        }

        const messageClass = this.isCorrect ? 'correct-answer' : 'wrong-answer';
        const progress = ((this.currentQuestionIndex + 1) / this.totalQuestions) * 100;
        const scoreNow = this.getScore();
        const percentageNow = this.getPercentage();
        const isLastQuestion = this.currentQuestionIndex === this.totalQuestions - 1;
        const hasAnswered = this.userAnswers[this.currentQuestionIndex] !== undefined;

        return html`
            <div class="card">
                <h1>Kuis Pengetahuan Umum</h1>
                <div style="text-align:center;color:#6b7280;margin-top:.25rem;margin-bottom:.5rem">
                    Nilai: ${scoreNow} / ${this.totalQuestions} (${percentageNow}%)
                </div>

                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>

                <div id="quiz-area">
                    <div class="question-number">Soal ${this.currentQuestionIndex + 1} dari ${this.totalQuestions}</div>

                    <p>${this.currentQuestionIndex + 1}. ${this.currentQuestion.question}</p>

                    <input
                        type="text"
                        id="answer-input"
                        placeholder="Tulis jawaban Anda di sini..."
                        ?disabled=${this.isDisabled}
                        @keypress=${this.handleKeyPress}
                        .value=${this.userAnswers[this.currentQuestionIndex] || ''}
                    />

                    <button
                        id="check-button"
                        @click=${this.checkAnswer}
                        ?disabled=${this.isDisabled}
                        style="background-color: ${this.isDisabled ? '#9ca3af' : '#2563eb'}; color: white; cursor: ${this.isDisabled ? 'not-allowed' : 'pointer'};"
                    >
                        Cek Jawaban
                    </button>

                    <div id="message-box" style="margin-top: 1rem; text-align: center; min-height: 40px;">
                        ${this.message ? html`<div class=${messageClass}>${this.message}</div>` : ''}
                    </div>

                    <div class="nav-buttons">
                        <button
                            class="nav-button"
                            @click=${this.previousQuestion}
                            ?disabled=${this.currentQuestionIndex === 0}
                            style="background-color: ${this.currentQuestionIndex === 0 ? '#9ca3af' : '#6b7280'}; color: white;"
                        >
                            ← Sebelumnya
                        </button>
                        <button
                            class="nav-button primary"
                            @click=${this.nextQuestion}
                            ?disabled=${!this.isChecked}
                            aria-disabled=${!this.isChecked}
                            style="background-color: ${this.isChecked ? '#2563eb' : '#9ca3af'}; color: white;"
                        >
                            ${isLastQuestion ? 'Lihat Hasil' : 'Selanjutnya →'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderSummary() {
        const ext = this.externalSummary;
        const score = ext ? ext.score : this.getScore();
        const percentage = ext ? ext.percentage : this.getPercentage();
        const total = ext ? (ext.total || this.totalQuestions) : this.totalQuestions;
        const isPerfect = score === total;

        return html`
            <div class="card">
                <div class="summary">
                    <h1>Hasil Kuis</h1>

                    <div class="summary-score">${score} / ${total}</div>

                    <div style="font-size: 1.5rem; color: #6b7280; margin-bottom: 2rem;">
                        ${percentage}% Benar
                    </div>

                    ${isPerfect ? html`
                        <div style="color: #10b981; font-size: 1.25rem; margin-bottom: 1rem;">
                            🎉 Sempurna! Semua jawaban benar!
                        </div>
                    ` : ''}

                    <button
                        class="nav-button primary"
                        @click=${this.restartQuiz}
                        style="margin-top: 2rem; width: 100%; padding: 1rem; font-size: 1.125rem; color: white;"
                    >
                        Ulangi Kuis
                    </button>
                </div>
            </div>
        `;
    }
}

customElements.define('confetti-quiz', ConfettiQuiz);

/* Confetti Overlay */
class KuisConfeti extends LitElement {
    static properties = { running: { type: Boolean, reflect: true }, duration: { type: Number }, particleCount: { type: Number } };
    static styles = css`
        :host { position: fixed; inset: 0; pointer-events: none; display: block; z-index: 9999; }
        canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
    `;
    constructor() {
        super();
        this.running = false;
        this.duration = 1500;
        this.particleCount = 180;
        this._particles = [];
        this._endAt = 0;
    }
    render() { return html`<canvas part="canvas" aria-hidden="true"></canvas>`; }
    firstUpdated() {
        this._canvas = this.renderRoot.querySelector('canvas');
        this._ctx = this._canvas.getContext('2d');
        const resize = () => {
            const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
            this._canvas.width = Math.floor(this.clientWidth * dpr);
            this._canvas.height = Math.floor(this.clientHeight * dpr);
            this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        this._resize = resize;
        resize();
        window.addEventListener('resize', resize, { passive: true });
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('resize', this._resize);
        cancelAnimationFrame(this._raf);
    }
    fire(opts = {}) {
        const cs = getComputedStyle(document.documentElement);
        const colors = [
            cs.getPropertyValue('--ddd-theme-default-skyBlue')?.trim() || '#3da9fc',
            cs.getPropertyValue('--ddd-theme-default-accent')?.trim() || '#ef4565',
            cs.getPropertyValue('--ddd-theme-default-link')?.trim() || '#6246ea',
            cs.getPropertyValue('--ddd-theme-default-lime')?.trim() || '#84cc16',
            cs.getPropertyValue('--ddd-theme-default-warning')?.trim() || '#f59e0b',
        ];
        const width = this.clientWidth || window.innerWidth;
        const height = this.clientHeight || window.innerHeight;
        const count = opts.particleCount ?? this.particleCount;
        const spread = Math.PI / 2;
        const angle = -Math.PI / 2;
        const speed = 6;
        this._particles = new Array(count).fill(0).map(() => {
            const theta = angle + (Math.random() - 0.5) * spread;
            const vx = Math.cos(theta) * (speed * (0.6 + Math.random() * 0.8));
            const vy = Math.sin(theta) * (speed * (0.6 + Math.random() * 0.8));
            return { x: width / 2, y: height * 0.85, vx, vy, g: 0.18 + Math.random() * 0.22, w: 6 + Math.random() * 6, h: 8 + Math.random() * 6, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3, color: colors[Math.floor(Math.random() * colors.length)], alpha: 1 };
        });
        this._endAt = performance.now() + (opts.duration ?? this.duration);
        if (!this.running) { this.running = true; this._tick(); }
    }
    _tick = () => {
        this._raf = requestAnimationFrame(this._tick);
        const now = performance.now();
        if (now >= this._endAt && this._particles.length === 0) { this.running = false; cancelAnimationFrame(this._raf); return; }
        const ctx = this._ctx; if (!ctx) return;
        const w = this._canvas.width; const h = this._canvas.height;
        ctx.clearRect(0, 0, w, h);
        const still = [];
        for (const p of this._particles) {
            p.vy += p.g; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.alpha -= 0.008;
            if (p.alpha <= 0 || p.y > h + 20) continue;
            still.push(p);
            ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha)); ctx.translate(p.x, p.y); ctx.rotate(p.r);
            ctx.fillStyle = p.color; ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h); ctx.restore();
        }
        this._particles = still;
    }
}
customElements.define('kuis-confeti', KuisConfeti);

/* Quiz Sheets Sender */
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

/* Expanding Cards */
class ExpandingCards extends HAXCMSLitElementTheme {
  static get haxProperties() {
    return {
      canScale: true,
      canPosition: true,
      canEditSource: false,
      gizmo: {
        title: "Expanding Cards",
        description: "An expanding card gallery component",
        icon: "image:view-carousel",
        color: "blue",
        groups: ["Content", "Media"],
        handles: [],
        meta: { 
          author: "Your Name", 
          owner: "Your Organization" 
        },
      },
      settings: {
        quick: [],
        configure: [
          {
            property: "panels",
            title: "Panels",
            description: "The panels to display in the gallery",
            inputMethod: "array",
            properties: [
              {
                property: "imageUrl",
                title: "Image URL",
                description: "The URL of the image for the panel",
                inputMethod: "textfield",
                required: true,
              },
              {
                property: "title",
                title: "Title",
                description: "The title to display on the panel",
                inputMethod: "textfield",
                required: true,
              },
            ],
          },
        ],
        advanced: [],
      },
    };
  }

  static styles = css`
    @import url('https://fonts.googleapis.com/css?family=Muli&display=swap');

    * {
      box-sizing: border-box;
    }

    .container {
      display: flex;
      width: 90vw;
    }

    .panel {
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      height: 80vh;
      border-radius: 50px;
      color: #fff;
      cursor: pointer;
      flex: 0.5;
      margin: 10px;
      position: relative;
      -webkit-transition: all 700ms ease-in;
      transition: all 700ms ease-in;
    }

    .panel h3 {
      font-size: 24px;
      position: absolute;
      bottom: 20px;
      left: 20px;
      margin: 0;
      opacity: 0;
    }

    .panel.active {
      flex: 5;
    }

    .panel.active h3 {
      opacity: 1;
      transition: opacity 0.3s ease-in 0.4s;
    }

    @media (max-width: 480px) {
      .container {
        width: 100vw;
      }

      .panel:nth-of-type(4),
      .panel:nth-of-type(5) {
        display: none;
      }
    }
  `;

  static properties = {
    panels: { type: Array },
    activePanel: { type: Number }
  };

  static get tag() {
    return "expanding-cards";
  }

  constructor() {
    super();
    this.panels = [
      {
        imageUrl: 'https://images.unsplash.com/photo-1558979158-65a1eaa08691?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80',
        title: 'Explore The World'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1572276596237-5db2c3e16c5d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80',
        title: 'Wild Forest'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1353&q=80',
        title: 'Sunny Beach'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1551009175-8a68da93d5f9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1351&q=80',
        title: 'City on Winter'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80',
        title: 'Mountains - Clouds'
      }
    ];
    this.activePanel = 0;
  }

  _handlePanelClick(index) {
    this.activePanel = index;
  }

  render() {
    return html`
      <div class="container">
        ${this.panels.map((panel, index) => html`
          <div
            class="panel ${index === this.activePanel ? 'active' : ''}"
            style="background-image: url('${panel.imageUrl}')"
            @click=${() => this._handlePanelClick(index)}
          >
            <h3>${panel.title}</h3>
          </div>
        `)}
      </div>
    `;
  }
}

customElements.define(ExpandingCards.tag, ExpandingCards);

/* Hero Section */
class HeroSection extends LitElement {
  static styles = css`
    :host {
      display: block;
      margin-bottom: 2rem;
    }
    .hero {
      background: url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80');
      background-size: cover;
      height: 540px;
      position: relative;
      z-index: -1;
      border-radius: 0;
      margin: 0;
      padding: 0;
    }
    .hero::after {
      content: '';
      display: block;
      position: absolute;
      width: 100%;
      height: 50%;
      background-image: linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0));
      bottom: 0;
    }
    .hero-container {
      color: white;
      text-align: center;
      position: relative;
      z-index: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .hero-title {
      font-weight: 200;
      font-size: 2.6em;
      margin-top: 100px;
      text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
      margin-bottom: 50px;
    }
    .hero-title span {
      font-weight: 500;
    }
    .hero-button {
      border-radius: 40px;
      text-transform: uppercase;
      margin-top: 1rem;
      font-size: 1.2em;
      padding: .5em 2em;
      color: #fff;
      background: #17a2b8;
      border: none;
      cursor: pointer;
      box-shadow: 0 3px 20px rgba(0, 0, 0, 0.3);
    }
    @media (min-width: 992px) {
      .hero {
        margin-top: -90px;
        height: 640px;
      }
      .hero-title {
        font-size: 5em;
        margin-top: 150px;
      }
    }
  `;

  static properties = {
    title: { type: String },
    btnText: { type: String },
    btnLink: { type: String }
  };

  constructor() {
    super();
    this.title = "Get work done <span>faster</span> <br>and <span>better</span> with us";
    this.btnText = "View Our Work";
    this.btnLink = "#";
  }

  render() {
    return html`
      <section class="hero">
        <div class="hero-container">
          <h1 class="hero-title" .innerHTML=${this.title}></h1>
          <a href="${this.btnLink}" class="hero-button">${this.btnText}</a>
        </div>
      </section>
    `;
  }
}
customElements.define('hero-section', HeroSection);

/**
 * `CustomPortoTheme`
 * `CustomPortoTheme based on modern flex design system`
 * `This theme is an example of extending an existing theme component`
 *
 * @microcopy - language worth noting:
 *  - HAXcms - A headless content management system
 *  - HAXCMSTheme - A super class that provides correct baseline wiring to build a new theme
 *
 * @demo demo/index.html
 * @element custom-porto-theme
 */
class CustomPortoTheme extends PolarisFlexTheme {
  static get tag() {
    return "custom-porto-theme";
  }
 
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
      const key = 'site.quizResults';
      const raw = localStorage.getItem(key);
      const map = raw ? JSON.parse(raw) : {};
      map[slug] = { ...result, updated: Date.now() };
      localStorage.setItem(key, JSON.stringify(map));
      await this._updateSiteJson(slug, result);
    } catch (err) {
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
customElements.define(CustomPortoTheme.tag, CustomPortoTheme);
export { CustomPortoTheme };
