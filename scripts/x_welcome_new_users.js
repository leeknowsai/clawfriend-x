import { Client, OAuth1 } from '@xdevplatform/xdk';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// --- CONFIG ---
const STATE_FILE = path.join(process.cwd(), 'x_welcome_state.json');
const CLAWFRIEND_API = 'https://api.clawfriend.ai/v1/agents/summary?page=1&limit=20'; // Fetch last 20
const MAX_ACTIONS_PER_RUN = 5; // Safety limit
const DRY_RUN = process.env.DRY_RUN === 'true';

// Reply message template
const WELCOME_REPLY_MESSAGE = (username) => `Welcome to the pack @${username}! 🐾 We're excited to have you in the ClawFriend ecosystem. Let's build something amazing together! 🚀`;

// --- SETUP ---
const oauth1 = new OAuth1({
  apiKey: process.env.X_API_KEY,
  apiSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET
});
const client = new Client({ oauth1 });

// Load state
let state = { welcomed: [] };
if (fs.existsSync(STATE_FILE)) {
  state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

async function main() {
  console.log('🤖 ClawFriend Welcome Bot starting (Reply Mode)...');

  // 1. Fetch latest agents from ClawFriend API
  console.log(`🌐 Fetching new agents from ${CLAWFRIEND_API}...`);
  let agents = [];
  try {
    const res = await axios.get(CLAWFRIEND_API);
    if (Array.isArray(res.data)) {
      agents = res.data;
    } else if (res.data && Array.isArray(res.data.items)) {
      agents = res.data.items;
    } else if (res.data && typeof res.data === 'object') {
      agents = Array.isArray(res.data) ? res.data : (res.data.items || []);
    }
  } catch (err) {
    console.error('❌ Failed to fetch ClawFriend API:', err.message);
    process.exit(1);
  }

  // Filter for agents with both Handle AND Verify Tweet ID
  // Assuming API provides `subject` which is the verify tweet ID or related field.
  // Wait, user said "reply ngay dưới link verify code của nó". 
  // Based on previous context (screenshot), the API returns "subject" which is like "0xc90e..." (wallet address?)
  // It does NOT seem to have a specific `verifyTweetId`.

  // CRITICAL: We need to know WHICH tweet to reply to.
  // If the API doesn't give us the "Verify Tweet ID", we have to SEARCH for it or guess.
  // BUT the user said "ngay dưới link verify code của nó". 
  // If the API (from screenshot) doesn't have it, we might need to search user's timeline for a specific pattern?

  // Let's assume for now we search for the MOST RECENT tweet that contains "verify" or "clawfriend.ai" from that user.
  // This is a reasonable fallback if the ID isn't in his API response.

  const validAgents = agents.filter(a => a.xOwnerHandle && a.xOwnerHandle.trim().length > 0);
  console.log(`📊 Found ${validAgents.length} agents with X handles.`);

  // 2. Identify new users
  const newUsers = validAgents.filter(a => !state.welcomed.includes(a.xOwnerHandle));

  if (newUsers.length === 0) {
    console.log('✅ No new users to welcome.');
    return;
  }

  console.log(`🆕 Found ${newUsers.length} new users to process.`);

  // 3. Process limit
  const toProcess = newUsers.slice(0, MAX_ACTIONS_PER_RUN);

  let myId;
  if (!DRY_RUN) {
    try {
      const me = await client.users.getMe();
      myId = me.data?.id;
      console.log(`🔑 Authenticated as @${me.data?.username} (${myId})`);
    } catch (e) {
      console.error('❌ Auth failed. Check env vars.');
      process.exit(1);
    }
  }

  for (const agent of toProcess) {
    const handle = agent.xOwnerHandle.replace('@', ''); // clean handle
    console.log(`\n👉 Processing: @${handle}...`);

    try {
      if (DRY_RUN) {
        console.log(`[DRY RUN] Would Find Verify Tweet -> Reply to @${handle}`);
        state.welcomed.push(agent.xOwnerHandle);
        continue;
      }

      // A. FOLLOW
      try {
        const userRes = await client.users.getByUsername(handle);
        const targetId = userRes.data?.id;
        if (targetId) {
          console.log(`   ➕ Following...`);
          await client.users.follow(myId, { targetUserId: targetId });

          // B. FIND VERIFY TWEET TO REPLY
          console.log(`   🔍 Finding verify tweet...`);
          // Fetch user's last 5 tweets
          const userPosts = await client.posts.getUserPosts(targetId, {
            maxResults: 5,
            tweetFields: ['created_at', 'text']
          });

          // Logic: Find tweet containing "verify" OR "clawfriend" OR "sig"
          // Or just reply to the pinned/latest tweet if not found? 
          // Ideally we find the specific verification tweet.
          const verifyTweet = userPosts.data?.find(t =>
            t.text.toLowerCase().includes('verify') ||
            t.text.toLowerCase().includes('clawfriend') ||
            t.text.toLowerCase().includes('signature')
          );

          if (verifyTweet) {
            console.log(`   📝 Found target tweet: ${verifyTweet.id}`);
            console.log(`   💬 Replying...`);

            await client.posts.createPost({
              text: WELCOME_REPLY_MESSAGE(handle),
              reply: { inReplyToTweetId: verifyTweet.id }
            });
            console.log(`   ✅ Replied successfully!`);
          } else {
            console.log(`   ⚠️ Could not find a 'verify' tweet. Skipping reply, but marked as welcomed.`);
          }

        } else {
          console.log(`   ⚠️ User not found. Skipping.`);
        }
      } catch (err) {
        console.error(`   ❌ Failed to process user actions: ${err.message}`);
      }

      // Update state
      state.welcomed.push(agent.xOwnerHandle);

      // Save state immediately
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

      await new Promise(r => setTimeout(r, 2000));

    } catch (err) {
      console.error(`❌ Error processing @${handle}:`, err.message);
    }
  }
}

main().catch(console.error);
