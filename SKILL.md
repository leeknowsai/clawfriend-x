---
name: clawfriend-x
description: Read and write to X/Twitter using the official XDK TypeScript SDK (X API v2). Search posts, read timelines, post tweets, reply, retweet, like, and monitor mentions for ClawFriend.ai. Uses OAuth 1.0a for full read+write access.
metadata: { "openclaw": { "emoji": "🐦", "requires": { "env": ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET", "X_BEARER_TOKEN"], "node": ">=18" } } }
---

# ClawFriend X — Official XDK Skill

## Purpose

Read and write to X/Twitter using the **official XDK TypeScript SDK** (`@xdevplatform/xdk`). This is the first-party SDK from X, meaning it's stable, type-safe, and won't get your account suspended like unofficial tools.

## When to use this skill

- User asks to read tweets, timeline, mentions, or search X
- User asks to post a tweet, reply, retweet, like, or follow someone
- Cron job triggers X content creation or monitoring
- Any task involving X/Twitter API interaction

## Prerequisites

### 1. Install the XDK

```bash
npm install @xdevplatform/xdk
```

### 2. Environment variables

You need 5 keys from the X Developer Portal (https://developer.x.com/en/portal):

```bash
# App-level (read-only public data)
X_BEARER_TOKEN=your-bearer-token

# User-level OAuth 1.0a (read + write on behalf of your account)
X_API_KEY=your-consumer-api-key
X_API_SECRET=your-consumer-api-secret
X_ACCESS_TOKEN=your-access-token
X_ACCESS_TOKEN_SECRET=your-access-token-secret
```

**Where to find these:**
1. Go to https://developer.x.com → your project → your app
2. **Keys and tokens** tab
3. **Consumer Keys** → API Key + API Secret
4. **Authentication Tokens** → Generate Access Token & Secret (with Read+Write permission)
5. **Bearer Token** → Generate

## Authentication

The XDK supports 2 auth modes. Use the right one depending on the task:

### Bearer Token (read-only, public data)

Best for: searching posts, looking up users, reading public timelines.

```javascript
import { Client } from '@xdevplatform/xdk';

const client = new Client({
  bearerToken: process.env.X_BEARER_TOKEN
});
```

### OAuth 1.0a (read + write, user actions)

Best for: posting tweets, replying, liking, retweeting, following, reading your own timeline/mentions.

```javascript
import { Client, OAuth1 } from '@xdevplatform/xdk';

const oauth1 = new OAuth1({
  apiKey: process.env.X_API_KEY,
  apiSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET
});

const client = new Client({ oauth1: oauth1 });
```

**Rule of thumb:**
- Reading public data → Bearer Token (simpler, faster)
- Anything that acts as YOUR account → OAuth 1.0a (required)

## Scripts

All scripts live in `scripts/` and can be run directly with Node.js.

---

### Read Operations

#### Search recent posts

```bash
node scripts/x_search.js "ClawFriend OR OpenClaw" 10
```

```javascript
// scripts/x_search.js
import { Client } from '@xdevplatform/xdk';

const client = new Client({
  bearerToken: process.env.X_BEARER_TOKEN
});

const [,, query, maxStr] = process.argv;
const maxResults = parseInt(maxStr) || 10;

async function search() {
  const results = await client.posts.searchRecent({
    query: query,
    maxResults: maxResults,
    tweetFields: ['created_at', 'author_id', 'public_metrics', 'conversation_id']
  });

  const posts = results.data || [];
  for (const post of posts) {
    console.log(`[${post.id}] ${post.text}`);
    console.log(`  ❤️ ${post.publicMetrics?.likeCount || 0} | 🔁 ${post.publicMetrics?.retweetCount || 0} | 💬 ${post.publicMetrics?.replyCount || 0}`);
    console.log('---');
  }
  console.log(`\nFound ${posts.length} posts`);
}

search().catch(console.error);
```

#### Read a user's recent posts

```bash
node scripts/x_user_posts.js clawfriend_ai 20
```

```javascript
// scripts/x_user_posts.js
import { Client } from '@xdevplatform/xdk';

const client = new Client({
  bearerToken: process.env.X_BEARER_TOKEN
});

const [,, username, countStr] = process.argv;
const count = parseInt(countStr) || 10;

async function getUserPosts() {
  // First look up user ID by username
  const userResp = await client.users.getByUsername(username.replace('@', ''));
  const userId = userResp.data?.id;
  if (!userId) {
    console.error(`User @${username} not found`);
    process.exit(1);
  }

  console.log(`Posts from @${userResp.data.username} (${userResp.data.name}):\n`);

  // Then fetch their posts
  const postsResp = await client.posts.getUserPosts(userId, {
    maxResults: count,
    tweetFields: ['created_at', 'public_metrics', 'conversation_id']
  });

  const posts = postsResp.data || [];
  for (const post of posts) {
    console.log(`[${post.id}] ${post.createdAt}`);
    console.log(`  ${post.text}`);
    console.log(`  ❤️ ${post.publicMetrics?.likeCount || 0} | 🔁 ${post.publicMetrics?.retweetCount || 0} | 💬 ${post.publicMetrics?.replyCount || 0}`);
    console.log('---');
  }
}

getUserPosts().catch(console.error);
```

#### Read your own mentions

```bash
node scripts/x_mentions.js 20
```

```javascript
// scripts/x_mentions.js
import { Client, OAuth1 } from '@xdevplatform/xdk';

const oauth1 = new OAuth1({
  apiKey: process.env.X_API_KEY,
  apiSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET
});
const client = new Client({ oauth1 });

const [,, countStr] = process.argv;
const count = parseInt(countStr) || 10;

async function getMentions() {
  // Get our own user ID first
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
    console.log('---');
  }
  console.log(`\n${posts.length} mentions found`);
}

getMentions().catch(console.error);
```

#### Look up a single post by URL or ID

```bash
node scripts/x_read.js 1234567890123456789
```

```javascript
// scripts/x_read.js
import { Client } from '@xdevplatform/xdk';

const client = new Client({
  bearerToken: process.env.X_BEARER_TOKEN
});

const [,, input] = process.argv;
// Extract ID from URL or use as-is
const tweetId = input.includes('/status/') 
  ? input.split('/status/')[1].split('?')[0] 
  : input;

async function readPost() {
  const resp = await client.posts.getPost(tweetId, {
    tweetFields: ['created_at', 'author_id', 'public_metrics', 'conversation_id', 'in_reply_to_user_id'],
    expansions: ['author_id'],
    userFields: ['username', 'name']
  });

  const post = resp.data;
  const author = resp.includes?.users?.[0];

  console.log(`@${author?.username || 'unknown'} (${author?.name || ''}):`);
  console.log(post.text);
  console.log(`\n❤️ ${post.publicMetrics?.likeCount || 0} | 🔁 ${post.publicMetrics?.retweetCount || 0} | 💬 ${post.publicMetrics?.replyCount || 0}`);
  console.log(`Posted: ${post.createdAt}`);
  console.log(`ID: ${post.id}`);
}

readPost().catch(console.error);
```

---

### Write Operations

All write operations require **OAuth 1.0a** auth.

#### Post a new tweet

```bash
node scripts/x_post.js "Hello from ClawFriend! 🐾"
```

```javascript
// scripts/x_post.js
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
    process.exit(1);
  }

  const resp = await client.posts.createPost({ text });

  console.log(`Posted! Tweet ID: ${resp.data?.id}`);
  console.log(`https://x.com/i/status/${resp.data?.id}`);
}

post().catch(console.error);
```

#### Reply to a tweet

```bash
node scripts/x_reply.js 1234567890123456789 "Great take! What about..."
```

```javascript
// scripts/x_reply.js
import { Client, OAuth1 } from '@xdevplatform/xdk';

const oauth1 = new OAuth1({
  apiKey: process.env.X_API_KEY,
  apiSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET
});
const client = new Client({ oauth1 });

const [,, replyToId, ...textParts] = process.argv;
const text = textParts.join(' ');

async function reply() {
  if (!replyToId || !text) {
    console.error('Usage: node x_reply.js <tweet_id> <reply text>');
    process.exit(1);
  }

  const resp = await client.posts.createPost({
    text,
    reply: { inReplyToTweetId: replyToId }
  });

  console.log(`Replied! Tweet ID: ${resp.data?.id}`);
  console.log(`https://x.com/i/status/${resp.data?.id}`);
}

reply().catch(console.error);
```

#### Post a thread

```bash
node scripts/x_thread.js "First tweet of thread" "Second tweet" "Third tweet 🧵"
```

```javascript
// scripts/x_thread.js
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
    process.exit(1);
  }

  let previousId = null;
  for (let i = 0; i < tweets.length; i++) {
    const body = { text: tweets[i] };
    if (previousId) {
      body.reply = { inReplyToTweetId: previousId };
    }

    const resp = await client.posts.createPost(body);
    previousId = resp.data?.id;
    console.log(`[${i + 1}/${tweets.length}] Posted: ${resp.data?.id}`);
  }

  console.log(`\nThread posted! ${tweets.length} tweets`);
  console.log(`https://x.com/i/status/${previousId}`);
}

postThread().catch(console.error);
```

#### Like a tweet

```bash
node scripts/x_like.js 1234567890123456789
```

```javascript
// scripts/x_like.js
import { Client, OAuth1 } from '@xdevplatform/xdk';

const oauth1 = new OAuth1({
  apiKey: process.env.X_API_KEY,
  apiSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET
});
const client = new Client({ oauth1 });

const [,, tweetId] = process.argv;

async function like() {
  const me = await client.users.getMe();
  await client.likes.like(me.data?.id, { tweetId });
  console.log(`Liked tweet ${tweetId}`);
}

like().catch(console.error);
```

#### Retweet

```bash
node scripts/x_retweet.js 1234567890123456789
```

```javascript
// scripts/x_retweet.js
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
  const me = await client.users.getMe();
  await client.posts.retweet(me.data?.id, { tweetId });
  console.log(`Retweeted ${tweetId}`);
}

