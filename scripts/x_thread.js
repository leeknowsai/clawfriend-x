#!/usr/bin/env node
// Post a thread (multiple connected tweets) on X/Twitter
import { Client, OAuth1 } from '@xdevplatform/xdk';

const oauth1 = new OAuth1({
  apiKey: process.env.X_API_KEY,
  apiSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET
});
const client = new Client({ oauth1 });

// Each argument is one tweet in the thread
const [,, ...tweets] = process.argv;

async function postThread() {
  if (tweets.length < 2) {
    console.error('Usage: node x_thread.js "tweet1" "tweet2" "tweet3" ...');
    console.error('Each argument becomes one tweet in the thread.');
    process.exit(1);
  }

  let previousId = null;
  const ids = [];

  for (let i = 0; i < tweets.length; i++) {
    const body = { text: tweets[i] };
    if (previousId) {
      body.reply = { inReplyToTweetId: previousId };
    }

    const resp = await client.posts.createPost(body);
    previousId = resp.data?.id;
    ids.push(previousId);
    console.log(`[${i + 1}/${tweets.length}] Posted: ${previousId}`);
  }

  console.log(`\n✅ Thread posted! ${tweets.length} tweets`);
  console.log(`   First: https://x.com/i/status/${ids[0]}`);
  console.log(`   Last:  https://x.com/i/status/${ids[ids.length - 1]}`);
}

postThread().catch(console.error);
