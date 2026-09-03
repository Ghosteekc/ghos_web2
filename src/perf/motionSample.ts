const PERF_TRANSITION_EVENT = "ghosteek:transition-start";

/**
 * Lets the render profile sample one real route/tab handoff after startup.
 * The event carries no UI state, so it cannot cause transition re-renders.
 */
export function notifyPerfTransitionStart(): void {
  document.dispatchEvent(new Event(PERF_TRANSITION_EVENT));
}

export { PERF_TRANSITION_EVENT };
