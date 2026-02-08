#!/usr/bin/env node
// Read a single post by ID or URL
import { Client } from '@xdevplatform/xdk';

const client = new Client({
  bearerToken: process.env.X_BEARER_TOKEN
});

const [,, input] = process.argv;

async function readPost() {
  if (!input) {
    console.error('Usage: node x_read.js <tweet_id_or_url>');
    process.exit(1);
  }

  const tweetId = input.includes('/status/')
    ? input.split('/status/')[1].split('?')[0]
    : input;

  const resp = await client.posts.getPost(tweetId, {
    tweetFields: ['created_at', 'author_id', 'public_metrics', 'conversation_id', 'in_reply_to_user_id'],
    expansions: ['author_id', 'referenced_tweets.id'],
    userFields: ['username', 'name']
  });

  const post = resp.data;
  const author = resp.includes?.users?.[0];

  console.log(`@${author?.username || 'unknown'} (${author?.name || ''}):`);
  console.log(post.text);
  console.log(`\n❤️ ${post.publicMetrics?.likeCount || 0} | 🔁 ${post.publicMetrics?.retweetCount || 0} | 💬 ${post.publicMetrics?.replyCount || 0}`);
  console.log(`Posted: ${post.createdAt}`);
  console.log(`ID: ${post.id}`);
  console.log(`URL: https://x.com/i/status/${post.id}`);
}

readPost().catch(console.error);