retweet().catch(console.error);
```

#### Quote tweet

```bash
node scripts/x_quote.js 1234567890123456789 "This is interesting because..."
```

```javascript
// scripts/x_quote.js
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
  const resp = await client.posts.createPost({
    text,
    quoteTweetId
  });
  console.log(`Quote tweeted! ${resp.data?.id}`);
  console.log(`https://x.com/i/status/${resp.data?.id}`);
}

quote().catch(console.error);
```

#### Follow / Unfollow

```bash
node scripts/x_follow.js clawfriend_ai
node scripts/x_unfollow.js clawfriend_ai
```

```javascript
// scripts/x_follow.js
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
  const me = await client.users.getMe();
  const target = await client.users.getByUsername(username.replace('@', ''));
  
  if (!target.data?.id) {
    console.error(`User @${username} not found`);
    process.exit(1);
  }

  await client.users.follow(me.data?.id, { targetUserId: target.data.id });
  console.log(`Followed @${username}`);
}

follow().catch(console.error);
```

---

### Monitoring & Analytics

#### Check who you are (verify auth)

```bash
node scripts/x_whoami.js
```

```javascript
// scripts/x_whoami.js
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
```


---

### Community Growth

#### Welcome new ClawFriend agents
Automatically fetch new agents from ClawFriend API, follow their X account, and send a welcome DM.

```bash
node scripts/x_welcome_new_users.js
```

**Features:**
- Dedupes users (checks `x_welcome_state.json`)
- Follows the user
- Sends a welcome DM (requires `dm.write` permission on Access Token)
- Safety limit: 5 users per run (customizable in script)

**Cron Recommendation:**
Run this every hour to welcome new users promptly.

```bash
# Example cron entry
0 * * * * cd /path/to/clawfriend-x && node scripts/x_welcome_new_users.js >> welcome.log 2>&1
```

---

## ClawFriend Social Cron Integration

This skill pairs perfectly with the `clawfriend-social` skill. Here's how to combine them for automated X monitoring + Telegram community engagement:

### Monitor X mentions and relay to Telegram

Add this to your cron routine:

```
Every 15 minutes:
1. Run x_mentions.js → check for new mentions of @clawfriend_ai
2. Run x_search.js "ClawFriend OR OpenClaw" → find community discussions
3. Analyze results → craft engaging replies or Telegram posts
4. Post replies via x_reply.js (on X) and post_to_cf.js (in Telegram)
5. Log activity to workspace/x_activity_log.jsonl
```

### Cross-post highlights to Telegram

When you find a banger tweet about ClawFriend:

```bash
# Read the tweet
node scripts/x_read.js 1234567890

# Post highlight to CF Telegram topic
node scripts/post_to_cf.js 100 "🔥 Trending on X: @username just said..."
```

## Rate Limits

X API v2 uses pay-per-usage pricing now. Key limits to keep in mind:

| Endpoint | Limit |
|----------|-------|
| Post creation | 100 posts per 24 hours per user |
| Search recent | Based on your plan credits |
| User timeline | Based on your plan credits |
| Likes | 1000 per 24 hours per user |
| Follows | 400 per 24 hours per user |

Monitor your usage at https://developer.x.com/en/portal

## Golden Rules

1. **Official API = Safe** — No risk of account suspension
2. **Bearer for reading, OAuth for writing** — Use the right auth for the job
3. **Respect rate limits** — Check your credit balance regularly
4. **Quality over quantity** — 1 thoughtful reply beats 10 generic ones
5. **Don't spam** — X will throttle or suspend aggressive posting
6. **Always test with x_whoami.js first** — Make sure auth works before doing anything else
