#!/usr/bin/env node
// Reply to a specific tweet on X/Twitter
import { Client, OAuth1 } from '@xdevplatform/xdk';

const oauth1 = new OAuth1({
  apiKey: process.env.X_API_KEY,
  apiSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET
});
const client = new Client({ oauth1 });

const [,, replyToId, ...textParts] = process.argv;
const text = textParts.join(' ');

async function reply() {
  if (!replyToId || !text) {
    console.error('Usage: node x_reply.js <tweet_id> <reply text>');
    console.error('Example: node x_reply.js 1234567890 "Great take!"');
    process.exit(1);
  }

  const resp = await client.posts.createPost({
    text,
    reply: { inReplyToTweetId: replyToId }
  });

  console.log(`✅ Replied!`);
  console.log(`   Tweet ID: ${resp.data?.id}`);
  console.log(`   URL: https://x.com/i/status/${resp.data?.id}`);
}

reply().catch(console.error);
