import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CACHE_DIR = join(process.cwd(), "data", ".cache");

interface CacheEnvelope<T> {
  fetchedAt: number;
  body: T;
}

function cachePath(key: string): string {
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
  return join(CACHE_DIR, `${safeKey}.json`);
}

/**
 * Filesystem JSON cache, shared by route handlers and standalone scripts alike.
 * Next's native fetch cache only applies inside the Next request lifecycle, so it
 * wouldn't cover the scripts/ path - one cache implementation, inspectable as plain
 * files on disk, is simpler to reason about than running two caching systems.
 */
export async function getCached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const path = cachePath(key);

  if (existsSync(path)) {
    try {
      const envelope = JSON.parse(readFileSync(path, "utf8")) as CacheEnvelope<T>;
      if (Date.now() - envelope.fetchedAt < ttlMs) {
        return envelope.body;
      }
    } catch {
      // Corrupt or unreadable cache entry - fall through and refetch.
    }
  }

  const body = await fetcher();

  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
  const envelope: CacheEnvelope<T> = { fetchedAt: Date.now(), body };
  writeFileSync(path, JSON.stringify(envelope), "utf8");

  return body;
}
