
class StarIQWixElement extends HTMLElement {
  constructor() {
    super();

    this.container = null;
    this.simulator = null;
    this.loading = false;
    this.mounted = false;
    this.loadToken = 0;
  }

  connectedCallback() {
    if (this.loading || this.mounted) return;

    // Outer boundary protects the Wix header and navigation.
    Object.assign(this.style, {
      display: 'block',
      width: '100%',
      maxWidth: '100%',
      height: '100%',
      minHeight: '850px',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate'
    });

    // The simulator can manage scrolling within this area.
    const container = document.createElement('div');
    container.id = 'stariq-simulator';

    Object.assign(container.style, {
      display: 'block',
      width: '100%',
      maxWidth: '100%',
      height: '100%',
      minHeight: '850px',
      position: 'relative',
      boxSizing: 'border-box',
      overflow: 'visible',
      margin: '0 auto'
    });

    this.appendChild(container);
    this.container = container;
    this.loading = true;

    const token = ++this.loadToken;

    const startSimulator = () => {
      if (!this.isConnected || token !== this.loadToken) {
        return;
      }

      if (
        !window.StarIQ ||
        typeof window.StarIQ.mount !== 'function'
      ) {
        console.error('STAR-IQ: Library unavailable.');
        this.loading = false;
        return;
      }

      try {
        this.simulator = window.StarIQ.mount(container);
        this.mounted = true;

        console.log(
          'STAR-IQ: Simulator mounted inside Wix.'
        );
      } catch (error) {
        console.error('STAR-IQ: Mount failed.', error);
      } finally {
        this.loading = false;
      }
    };

    if (
      window.StarIQ &&
      typeof window.StarIQ.mount === 'function'
    ) {
      startSimulator();
      return;
    }

    const script = document.createElement('script');

    script.src =
      'https://racheldoyle-sys.github.io/hen-stariq-embed/stariq-embed.js?v=1.2.0';

    script.async = true;
    script.onload = startSimulator;

    script.onerror = () => {
      console.error('STAR-IQ: Script failed to load.');
      this.loading = false;
    };

    document.head.appendChild(script);
  }

  disconnectedCallback() {
    ++this.loadToken;

    if (
      this.simulator &&
      typeof this.simulator.unmount === 'function'
    ) {
      try {
        this.simulator.unmount();
      } catch (error) {
        console.warn('STAR-IQ: Cleanup warning.', error);
      }
    }

    this.simulator = null;
    this.container = null;
    this.loading = false;
    this.mounted = false;

    this.replaceChildren();
  }
}

if (!customElements.get('stariq-wix-element')) {
  customElements.define(
    'stariq-wix-element',
    StarIQWixElement
  );
}
