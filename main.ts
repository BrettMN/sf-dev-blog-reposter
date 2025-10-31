import "@std/dotenv/load";
import { fetchRSSFeed } from "./src/rss.ts";
import { PostTracker } from "./src/tracker.ts";
import { BlueskyClient } from "./src/bluesky.ts";
import { MastodonClient } from "./src/mastodon.ts";
import { formatSimpleMessage } from "./src/formatter.ts";
import { Logger, retry } from "./src/utils.ts";

const logger = new Logger("main");

async function checkAndPostNewArticles() {
  logger.info("Starting check for new articles...");

  try {
    // Get environment variables
    const RSS_URL = Deno.env.get("SF_BLOG_RSS_URL") ||
      "https://developer.salesforce.com/blogs/feed";
    const BLUESKY_IDENTIFIER = Deno.env.get("BLUESKY_IDENTIFIER");
    const BLUESKY_APP_PASSWORD = Deno.env.get("BLUESKY_APP_PASSWORD");
    const MASTODON_URL = Deno.env.get("MASTODON_URL");
    const MASTODON_ACCESS_TOKEN = Deno.env.get("MASTODON_ACCESS_TOKEN");

    // Validate required environment variables
    if (!BLUESKY_IDENTIFIER || !BLUESKY_APP_PASSWORD) {
      logger.error("Missing Bluesky credentials in environment variables");
      throw new Error("Missing Bluesky credentials");
    }

    if (!MASTODON_URL || !MASTODON_ACCESS_TOKEN) {
      logger.error("Missing Mastodon credentials in environment variables");
      throw new Error("Missing Mastodon credentials");
    }

    // Initialize clients
    const tracker = await PostTracker.create();
    const bluesky = new BlueskyClient(BLUESKY_IDENTIFIER, BLUESKY_APP_PASSWORD);
    const mastodon = new MastodonClient(MASTODON_URL, MASTODON_ACCESS_TOKEN);

    // Fetch RSS feed
    logger.info("Fetching RSS feed from:", RSS_URL);
    const posts = await retry(() => fetchRSSFeed(RSS_URL), 3, 2000, logger);
    logger.info(`Found ${posts.length} posts in RSS feed`);

    // Process posts (newest first)
    let newPostsCount = 0;
    for (const post of posts) {
      const alreadyPosted = await tracker.hasBeenPosted(post.guid);

      if (!alreadyPosted) {
        logger.info(`New post found: "${post.title}"`);

        const message = formatSimpleMessage(post);

        try {
          // Post to Bluesky
          logger.info("Posting to Bluesky...");
          await retry(
            () => bluesky.postWithLink(message, post.link),
            3,
            2000,
            logger,
          );
          logger.info("✓ Posted to Bluesky");
        } catch (error) {
          logger.error("Failed to post to Bluesky", error);
        }

        try {
          // Post to Mastodon
          logger.info("Posting to Mastodon...");
          await retry(() => mastodon.post(message), 3, 2000, logger);
          logger.info("✓ Posted to Mastodon");
        } catch (error) {
          logger.error("Failed to post to Mastodon", error);
        }

        // Mark as posted
        await tracker.markAsPosted(post.guid, post.title, post.link);
        newPostsCount++;

        // Add delay between posts to avoid rate limiting
        if (newPostsCount < posts.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    if (newPostsCount === 0) {
      logger.info("No new posts to share");
    } else {
      logger.info(`Successfully shared ${newPostsCount} new post(s)`);
    }

    tracker.close();
  } catch (error) {
    logger.error("Error in checkAndPostNewArticles", error);
    throw error;
  }
}

// Run immediately on startup for testing
if (import.meta.main) {
  logger.info("Running manual check...");
  await checkAndPostNewArticles();
  logger.info("Manual check completed");
}

// Set up cron job to run every hour
Deno.cron("Check Salesforce Blog", "0 * * * *", async () => {
  await checkAndPostNewArticles();
});

Deno.cron("Run once an hour on the hour", "0 * * * *", () => {
  console.log("Hello, cron!");
});

Deno.cron("Run every fifteen minutes", "*/15 * * * *", () => {
  console.log("Hello, cron!");
});

logger.info(
  "Cron job scheduled: checking Salesforce Developer Blog every hour",
);
