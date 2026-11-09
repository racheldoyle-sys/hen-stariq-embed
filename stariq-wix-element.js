
class StarIQWixElement extends HTMLElement {
  constructor() {
    super();

    this.container = null;
    this.simulator = null;
    this.loading = false;
    this.mounted = false;
    this.loadToken = 0;

    this.handleWheel = this.handleWheel.bind(this);
  }

  connectedCallback() {
    if (this.loading || this.mounted) return;

    // Keep STAR-IQ contained inside its Wix section.
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

    // Capture mouse-wheel events before the simulator does.
    this.addEventListener(
      'wheel',
      this.handleWheel,
      { passive: false, capture: true }
    );

    // Create the simulator mounting container.
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
          'STAR-IQ: Simulator mounted successfully inside Wix.'
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

    // Load the developer's original STAR-IQ library.
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

  handleWheel(event) {
    // Preserve browser zoom shortcuts.
    if (event.ctrlKey) return;

    // Prevent STAR-IQ from capturing mouse-wheel scrolling.
    event.preventDefault();
    event.stopImmediatePropagation();

    const multiplier =
      event.deltaMode === 1 ? 16 :
      event.deltaMode === 2 ? window.innerHeight : 1;

    // Scroll the Wix webpage instead of the simulator.
    window.scrollBy({
      top: event.deltaY * multiplier,
      left: event.deltaX * multiplier,
      behavior: 'instant'
    });
  }

  disconnectedCallback() {
    ++this.loadToken;

    // Remove the mouse-wheel listener.
    this.removeEventListener(
      'wheel',
      this.handleWheel,
      true
    );

    // Clean up the simulator when Wix removes the element.
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

// Register the Custom Element with Wix.
if (!customElements.get('stariq-wix-element')) {
  customElements.define(
    'stariq-wix-element',
    StarIQWixElement
  );
}
