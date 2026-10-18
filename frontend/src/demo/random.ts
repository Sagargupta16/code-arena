/** Index in [0, n) from the Web Crypto generator, for room codes and problem picks. */
export function randomIndex(n: number): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] % n;
}
