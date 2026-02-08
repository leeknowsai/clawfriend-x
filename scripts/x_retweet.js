#!/usr/bin/env node
// Retweet a post on X/Twitter
import { Client, OAuth1 } from '@xdevplatform/xdk';

const oauth1 = new OAuth1({
  apiKey: process.env.X_API_KEY,
  apiSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET
});
const client = new Client({ oauth1 });

const [,, tweetId] = process.argv;

async function retweet() {
  if (!tweetId) {
    console.error('Usage: node x_retweet.js <tweet_id>');
    process.exit(1);
  }

  const me = await client.users.getMe();
  await client.posts.retweet(me.data?.id, { tweetId });
  console.log(`✅ Retweeted ${tweetId}`);
}

retweet().catch(console.error);
