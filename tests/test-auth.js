require('dotenv').config();
const fs = require('fs');
const path = require('path');
const CJAuth = require('../cj-api/auth');

async function testAuth() {
  console.log('🔐 Testing CJ Authentication...\n');

  if (!process.env.CJ_API_KEY) {
    console.error('❌ ERROR: CJ_API_KEY not found in .env file!');
    console.log('Add your CJ API key to .env file first.');
    process.exit(1);
  }

  console.log('✓ API Key found:', process.env.CJ_API_KEY.substring(0, 20) + '...');

  const auth = new CJAuth();

  try {
    const token = await auth.getAccessToken();

    if (!token) throw new Error('No token returned');

    console.log('✅ Access token obtained!');
    console.log('   Open ID:', auth.openId);

    // Save openId to .env
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    if (envContent.includes('CJ_OPEN_ID=GET_THIS_AFTER_FIRST_AUTH_CALL')) {
      envContent = envContent.replace(
        /CJ_OPEN_ID=GET_THIS_AFTER_FIRST_AUTH_CALL/,
        `CJ_OPEN_ID=${auth.openId}`
      );
    } else if (envContent.match(/CJ_OPEN_ID=.*/)) {
      envContent = envContent.replace(
        /CJ_OPEN_ID=.*/,
        `CJ_OPEN_ID=${auth.openId}`
      );
    } else {
      envContent += `\nCJ_OPEN_ID=${auth.openId}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('✓ openId saved to .env');

    // Test API call
    const CJClient = require('../cj-api/client');
    const client = new CJClient();
    const categories = await client.getCategories();

    if (categories.code === 200) {
      console.log('✅ Categories API works!');
      console.log('   Top-level categories:', categories.data?.length || 0);
    }

    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('\n❌ Authentication failed!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    process.exit(1);
  }
}

testAuth();