import { HAXCMSLitElementTheme, html, css } from "@haxtheweb/haxcms-elements/lib/core/HAXCMSLitElementTheme.js";

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
export { ExpandingCards };