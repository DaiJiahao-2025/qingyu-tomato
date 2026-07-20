const preloadedSources = new Set<string>();

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

export function scheduleIdlePreload(callback: () => void): void {
  const idleWindow = window as IdleWindow;
  if (idleWindow.requestIdleCallback) {
    idleWindow.requestIdleCallback(callback, { timeout: 1500 });
    return;
  }
  window.setTimeout(callback, 120);
}

export function preloadImage(source: string | null | undefined): void {
  if (!source || preloadedSources.has(source)) return;
  preloadedSources.add(source);
  const image = new Image();
  image.decoding = "async";
  image.src = source;
}

export function preloadAudioMetadata(source: string | null | undefined): void {
  if (!source || preloadedSources.has(source)) return;
  preloadedSources.add(source);
  const audio = new Audio();
  audio.preload = "metadata";
  audio.src = source;
}
