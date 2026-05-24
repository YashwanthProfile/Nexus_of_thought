/**
 * A robust fetch wrapper for static hosting environments (like Cloudflare Pages) and local servers.
 * It automatically requests the `.json` postfixed endpoint first (e.g., /api/posts.json rather than /api/posts)
 * because files without extensions are often rewritten to index.html in static SPA hosting environments.
 * If the `.json` fetch fails, it gracefully falls back to the exact URL specified.
 */
export async function safeFetch<T>(url: string): Promise<T> {
  // Always prefer the .json extension to ensure seamless compatibility with static file systems
  const normalizedUrl = (url.includes('/api/') && !url.endsWith('.json')) 
    ? `${url}.json` 
    : url;

  try {
    const res = await fetch(normalizedUrl);
    
    // If the server returns 200 but sends back HTML (SPA routing fallback), treat it as an error
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html') || !res.ok) {
      throw new Error(`Invalid response or HTML returned for ${normalizedUrl}`);
    }

    return await res.json() as T;
  } catch (err) {
    console.warn(`Fetch to ${normalizedUrl} failed, falling back to original URL ${url}:`, err);
    
    // Try reaching the exact un-normalized URL
    const fallbackRes = await fetch(url);
    const contentType = fallbackRes.headers.get('content-type') || '';
    if (contentType.includes('text/html') || !fallbackRes.ok) {
      throw new Error(`Fetch failed for both ${normalizedUrl} and fallback ${url}`);
    }
    
    return await fallbackRes.json() as T;
  }
}

