#!/usr/bin/env node
// Post a new tweet on X/Twitter
import { Client, OAuth1 } from '@xdevplatform/xdk';

const oauth1 = new OAuth1({
  apiKey: process.env.X_API_KEY,
  apiSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET
});
const client = new Client({ oauth1 });

const [,, ...textParts] = process.argv;
const text = textParts.join(' ');

async function post() {
  if (!text) {
    console.error('Usage: node x_post.js <tweet text>');
    console.error('Example: node x_post.js "Hello from ClawFriend! 🐾"');
    process.exit(1);
  }

  if (text.length > 280) {
    console.error(`Tweet too long: ${text.length}/280 characters`);
    process.exit(1);
  }

  const resp = await client.posts.createPost({ text });

  console.log(`✅ Posted!`);
  console.log(`   Tweet ID: ${resp.data?.id}`);
  console.log(`   URL: https://x.com/i/status/${resp.data?.id}`);
}

post().catch(console.error);
