let reprocessGeneration = 0;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function beginReprocess(): number {
  reprocessGeneration += 1;
  return reprocessGeneration;
}

export function isLatestReprocess(generation: number): boolean {
  return generation === reprocessGeneration;
}

export function scheduleReprocess(callback: () => void, delayMs = 400): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    callback();
  }, delayMs);
}

export function flushScheduledReprocess(callback: () => void): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  callback();
}

export function cancelScheduledReprocess(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}
