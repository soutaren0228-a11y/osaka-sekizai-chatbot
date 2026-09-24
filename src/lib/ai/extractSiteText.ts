import "server-only";
import * as cheerio from "cheerio";

export interface ExtractedPage {
  url: string;
  text: string;
}

const MAX_PAGES = 60;
const MAX_CRAWL_DEPTH = 2;
const FETCH_TIMEOUT_MS = 10_000;
const REMOVE_SELECTORS = [
  "header",
  "footer",
  "nav",
  "script",
  "style",
  "noscript",
  "svg",
  "iframe",
  "aside",
  "[role=navigation]",
  "[role=banner]",
  "[role=contentinfo]",
];

async function fetchWithTimeout(url: string): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "OsakaSekizaiBot/1.0 (+ingestion)" },
    });
    return res.ok ? res : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function extractMainText(html: string): string {
  const $ = cheerio.load(html);
  $(REMOVE_SELECTORS.join(",")).remove();
  const root = $("main").length > 0 ? $("main") : $("body");
  const text = root
    .text()
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
  return text;
}

function extractSameDomainLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const origin = new URL(baseUrl).origin;
  const links = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const resolved = new URL(href, baseUrl);
      resolved.hash = "";
      if (
        resolved.origin === origin &&
        !/\.(pdf|jpg|jpeg|png|gif|svg|zip|docx?|xlsx?)$/i.test(resolved.pathname)
      ) {
        links.add(resolved.toString());
      }
    } catch {
      // 不正なURLは無視
    }
  });

  return [...links];
}

async function tryFetchSitemapUrls(rootUrl: string): Promise<string[] | null> {
  const origin = new URL(rootUrl).origin;
  const res = await fetchWithTimeout(`${origin}/sitemap.xml`);
  if (!res) return null;

  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });
  const urls = $("url > loc")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((u) => {
      try {
        return new URL(u).origin === origin;
      } catch {
        return false;
      }
    });

  return urls.length > 0 ? urls : null;
}

async function crawlSameDomain(rootUrl: string): Promise<string[]> {
  const visited = new Set<string>();
  const queue: { url: string; depth: number }[] = [{ url: rootUrl, depth: 0 }];
  const discovered = new Set<string>();

  while (queue.length > 0 && discovered.size < MAX_PAGES) {
    const { url, depth } = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);
    discovered.add(url);

    if (depth >= MAX_CRAWL_DEPTH) continue;

    const res = await fetchWithTimeout(url);
    if (!res) continue;
    const html = await res.text();
    const links = extractSameDomainLinks(html, url);
    for (const link of links) {
      if (!visited.has(link)) {
        queue.push({ url: link, depth: depth + 1 });
      }
    }
  }

  return [...discovered];
}

/**
 * サイトのURL一覧を取得する。sitemap.xmlを優先し、無ければ同一ドメイン内を
 * 深さ2程度までたどる。実際の本文取得は行わない（呼び出し側で個別に取得する）。
 */
export async function discoverSiteUrls(rootUrl: string): Promise<{
  urls: string[];
  usedSitemap: boolean;
}> {
  const sitemapUrls = await tryFetchSitemapUrls(rootUrl);
  if (sitemapUrls) {
    return { urls: sitemapUrls.slice(0, MAX_PAGES), usedSitemap: true };
  }
  const crawled = await crawlSameDomain(rootUrl);
  return { urls: crawled, usedSitemap: false };
}

/** 1ページの本文を取得する。ヘッダー・フッター・ナビ等は除去する */
export async function fetchPageText(url: string): Promise<ExtractedPage | null> {
  const res = await fetchWithTimeout(url);
  if (!res) return null;
  const html = await res.text();
  const text = extractMainText(html);
  if (!text) return null;
  return { url, text };
}
