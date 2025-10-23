import { createRestAPIClient } from "masto";

export class MastodonClient {
  private client: ReturnType<typeof createRestAPIClient>;

  constructor(url: string, accessToken: string) {
    this.client = createRestAPIClient({
      url,
      accessToken,
    });
  }

  async post(status: string): Promise<void> {
    await this.client.v1.statuses.create({
      status,
      visibility: "public",
    });
  }
}
