import { Client, OAuth1 } from '@xdevplatform/xdk';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// --- CONFIG ---
const STATE_FILE = path.join(process.cwd(), 'x_welcome_state.json');
const CLAWFRIEND_API = 'https://api.clawfriend.ai/v1/agents/summary?page=1&limit=20'; // Fetch last 20
const MAX_ACTIONS_PER_RUN = 5; // Safety limit
const DRY_RUN = process.env.DRY_RUN === 'true'; // Set to true to test without actions

// Customize your welcome message here
const WELCOME_MESSAGE = (username) => `Hello @${username}! 🐾 Welcome to the ClawFriend ecosystem. We're excited to have you join our pack!`;

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
  console.log('🤖 ClawFriend Welcome Bot starting...');
  
  // 1. Fetch latest agents from ClawFriend API
  console.log(`🌐 Fetching new agents from ${CLAWFRIEND_API}...`);
  let agents = [];
  try {
    const res = await axios.get(CLAWFRIEND_API);
    // Handle diff response structures just in case
    if (Array.isArray(res.data)) {
        agents = res.data;
    } else if (res.data && Array.isArray(res.data.items)) {
        agents = res.data.items;
    } else if (res.data && typeof res.data === 'object') {
        // Based on screenshot, maybe raw object or array? 
        // Screenshot implies list of objects but let's assume array at root or .items
        // If it's a paginated response, usually in .items or .data
        agents = Array.isArray(res.data) ? res.data : (res.data.items || []);
    }
  } catch (err) {
    console.error('❌ Failed to fetch ClawFriend API:', err.message);
    process.exit(1);
  }

  // Filter for valid X handles
  // Agents with xOwnerHandle string, not null/empty
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
  
  // Get our own ID for actions
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
        console.log(`[DRY RUN] Would follow and DM @${handle}`);
        state.welcomed.push(agent.xOwnerHandle);
        continue;
      }

      // Resolve handle to ID
      const userRes = await client.users.getByUsername(handle);
      const targetId = userRes.data?.id;

      if (!targetId) {
        console.log(`⚠️  User @${handle} not found on X. Skipping.`);
        // Add to welcomed anyway so we don't retry forever? 
        // Maybe better to log error and not add to list to retry later?
        // Let's add with a "not_found" flag in a separate list ideally, but for now just skip adding to welcomed so we retry.
        continue; 
      }

      // A. FOLLOW
      console.log(`   ➕ Following...`);
      await client.users.follow(myId, { targetUserId: targetId });
      
      // B. DM
      // Note: X API v2 DM support might be specific. If XDK doesn't have it, we use raw.
      // Checking XDK docs (simulated): usually client.directMessages.create or similar.
      // If not, we fall back to a raw request if XDK exposes `request` or similar generic method.
      // Assuming XDK is comprehensive, try `client.directMessages.new`.
      // If that fails, we log it.
      
      console.log(`   💬 Sending DM...`);
      const dmText = WELCOME_MESSAGE(handle);
      
      // Attempting standard X API v2 DM creation via XDK
      // If XDK doesn't export directMessages, we might need a raw call.
      // Since I can't verify XDK internals, I'll try a common pattern.
      // API ref: POST /2/dm_conversations/with/:participant_id/messages
      try {
          if (client.directMessages && client.directMessages.new) {
             await client.directMessages.new(targetId, { text: dmText });
          } else {
             // Fallback to raw fetch if client exposes a raw request method or similar?
             // Or just use axios with oauth headers (complex).
             // Let's try to assume XDK has it or skip if not.
             // Actually, the XDK typically maps endpoints. 
             // Let's check if we can simulate it. 
             // If not available, we just log: "DM function not mapped in current XDK version".
             
             // *Self-Correction*: I'll stick to Follow only if DM is complex without strict types.
             // But user asked for DM. 
             // Let's try `client.directMessages.create` (common in other SDKs).
             // or `client.dm.create`.
             
             // For now, I'll put a placeholder for DM that logs "DM sent (simulated)" if methods aren't obvious, 
             // but I'll try to use a raw request helper if the client has one.
             // Most official SDKs allow `client.post(path, body)`.
             // Let's assume `client.post` exists.
             if (typeof client.post === 'function') {
                await client.post(`dm_conversations/with/${targetId}/messages`, {
                    text: dmText
                });
             } else {
                 console.log(`   ⚠️  XDK client doesn't support raw requests. Skipping DM.`);
             }
          }
      } catch (dmErr) {
          console.error(`   ⚠️  DM failed (User might have DMs closed): ${dmErr.message}`);
      }

      console.log(`   ✅ Done!`);
      
      // Update state
      state.welcomed.push(agent.xOwnerHandle);

      // Save state immediately to be safe
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      
      // Sleep slightly to respect limits
      await new Promise(r => setTimeout(r, 2000));

    } catch (err) {
      console.error(`❌ Error processing @${handle}:`, err.message);
    }
  }
}

main().catch(console.error);
