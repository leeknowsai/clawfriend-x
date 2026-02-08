#!/usr/bin/env node
// Search recent posts on X/Twitter
import { Client } from '@xdevplatform/xdk';

const client = new Client({
  bearerToken: process.env.X_BEARER_TOKEN
});

const [,, query, maxStr] = process.argv;
const maxResults = Math.min(parseInt(maxStr) || 10, 100);

async function search() {
  if (!query) {
    console.error('Usage: node x_search.js <query> [max_results]');
    console.error('Example: node x_search.js "ClawFriend OR OpenClaw" 10');
    process.exit(1);
  }

  const results = await client.posts.searchRecent({
    query,
    maxResults,
    tweetFields: ['created_at', 'author_id', 'public_metrics', 'conversation_id'],
    expansions: ['author_id'],
    userFields: ['username', 'name']
  });

  const posts = results.data || [];
  const users = {};
  for (const u of results.includes?.users || []) {
    users[u.id] = u;
  }

  for (const post of posts) {
    const author = users[post.authorId] || {};
    console.log(`[${post.id}] @${author.username || 'unknown'} (${post.createdAt}):`);
    console.log(`  ${post.text}`);
    console.log(`  ❤️ ${post.publicMetrics?.likeCount || 0} | 🔁 ${post.publicMetrics?.retweetCount || 0} | 💬 ${post.publicMetrics?.replyCount || 0}`);
    console.log('---');
  }
  console.log(`\nFound ${posts.length} posts for query: "${query}"`);
}

search().catch(console.error);
