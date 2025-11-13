import { LitElement, html, css } from 'https://unpkg.com/lit@latest?module';

export class HeroSection extends LitElement {
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