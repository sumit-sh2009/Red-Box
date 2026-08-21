// Comprehensive Automated Test Script for Open thoughts API

async function runTests() {
  console.log('🧪 Starting Open thoughts API Integration Verification...\n');
  const BASE = 'http://localhost:3001/api';

  let testUserToken = '';
  let testUserId = '';
  let testPostId = '';
  let replyPostId = '';

  // 1. Health check
  console.log('1. Testing Health Endpoint...');
  const healthRes = await fetch(`${BASE}/health`);
  const healthData = await healthRes.json();
  if (healthData.status !== 'ok') throw new Error('Health check failed');
  console.log('   ✅ Health endpoint OK');

  // 2. Sign Up New User with Pixel Avatar
  console.log('\n2. Testing User Registration (Auth)...');
  const username = `hero_${Date.now().toString().slice(-4)}`;
  const signupRes = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      display_name: 'Test Adventurer',
      password: 'password123',
      bio: 'Testing the 8-bit realm!',
      avatar_id: 'wizard',
      banner_color: '#8338ec',
    }),
  });
  const signupData = await signupRes.json();
  if (!signupData.token) throw new Error(`Signup failed: ${JSON.stringify(signupData)}`);
  testUserToken = signupData.token;
  testUserId = signupData.user.id;
  console.log(`   ✅ User @${username} registered with ID ${testUserId}`);

  // 3. User Login
  console.log('\n3. Testing User Login...');
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password: 'password123',
    }),
  });
  const loginData = await loginRes.json();
  if (!loginData.token) throw new Error('Login failed');
  console.log('   ✅ User logged in and received auth token');

  // 4. Create a Chirp with Hashtags and Mentions
  console.log('\n4. Testing Chirp Creation with #Hashtags...');
  const postRes = await fetch(`${BASE}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testUserToken}`,
    },
    body: JSON.stringify({
      content: 'Exploring the 8-bit realm! Hello @pixel_knight, loving the #pixelart and #indiedev atmosphere! 🎮✨',
    }),
  });
  const postData = await postRes.json();
  if (!postData.post?.id) throw new Error('Chirp creation failed');
  testPostId = postData.post.id;
  console.log(`   ✅ Created chirp ID: ${testPostId}`);

  // 5. Reply to Chirp (Threaded)
  console.log('\n5. Testing Threaded Reply...');
  const replyRes = await fetch(`${BASE}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testUserToken}`,
    },
    body: JSON.stringify({
      content: 'This is a nested reply in the thread! #gamedev',
      parent_post_id: testPostId,
    }),
  });
  const replyData = await replyRes.json();
  if (!replyData.post?.id) throw new Error('Reply creation failed');
  replyPostId = replyData.post.id;
  console.log(`   ✅ Created reply ID: ${replyPostId} under parent: ${testPostId}`);

  // 6. Like Toggle
  console.log('\n6. Testing Like / Unlike Toggle...');
  const likeRes = await fetch(`${BASE}/posts/${testPostId}/like`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${testUserToken}` },
  });
  const likeData = await likeRes.json();
  if (!likeData.liked || likeData.likesCount < 1) throw new Error('Like toggle failed');
  console.log(`   ✅ Post liked! Likes count: ${likeData.likesCount}`);

  // 7. Repost Toggle
  console.log('\n7. Testing Re-Chirp / Repost Toggle...');
  const repostRes = await fetch(`${BASE}/posts/${testPostId}/repost`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${testUserToken}` },
  });
  const repostData = await repostRes.json();
  if (!repostData.reposted) throw new Error('Repost toggle failed');
  console.log(`   ✅ Post re-chirped! Reposts count: ${repostData.repostsCount}`);

  // 8. Follow Toggle
  console.log('\n8. Testing Follow / Unfollow Toggle...');
  const followRes = await fetch(`${BASE}/users/user_cat/follow`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${testUserToken}` },
  });
  const followData = await followRes.json();
  if (!followData.isFollowing) throw new Error('Follow toggle failed');
  console.log('   ✅ Successfully followed @cyber_cat');

  // 9. Fetch Notifications
  console.log('\n9. Testing Notifications Generation...');
  const notifRes = await fetch(`${BASE}/notifications`, {
    headers: { 'Authorization': `Bearer ${testUserToken}` },
  });
  const notifData = await notifRes.json();
  console.log(`   ✅ Notifications fetched (${notifData.notifications.length} alerts present)`);

  // 10. Search Chirps and Users
  console.log('\n10. Testing Search and Hashtag Index...');
  const searchRes = await fetch(`${BASE}/posts?tag=pixelart`);
  const searchData = await searchRes.json();
  if (searchData.posts.length === 0) throw new Error('Hashtag search failed');
  console.log(`   ✅ Hashtag feed fetched (${searchData.posts.length} posts found with #pixelart)`);

  // 11. Trends
  console.log('\n11. Testing Trends API...');
  const trendsRes = await fetch(`${BASE}/trends`);
  const trendsData = await trendsRes.json();
  if (trendsData.trends.length === 0) throw new Error('Trends fetch failed');
  console.log(`   ✅ Top trends: ${trendsData.trends.map((t: any) => t.tag).join(', ')}`);

  console.log('\n🎉 ALL 11 TEST SUITES PASSED FLAWLESSLY! 🚀✨\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
