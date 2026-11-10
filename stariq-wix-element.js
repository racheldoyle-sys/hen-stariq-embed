
const STAR_IQ_HUBSPOT_EVENTS = {
    star_iq_webex_launched: "pe20442704_star_iq_simulator_launched",
    star_iq_tour_started: "pe20442704_star_iq_tour_started",
    star_iq_element_clicked: "pe20442704_star_iq_element_clicked",
    star_iq_tour_stage_viewed: "pe20442704_star_iq_tour_stage_viewed",
    star_iq_tour_ended: "pe20442704_star_iq_tour_ended",
    star_iq_webex_session_ended: "pe20442704_star_iq_session_ended"
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

        // ==========================================
        // WIX POPUP GRID WIDTH WORKAROUND
        // ==========================================

        const wixWrapper = this.parentElement;
        const wixGrid = wixWrapper?.parentElement;

        if (wixWrapper) {
            Object.assign(wixWrapper.style, {
                width: "100%",
                maxWidth: "none",
                minWidth: "0",
                gridColumn: "1 / -1",
                justifySelf: "stretch"
            });
        }

        if (wixGrid && getComputedStyle(wixGrid).display === "grid") {
            wixGrid.style.gridTemplateColumns = "minmax(0, 1fr)";
        }

        // ==========================================
        // CUSTOM ELEMENT LAYOUT
        // ==========================================

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

        // ==========================================
        // SCROLL HANDLING
        // ==========================================

        this.addEventListener(
            "wheel",
            this.handleWheel,
            {
                passive: false,
                capture: true
            }
        );

        // ==========================================
        // STAR-IQ EVENT LISTENER
        // ==========================================

        this.addEventListener(
            "stariq:event",
            this.handleStarIQEvent,
            true
        );

        // ==========================================
        // SIMULATOR CONTAINER
        // ==========================================

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

        // ==========================================
        // START SIMULATOR
        // ==========================================

        const startSimulator = () => {

            if (!this.isConnected || token !== this.loadToken) {
                return;
            }

            if (
                !window.StarIQ ||
                typeof window.StarIQ.mount !== "function"
            ) {
                console.error(
                    "STAR-IQ: Library unavailable."
                );

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

                console.error(
                    "STAR-IQ: Mount failed.",
                    error
                );

            } finally {

                this.loading = false;

            }
        };

        // ==========================================
        // LOAD STAR-IQ LIBRARY
        // ==========================================

        if (
            window.StarIQ &&
            typeof window.StarIQ.mount === "function"
        ) {
            startSimulator();
            return;
        }

        const script = document.createElement("script");

        script.src =
            "https://racheldoyle-sys.github.io/hen-stariq-embed/stariq-embed.js?v=1.2.0";

        script.async = true;

        script.onload = startSimulator;

        script.onerror = () => {

            console.error(
                "STAR-IQ: Script failed to load."
            );

            this.loading = false;
        };

        document.head.appendChild(script);
    }

    // ==========================================
    // HUBSPOT EVENT TRACKING
    // ==========================================

    handleStarIQEvent(event) {

        const detail = event.detail || {};

        const eventName = detail.event;

        const eventProps = detail.props || {};

        const hubspotName =
            STAR_IQ_HUBSPOT_EVENTS[eventName];

        console.log(
            "STAR-IQ EVENT:",
            eventName,
            eventProps
        );

        if (!hubspotName) return;

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

        // ==========================================
        // ELEMENT CLICK PROPERTIES
        // ==========================================

        if (eventName === "star_iq_element_clicked") {

            const propertyMapping = {
                element_name: "element_name",
                element_id: "star_iq_element_id",
                current_stage: "current_stage",
                exploration_mode: "exploration_mode"
            };

            Object.entries(propertyMapping).forEach(
                ([sourceName, hubspotProperty]) => {

                    const value = eventProps[sourceName];

                    if (
                        typeof value === "string" &&
                        value.trim() !== ""
                    ) {
                        properties[hubspotProperty] = value;
                    }

                }
            );
        }

        // ==========================================
        // SEND EVENT TO HUBSPOT
        // ==========================================

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

    // ==========================================
    // PAGE SCROLL HANDLING
    // ==========================================

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

    // ==========================================
    // CLEANUP
    // ==========================================

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

// ==========================================
// REGISTER CUSTOM ELEMENT
// ==========================================

if (!customElements.get("stariq-wix-element")) {

    customElements.define(
        "stariq-wix-element",
        StarIQWixElement
    );
}
