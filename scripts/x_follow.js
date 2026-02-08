#!/usr/bin/env node
// Follow a user on X/Twitter
import { Client, OAuth1 } from '@xdevplatform/xdk';

const oauth1 = new OAuth1({
  apiKey: process.env.X_API_KEY,
  apiSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET
});
const client = new Client({ oauth1 });

const [,, username] = process.argv;

async function follow() {
  if (!username) {
    console.error('Usage: node x_follow.js <username>');
    process.exit(1);
  }

  const me = await client.users.getMe();
  const target = await client.users.getByUsername(username.replace('@', ''));

  if (!target.data?.id) {
    console.error(`User @${username} not found`);
    process.exit(1);
  }

  await client.users.follow(me.data?.id, { targetUserId: target.data.id });
  console.log(`✅ Followed @${target.data.username}`);
}

follow().catch(console.error);
