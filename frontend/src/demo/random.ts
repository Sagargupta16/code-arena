const word = new Uint32Array(1);

/** Unbiased index in [0, n) from the Web Crypto generator, for room codes and problem picks. */
export function randomIndex(n: number): number {
  // Mask down to the smallest power of two that covers n, then reject draws past n,
  // so every index is equally likely.
  const mask = 2 ** Math.ceil(Math.log2(Math.max(n, 2))) - 1;
  let value: number;
  do {
    value = crypto.getRandomValues(word)[0] & mask;
  } while (value >= n);
  return value;
}
