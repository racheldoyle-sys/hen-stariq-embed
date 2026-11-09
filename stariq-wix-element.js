
class StarIQWixElement extends HTMLElement {
  constructor() {
    super();
    this.container = null;
    this.simulator = null;
    this.loading = false;
  }

  connectedCallback() {
    if (this.loading || this.container) return;

    this.style.display = 'block';
    this.style.width = '100%';
    this.style.maxWidth = '100%';
    this.style.minHeight = '850px';
    this.style.boxSizing = 'border-box';
    this.style.position = 'relative';

    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.maxWidth = '100%';
    container.style.minHeight = '850px';
    container.style.position = 'relative';
    container.style.boxSizing = 'border-box';

    this.appendChild(container);
    this.container = container;
    this.loading = true;

    const startSimulator = () => {
      try {
        this.simulator = StarIQ.mount(this.container);
        console.log('STAR-IQ mounted inside Wix Custom Element.');
      } catch (error) {
        console.error('STAR-IQ mount failed:', error);
      } finally {
        this.loading = false;
      }
    };

    if (window.StarIQ && typeof window.StarIQ.mount === 'function') {
      startSimulator();
      return;
    }

    const script = document.createElement('script');
    script.src =
      'https://racheldoyle-sys.github.io/hen-stariq-embed/stariq-embed.js?v=1.2.0';

    script.onload = startSimulator;
    script.onerror = () => {
      console.error('STAR-IQ script failed to load.');
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
    this.container = null;
    this.loading = false;
  }
}

if (!customElements.get('stariq-wix-element')) {
  customElements.define('stariq-wix-element', StarIQWixElement);
}
