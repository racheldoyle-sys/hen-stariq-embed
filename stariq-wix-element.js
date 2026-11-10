
const STAR_IQ_HUBSPOT_EVENTS = {
  star_iq_webex_launched:
    "pe20442704_star_iq_simulator_launched",

  star_iq_tour_started:
    "pe20442704_star_iq_tour_started",

  star_iq_element_clicked:
    "pe20442704_star_iq_element_clicked",

  star_iq_tour_stage_viewed:
    "pe20442704_star_iq_tour_stage_viewed",

  star_iq_tour_ended:
    "pe20442704_star_iq_tour_ended",

  star_iq_webex_session_ended:
    "pe20442704_star_iq_session_ended"
};

class StarIQWixElement extends HTMLElement {
  constructor() {
    super();

    this.container = null;
    this.simulator = null;
    this.loading = false;
    this.mounted = false;
    this.loadToken = 0;

    this.handleWheel = this.handleWheel.bind(this);
    this.handleStarIQEvent = this.handleStarIQEvent.bind(this);
  }

  connectedCallback() {
    if (this.loading || this.mounted) return;

    // Preserve Wix layout and navigation behavior.
    Object.assign(this.style, {
      display: "block",
      width: "100%",
      maxWidth: "100%",
      height: "100%",
      minHeight: "850px",
      boxSizing: "border-box",
      position: "relative",
      overflow: "hidden",
      isolation: "isolate"
    });

    // Preserve existing mouse-wheel scrolling.
    this.addEventListener("wheel", this.handleWheel, {
      passive: false,
      capture: true
    });

    // Listen for STAR-IQ simulator events.
    this.addEventListener(
      "stariq:event",
      this.handleStarIQEvent,
      true
    );

    const container = document.createElement("div");
    container.id = "stariq-simulator";

    Object.assign(container.style, {
      display: "block",
      width: "100%",
      maxWidth: "100%",
      height: "100%",
      minHeight: "850px",
      position: "relative",
      boxSizing: "border-box",
      overflow: "visible",
      margin: "0 auto"
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
        typeof window.StarIQ.mount !== "function"
      ) {
        console.error("STAR-IQ: Library unavailable.");
        this.loading = false;
        return;
      }

      try {
        this.simulator = window.StarIQ.mount(container);
        this.mounted = true;

        console.log(
          "STAR-IQ: Simulator mounted successfully inside Wix."
        );
      } catch (error) {
        console.error("STAR-IQ: Mount failed.", error);
      } finally {
        this.loading = false;
      }
    };

    // Reuse the library if already loaded.
    if (
      window.StarIQ &&
      typeof window.StarIQ.mount === "function"
    ) {
      startSimulator();
      return;
    }

    // Load the developer-provided simulator.
    const script = document.createElement("script");

    script.src =
      "https://racheldoyle-sys.github.io/hen-stariq-embed/stariq-embed.js?v=1.2.0";

    script.async = true;
    script.onload = startSimulator;

    script.onerror = () => {
      console.error("STAR-IQ: Script failed to load.");
      this.loading = false;
    };

    document.head.appendChild(script);
  }

  handleStarIQEvent(event) {
    const detail = event.detail || {};
    const eventName = detail.event;
    const eventProps = detail.props || {};

    // Match the simulator event to its HubSpot event.
    const hubspotName = STAR_IQ_HUBSPOT_EVENTS[eventName];

    console.log(
      "STAR-IQ EVENT:",
      eventName,
      eventProps
    );

    // Only forward our six primary tracking events.
    if (!hubspotName) return;

    // HubSpot tracking must be available.
    if (
      !window._hsq ||
      typeof window._hsq.push !== "function"
    ) {
      console.warn(
        "STAR-IQ: HubSpot tracking unavailable.",
        eventName
      );
      return;
    }

    const properties = {};

    // Map STAR-IQ click data to HubSpot properties.
    if (eventName === "star_iq_element_clicked") {
      const propertyMapping = {
        element_name: "element_name",
        element_id: "star_iq_element_id",
        current_stage: "current_stage",
        exploration_mode: "exploration_mode"
      };

      Object.entries(propertyMapping).forEach(
        ([sourceName, hubspotName]) => {
          const value = eventProps[sourceName];

          if (
            typeof value === "string" &&
            value.trim() !== ""
          ) {
            properties[hubspotName] = value;
          }
        }
      );
    }

    // Send event and properties to HubSpot.
    window._hsq.push([
      "trackCustomBehavioralEvent",
      {
        name: hubspotName,
        properties: properties
      }
    ]);

    console.log(
      "STAR-IQ SENT TO HUBSPOT:",
      hubspotName,
      properties
    );
  }

  handleWheel(event) {
    if (event.ctrlKey) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const multiplier =
      event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? window.innerHeight
          : 1;

    window.scrollBy({
      top: event.deltaY * multiplier,
      left: event.deltaX * multiplier,
      behavior: "instant"
    });
  }

  disconnectedCallback() {
    ++this.loadToken;

    this.removeEventListener(
      "wheel",
      this.handleWheel,
      true
    );

    this.removeEventListener(
      "stariq:event",
      this.handleStarIQEvent,
      true
    );

    // Clean up simulator if supported.
    if (
      this.simulator &&
      typeof this.simulator.unmount === "function"
    ) {
      try {
        this.simulator.unmount();
      } catch (error) {
        console.warn(
          "STAR-IQ: Cleanup warning.",
          error
        );
      }
    }

    this.simulator = null;
    this.container = null;
    this.loading = false;
    this.mounted = false;

    this.replaceChildren();
  }
}

// Register the Wix Custom Element.
if (!customElements.get("stariq-wix-element")) {
  customElements.define(
    "stariq-wix-element",
    StarIQWixElement
  );
}
