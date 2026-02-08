# 🐦 ClawFriend X — OpenClaw Skill

Read and write to X/Twitter using the **official XDK TypeScript SDK** from X Developer Platform.

## Why XDK instead of Bird?

| | Bird CLI | XDK (this skill) |
|---|---|---|
| Auth | Cookie-based (unofficial) | OAuth 1.0a (official) |
| Read | ✅ Safe | ✅ Safe |
| Write | ⚠️ Risk of suspension | ✅ Official, safe |
| API | Unofficial GraphQL | Official X API v2 |
| Stability | Can break anytime | Maintained by X team |

**TL;DR:** Use Bird for casual reading. Use this skill for anything that touches your account (posting, replying, liking).

## Setup

### 1. Install XDK

```bash
npm install @xdevplatform/xdk
```

### 2. Get your API keys

Go to https://developer.x.com → your project → your app → Keys and tokens:

- **API Key** (Consumer Key) → `X_API_KEY`
- **API Secret** (Consumer Secret) → `X_API_SECRET`
- **Access Token** → `X_ACCESS_TOKEN`
- **Access Token Secret** → `X_ACCESS_TOKEN_SECRET`
- **Bearer Token** → `X_BEARER_TOKEN`

⚠️ Access Token must have **Read and Write** permission.

### 3. Copy skill to workspace

```bash
cp -r clawfriend-x/ ~/clawd/skills/clawfriend-x/
```

### 4. Configure env vars

In `~/.openclaw/openclaw.json`:

```json
{
  "skills": {
    "entries": {
      "clawfriend-x": {
        "enabled": true,
        "env": {
          "X_API_KEY": "your-api-key",
          "X_API_SECRET": "your-api-secret",
          "X_ACCESS_TOKEN": "your-access-token",
          "X_ACCESS_TOKEN_SECRET": "your-access-token-secret",
          "X_BEARER_TOKEN": "your-bearer-token"
        }
      }
    }
  }
}
```

### 5. Test

```bash
node scripts/x_whoami.js
```

## Scripts

| Script | Action | Auth |
|--------|--------|------|
| `x_whoami.js` | Verify auth, show account | OAuth 1.0a |
| `x_search.js` | Search recent posts | Bearer |
| `x_user_posts.js` | Read user's posts | Bearer |
| `x_read.js` | Read single post | Bearer |
| `x_mentions.js` | Read your mentions | OAuth 1.0a |
| `x_post.js` | Post new tweet | OAuth 1.0a |
| `x_reply.js` | Reply to tweet | OAuth 1.0a |
| `x_thread.js` | Post thread | OAuth 1.0a |
| `x_like.js` | Like a tweet | OAuth 1.0a |
| `x_retweet.js` | Retweet | OAuth 1.0a |
| `x_quote.js` | Quote tweet | OAuth 1.0a |
| `x_follow.js` | Follow user | OAuth 1.0a |

## File Structure

```
clawfriend-x/
├── SKILL.md              # Main skill instructions
├── README.md             # This file
└── scripts/
    ├── x_whoami.js       # Verify auth
    ├── x_search.js       # Search posts
    ├── x_user_posts.js   # User's posts
    ├── x_read.js         # Read single post
    ├── x_mentions.js     # Your mentions
    ├── x_post.js         # Post tweet
    ├── x_reply.js        # Reply
    ├── x_thread.js       # Post thread
    ├── x_like.js         # Like
    ├── x_retweet.js      # Retweet
    ├── x_quote.js        # Quote tweet
    └── x_follow.js       # Follow user
```
