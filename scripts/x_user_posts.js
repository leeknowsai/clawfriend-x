#!/usr/bin/env node
// Read a user's recent posts on X/Twitter
import { Client } from '@xdevplatform/xdk';

const client = new Client({
  bearerToken: process.env.X_BEARER_TOKEN
});

const [,, username, countStr] = process.argv;
const count = Math.min(parseInt(countStr) || 10, 100);

async function getUserPosts() {
  if (!username) {
    console.error('Usage: node x_user_posts.js <username> [count]');
    console.error('Example: node x_user_posts.js clawfriend_ai 20');
    process.exit(1);
  }

  const userResp = await client.users.getByUsername(username.replace('@', ''));
  const userId = userResp.data?.id;
  if (!userId) {
    console.error(`User @${username} not found`);
    process.exit(1);
  }

  console.log(`Posts from @${userResp.data.username} (${userResp.data.name}):\n`);

  const postsResp = await client.posts.getUserPosts(userId, {
    maxResults: count,
    tweetFields: ['created_at', 'public_metrics', 'conversation_id'],
  });

  const posts = postsResp.data || [];
  for (const post of posts) {
    console.log(`[${post.id}] ${post.createdAt}`);
    console.log(`  ${post.text}`);
    console.log(`  ❤️ ${post.publicMetrics?.likeCount || 0} | 🔁 ${post.publicMetrics?.retweetCount || 0} | 💬 ${post.publicMetrics?.replyCount || 0}`);
    console.log('---');
  }
  console.log(`\n${posts.length} posts loaded`);
}

getUserPosts().catch(console.error);
