# Salesforce Developer Blog Reposter

Automatically share new Salesforce Developer Blog posts to Bluesky and Mastodon.
This service checks the RSS feed hourly and posts new articles to your social
media accounts.

## Features

- 🔄 Automatic hourly RSS feed checking
- 📱 Posts to both Bluesky and Mastodon
- 🎯 Duplicate post prevention using Deno KV
- 🔁 Automatic retry logic with exponential backoff
- 📝 Comprehensive logging
- ☁️ Ready for Deno Deploy

## Prerequisites

- [Deno](https://deno.land/) installed locally for development
- Bluesky account with an app password
- Mastodon account with an access token

## Setup

### 1. Clone and Configure

```bash
git clone <your-repo-url>
cd sf-dev-blog-reposter
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Bluesky Configuration
BLUESKY_IDENTIFIER=your-handle.bsky.social
BLUESKY_APP_PASSWORD=your-app-password

# Mastodon Configuration
MASTODON_URL=https://mastodon.social
MASTODON_ACCESS_TOKEN=your-access-token

# RSS Feed URL (optional, defaults to Salesforce Developer Blog)
SF_BLOG_RSS_URL=https://developer.salesforce.com/blogs/feed
```

### 3. Get API Credentials

#### Bluesky App Password

1. Log in to Bluesky
2. Go to Settings → App Passwords
3. Create a new app password
4. Copy the password to `BLUESKY_APP_PASSWORD`

#### Mastodon Access Token

1. Log in to your Mastodon instance
2. Go to Preferences → Development
3. Create a new application with `write:statuses` permission
4. Copy the access token to `MASTODON_ACCESS_TOKEN`

## Local Development

Run the application locally:

```bash
deno task dev
```

Or run directly:

```bash
deno run --allow-net --allow-env --allow-read --unstable-kv main.ts
```

This will:

- Run an immediate check for new posts
- Set up a cron job that runs every hour

## Deployment to Deno Deploy

### Option 1: Deploy via GitHub

1. Push your code to GitHub
2. Go to [Deno Deploy](https://dash.deno.com)
3. Create a new project
4. Link your GitHub repository
5. Set the entry point to `main.ts`
6. Add environment variables in the project settings:
   - `BLUESKY_IDENTIFIER`
   - `BLUESKY_APP_PASSWORD`
   - `MASTODON_URL`
   - `MASTODON_ACCESS_TOKEN`
   - `SF_BLOG_RSS_URL` (optional)
7. Deploy!

### Option 2: Deploy via CLI

```bash
# Install deployctl
deno install -A jsr:@deno/deployctl

# Deploy with environment variables
deployctl deploy --project=your-project-name \
  --env=BLUESKY_IDENTIFIER=your-handle.bsky.social \
  --env=BLUESKY_APP_PASSWORD=your-password \
  --env=MASTODON_URL=https://mastodon.social \
  --env=MASTODON_ACCESS_TOKEN=your-token \
  main.ts
```

## Project Structure

```
sf-dev-blog-reposter/
├── main.ts                 # Main entry point with cron job
├── deno.json              # Deno configuration and dependencies
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore rules
├── README.md             # This file
└── src/
    ├── rss.ts            # RSS feed fetching and parsing
    ├── tracker.ts        # Post tracking using Deno KV
    ├── bluesky.ts        # Bluesky API client
    ├── mastodon.ts       # Mastodon API client
    ├── formatter.ts      # Message formatting utilities
    └── utils.ts          # Logging and retry utilities
```

## How It Works

1. **Cron Schedule**: Runs every hour (at minute 0)
2. **Fetch RSS**: Retrieves the latest posts from Salesforce Developer Blog
3. **Check Duplicates**: Uses Deno KV to track which posts have been shared
4. **Format Messages**: Creates social media posts with title, link, and
   hashtags
5. **Post to Platforms**: Shares new posts to both Bluesky and Mastodon
6. **Error Handling**: Retries failed requests with exponential backoff
7. **Logging**: Records all activities for monitoring

## Customization

### Change Cron Schedule

Edit the cron expression in `main.ts`:

```typescript
// Every hour at minute 0
Deno.cron("Check Salesforce Blog", "0 * * * *", async () => {
  await checkAndPostNewArticles();
});

// Every 30 minutes
Deno.cron("Check Salesforce Blog", "*/30 * * * *", async () => {
  await checkAndPostNewArticles();
});
```

### Customize Message Format

Edit `src/formatter.ts` to change how posts are formatted:

```typescript
export function formatSimpleMessage(post: BlogPost, maxLength = 280): string {
  // Customize your message format here
  const hashtags = "#Salesforce #SalesforceDeveloper";
  return `📝 ${post.title}\n\n${post.link}\n\n${hashtags}`;
}
```

## Monitoring

Check the logs in Deno Deploy dashboard to monitor:

- New posts detected
- Successful posts to each platform
- Any errors or retry attempts

## Troubleshooting

### Posts not appearing

- Check environment variables are set correctly
- Verify API credentials are valid
- Check Deno Deploy logs for errors

### Duplicate posts

- The Deno KV database tracks posted articles by GUID
- If you need to reset, clear the KV store in Deno Deploy

### Rate limiting

- The app includes 2-second delays between posts
- Retry logic handles temporary failures

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
