import { BskyAgent } from "@atproto/api";

export class BlueskyClient {
  private agent: BskyAgent;
  private identifier: string;
  private password: string;

  constructor(identifier: string, password: string) {
    this.agent = new BskyAgent({
      service: "https://bsky.social",
    });
    this.identifier = identifier;
    this.password = password;
  }

  async login(): Promise<void> {
    await this.agent.login({
      identifier: this.identifier,
      password: this.password,
    });
  }

  async post(text: string): Promise<void> {
    if (!this.agent.session) {
      await this.login();
    }

    await this.agent.post({
      text,
      createdAt: new Date().toISOString(),
    });
  }

  async postWithLink(text: string, url: string): Promise<void> {
    if (!this.agent.session) {
      await this.login();
    }

    const facets = this.extractFacets(text, url);

    // Fetch link card metadata to create embed
    let embed;
    try {
      const response = await fetch(
        `https://cardyb.bsky.app/v1/extract?url=${encodeURIComponent(url)}`,
      );
      if (response.ok) {
        const metadata = await response.json();

        // Upload thumbnail if available
        let thumb;
        if (metadata.image) {
          try {
            const imageResp = await fetch(metadata.image);
            if (imageResp.ok) {
              const imageData = await imageResp.arrayBuffer();
              const uploadResp = await this.agent.uploadBlob(
                new Uint8Array(imageData),
                {
                  encoding: imageResp.headers.get("content-type") ||
                    "image/jpeg",
                },
              );
              thumb = uploadResp.data.blob;
            }
          } catch (err) {
            console.warn("Failed to upload thumbnail:", err);
          }
        }

        embed = {
          $type: "app.bsky.embed.external",
          external: {
            uri: url,
            title: metadata.title || url,
            description: metadata.description || "",
            thumb,
          },
        };
      }
    } catch (err) {
      console.warn("Failed to fetch link metadata:", err);
    }

    await this.agent.post({
      text,
      facets,
      embed,
      createdAt: new Date().toISOString(),
    });
  }

  private extractFacets(text: string, url: string) {
    const facets = [];
    const encoder = new TextEncoder();

    // Find URL and create link facet
    const urlStart = text.indexOf(url);
    if (urlStart >= 0) {
      const urlEnd = urlStart + url.length;
      facets.push({
        index: {
          byteStart: encoder.encode(text.substring(0, urlStart)).length,
          byteEnd: encoder.encode(text.substring(0, urlEnd)).length,
        },
        features: [{
          $type: "app.bsky.richtext.facet#link",
          uri: url,
        }],
      });
    }

    // Find hashtags and create tag facets
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    let match;

    while ((match = hashtagRegex.exec(text)) !== null) {
      const hashtag = match[0];
      const hashtagStart = match.index;
      const hashtagEnd = hashtagStart + hashtag.length;

      facets.push({
        index: {
          byteStart: encoder.encode(text.substring(0, hashtagStart)).length,
          byteEnd: encoder.encode(text.substring(0, hashtagEnd)).length,
        },
        features: [{
          $type: "app.bsky.richtext.facet#tag",
          tag: hashtag.substring(1), // Remove the # prefix
        }],
      });
    }

    return facets.length > 0 ? facets : undefined;
  }
}
