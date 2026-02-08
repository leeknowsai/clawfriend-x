#!/usr/bin/env node
// Read your recent mentions on X/Twitter
import { Client, OAuth1 } from '@xdevplatform/xdk';

const oauth1 = new OAuth1({
  apiKey: process.env.X_API_KEY,
  apiSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET
});
const client = new Client({ oauth1 });

const [,, countStr] = process.argv;
const count = Math.min(parseInt(countStr) || 10, 100);

async function getMentions() {
  const me = await client.users.getMe();
  const myId = me.data?.id;
  console.log(`Mentions for @${me.data?.username}:\n`);

  const mentions = await client.posts.getUserMentions(myId, {
    maxResults: count,
    tweetFields: ['created_at', 'author_id', 'public_metrics', 'conversation_id'],
    expansions: ['author_id'],
    userFields: ['username', 'name']
  });

  const posts = mentions.data || [];
  const users = {};
  for (const u of mentions.includes?.users || []) {
    users[u.id] = u;
  }

  for (const post of posts) {
    const author = users[post.authorId] || {};
    console.log(`[${post.id}] @${author.username || 'unknown'} (${post.createdAt}):`);
    console.log(`  ${post.text}`);
    console.log(`  ❤️ ${post.publicMetrics?.likeCount || 0} | 🔁 ${post.publicMetrics?.retweetCount || 0} | 💬 ${post.publicMetrics?.replyCount || 0}`);
    console.log('---');
  }
  console.log(`\n${posts.length} mentions found`);
}

getMentions().catch(console.error);
