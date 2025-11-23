export interface BlogPost {
  title: string;
  link: string;
  pubDate: Date;
  guid: string;
  description?: string;
}

export async function fetchRSSFeed(url: string): Promise<BlogPost[]> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; RSS Reader Bot/1.0; +https://github.com/BrettMN/sf-dev-blog-reposter)",
      "Accept": "application/rss+xml, application/xml, text/xml, */*",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
  }

  const xml = await response.text();
  return parseRSSFeed(xml);
}

function parseRSSFeed(xml: string): BlogPost[] {
  const posts: BlogPost[] = [];

  // Extract items from the RSS feed
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const items = xml.matchAll(itemRegex);

  for (const item of items) {
    const itemContent = item[1];

    const title = extractTag(itemContent, "title");
    const link = extractTag(itemContent, "link");
    const pubDate = extractTag(itemContent, "pubDate");
    const guid = extractTag(itemContent, "guid");
    const description = extractTag(itemContent, "description");

    if (title && link && pubDate && guid) {
      posts.push({
        title: cleanText(title),
        link: cleanText(link),
        pubDate: new Date(pubDate),
        guid: cleanText(guid),
        description: description ? cleanText(description) : undefined,
      });
    }
  }

  return posts;
}

function extractTag(content: string, tagName: string): string | null {
  const regex = new RegExp(
    `<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\/${tagName}>`,
    "i",
  );
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

function cleanText(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}
