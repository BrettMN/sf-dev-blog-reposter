import type { BlogPost } from "./rss.ts";

export interface FormattedMessage {
  text: string;
  url: string;
}

export function formatMessage(post: BlogPost): FormattedMessage {
  const hashtags = "#Salesforce #SalesforceDeveloper";

  // Create the message text
  const message =
    `📝 New Salesforce Developer Blog Post!\n\n${post.title}\n\n${post.link}\n\n${hashtags}`;

  return {
    text: message,
    url: post.link,
  };
}

export function formatSimpleMessage(post: BlogPost, maxLength = 280): string {
  const hashtags = "#Salesforce #SalesforceDeveloper";
  const baseMessage = `📝 ${post.title}\n\n${post.link}\n\n${hashtags}`;

  // If the message is too long, truncate the title
  if (baseMessage.length > maxLength) {
    const availableLength = maxLength - post.link.length - hashtags.length - 10; // 10 for emojis, newlines, etc
    const truncatedTitle = post.title.substring(0, availableLength - 3) + "...";
    return `📝 ${truncatedTitle}\n\n${post.link}\n\n${hashtags}`;
  }

  return baseMessage;
}
