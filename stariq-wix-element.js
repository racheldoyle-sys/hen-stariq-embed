
class StarIQWixElement extends HTMLElement {
  constructor() {
    super();
    this.simulator = null;
    this.loading = false;
  }

  connectedCallback() {
    if (this.loading || this.simulator) return;

    this.style.display = 'block';
    this.style.width = '100%';
    this.style.height = '100%';
    this.style.minHeight = '850px';

    const container = document.createElement('div');
    container.style.cssText = `
      width: 100%;
      height: 100%;
      min-height: 850px;
      position: relative;
    `;

    this.appendChild(container);
    this.container = container;
    this.loading = true;

    const startSimulator = () => {
      try {
        this.simulator = StarIQ.mount(this.container);
        console.log('STAR-IQ: Wix Custom Element mounted.');
      } catch (error) {
        console.error('STAR-IQ: Mount failed:', error);
      } finally {
        this.loading = false;
      }
    };

    if (typeof StarIQ !== 'undefined' &&
        typeof StarIQ.mount === 'function') {
      startSimulator();
      return;
    }

    const script = document.createElement('script');
    script.src =
      'https://racheldoyle-sys.github.io/hen-stariq-embed/stariq-embed.js?v=1.2.0';

    script.onload = startSimulator;

    script.onerror = () => {
      console.error('STAR-IQ: Unable to load simulator.');
      this.loading = false;
    };

    document.head.appendChild(script);
  }

  disconnectedCallback() {
    if (this.simulator &&
        typeof this.simulator.unmount === 'function') {
      this.simulator.unmount();
    }

    this.simulator = null;
    this.loading = false;
  }
}

if (!customElements.get('stariq-wix-element')) {
  customElements.define('stariq-wix-element', StarIQWixElement);
}
