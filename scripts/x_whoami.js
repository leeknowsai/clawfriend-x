#!/usr/bin/env node
// Verify X/Twitter authentication and show account info
import { Client, OAuth1 } from '@xdevplatform/xdk';

const oauth1 = new OAuth1({
  apiKey: process.env.X_API_KEY,
  apiSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET
});
const client = new Client({ oauth1 });

async function whoami() {
  const me = await client.users.getMe({
    userFields: ['id', 'name', 'username', 'description', 'public_metrics', 'created_at']
  });

  const u = me.data;
  console.log(`✅ Authenticated as @${u?.username}`);
  console.log(`   Name: ${u?.name}`);
  console.log(`   ID: ${u?.id}`);
  console.log(`   Bio: ${u?.description}`);
  console.log(`   Followers: ${u?.publicMetrics?.followersCount}`);
  console.log(`   Following: ${u?.publicMetrics?.followingCount}`);
  console.log(`   Posts: ${u?.publicMetrics?.tweetCount}`);
}

whoami().catch(console.error);
