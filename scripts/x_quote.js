#!/usr/bin/env node
// Quote tweet on X/Twitter
import { Client, OAuth1 } from '@xdevplatform/xdk';

const oauth1 = new OAuth1({
  apiKey: process.env.X_API_KEY,
  apiSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET
});
const client = new Client({ oauth1 });

const [,, quoteTweetId, ...textParts] = process.argv;
const text = textParts.join(' ');

async function quote() {
  if (!quoteTweetId || !text) {
    console.error('Usage: node x_quote.js <tweet_id> <your comment>');
    process.exit(1);
  }

  const resp = await client.posts.createPost({
    text,
    quoteTweetId
  });

  console.log(`✅ Quote tweeted!`);
  console.log(`   Tweet ID: ${resp.data?.id}`);
  console.log(`   URL: https://x.com/i/status/${resp.data?.id}`);
}

quote().catch(console.error);
