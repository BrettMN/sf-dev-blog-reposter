export class PostTracker {
  private kv: Deno.Kv;

  private constructor(kv: Deno.Kv) {
    this.kv = kv;
  }

  static async create(): Promise<PostTracker> {
    const kv = await Deno.openKv();
    return new PostTracker(kv);
  }

  async hasBeenPosted(guid: string): Promise<boolean> {
    const key = ["posted", guid];
    const result = await this.kv.get(key);
    return result.value !== null;
  }

  async markAsPosted(guid: string, title: string, link: string): Promise<void> {
    const key = ["posted", guid];
    const value = {
      guid,
      title,
      link,
      postedAt: new Date().toISOString(),
    };
    await this.kv.set(key, value);
  }

  async getRecentPosts(
    limit = 10,
  ): Promise<
    Array<{ guid: string; title: string; link: string; postedAt: string }>
  > {
    const posts: Array<
      { guid: string; title: string; link: string; postedAt: string }
    > = [];
    const entries = this.kv.list({ prefix: ["posted"] });

    for await (const entry of entries) {
      if (posts.length >= limit) break;
      posts.push(
        entry.value as {
          guid: string;
          title: string;
          link: string;
          postedAt: string;
        },
      );
    }

    return posts.sort((a, b) =>
      new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    );
  }

  close(): void {
    this.kv.close();
  }
}
