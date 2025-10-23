## Intent

The goal of this project is to scrap the Salesforce Developer Blog and post
messages to Bluesky and Mastodon when new posts are published. Checking for new
posts once an hour.

## Technology

This will be written with Typescript and built with Deno and deployed via Deno
Deploy.

Deno Deploy has a Cron feature to perform timed tasks
https://docs.deno.com/examples/cron/
