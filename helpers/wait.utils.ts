/**
 * Wait for a specific condition to be met before proceeding.
 */
export async function waitForCondition<T>(
  condition: () => Promise<T>,
  options: { predicate?: (v: T) => boolean; timeout?: number } = {}
): Promise<T> {
  const { predicate = (v) => !!v, timeout = 10000 } = options;
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    const result = await condition();
    if (predicate(result)) {
      return result;
    }
    await new Promise(r => setTimeout(r, 500));
  }
  
  throw new Error(`waitForCondition timed out after ${timeout}ms`);
}
