
class StarIQWixElement extends HTMLElement {
  constructor() {
    super();

    this.container = null;
    this.simulator = null;
    this.loading = false;
    this.mounted = false;
  }

  connectedCallback() {
    // Prevent duplicate initialization
    if (this.loading || this.mounted) return;

    // Keep the simulator inside the Wix Custom Element
    this.style.display = 'block';
    this.style.width = '100%';
    this.style.maxWidth = '100%';
    this.style.height = '100%';
    this.style.minHeight = '850px';
    this.style.boxSizing = 'border-box';
    this.style.position = 'relative';

    // Prevent content from covering the Wix header/navigation
    this.style.overflow = 'hidden';
    this.style.isolation = 'isolate';

    // Create the simulator container
    const container = document.createElement('div');

    container.id = 'stariq-simulator';

    container.style.cssText = `
      width: 100%;
      max-width: 100%;
      height: 100%;
      min-height: 850px;
      position: relative;
      box-sizing: border-box;
      overflow: hidden;
      margin: 0 auto;
    `;

    this.appendChild(container);
    this.container = container;
    this.loading = true;

    // Initialize the STAR-IQ simulator
    const startSimulator = () => {
      if (
        !window.StarIQ ||
        typeof window.StarIQ.mount !== 'function'
      ) {
        console.error(
          'STAR-IQ: Simulator library unavailable.'
        );
        this.loading = false;
        return;
      }

      try {
        this.simulator = window.StarIQ.mount(
          this.container
        );

        this.mounted = true;

        console.log(
          'STAR-IQ: Simulator mounted successfully inside Wix.'
        );
      } catch (error) {
        console.error(
          'STAR-IQ: Simulator mount failed.',
          error
        );
      } finally {
        this.loading = false;
      }
    };

    // Use the library if already loaded
    if (
      window.StarIQ &&
      typeof window.StarIQ.mount === 'function'
    ) {
      startSimulator();
      return;
    }

    // Load the developer's original STAR-IQ script
    const script = document.createElement('script');

    script.src =
      'https://racheldoyle-sys.github.io/hen-stariq-embed/stariq-embed.js?v=1.2.0';

    script.async = true;

    script.onload = () => {
      startSimulator();
    };

    script.onerror = () => {
      console.error(
        'STAR-IQ: Failed to load simulator script.'
      );

      this.loading = false;
    };

    document.head.appendChild(script);
  }

  disconnectedCallback() {
    // Clean up when Wix removes the element
    if (
      this.simulator &&
      typeof this.simulator.unmount === 'function'
    ) {
      try {
        this.simulator.unmount();
      } catch (error) {
        console.warn(
          'STAR-IQ: Cleanup warning.',
          error
        );
      }
    }

    this.simulator = null;
    this.container = null;
    this.loading = false;
    this.mounted = false;

    this.innerHTML = '';
  }
}

// Register the Custom Element with Wix
if (!customElements.get('stariq-wix-element')) {
  customElements.define(
    'stariq-wix-element',
    StarIQWixElement
  );
}
