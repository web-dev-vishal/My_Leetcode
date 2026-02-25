import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const testOpenRouter = async () => {
  console.log('🧪 Testing OpenRouter API Connection...\n');

  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';

  if (!apiKey || apiKey === 'your-openrouter-api-key-here') {
    console.error('❌ ERROR: OPENROUTER_API_KEY not configured in .env file');
    console.log('\n📝 Steps to fix:');
    console.log('1. Go to https://openrouter.ai/');
    console.log('2. Sign up or log in');
    console.log('3. Navigate to "Keys" section');
    console.log('4. Create a new API key');
    console.log('5. Update .env file with your key\n');
    process.exit(1);
  }

  console.log('✅ API Key found');
  console.log(`📍 Base URL: ${baseURL}`);
  console.log(`🤖 Model: ${model}\n`);

  try {
    console.log('🔍 Testing connection to OpenRouter...');
    
    const response = await axios.post(
      `${baseURL}/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, OpenRouter is working!" if you can read this.'
          }
        ],
        max_tokens: 50
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:8080',
          'X-Title': 'LeetCode Clone Test'
        },
        timeout: 30000
      }
    );

    console.log('✅ Connection successful!\n');
    console.log('📊 Response Details:');
    console.log(`   Model: ${response.data.model}`);
    console.log(`   Response: ${response.data.choices[0]?.message?.content}`);
    console.log(`   Tokens Used: ${response.data.usage?.total_tokens || 'N/A'}`);
    console.log(`   Finish Reason: ${response.data.choices[0]?.finish_reason}\n`);

    console.log('🎉 OpenRouter integration is working correctly!');
    console.log('\n📚 Next steps:');
    console.log('1. Start your server: npm start');
    console.log('2. Import Postman collection from: postman/OpenRouter_AI_API.postman_collection.json');
    console.log('3. Follow OPENROUTER_TESTING_GUIDE.md for complete testing\n');

  } catch (error) {
    console.error('❌ Connection failed!\n');
    
    if (error.response) {
      console.error('📛 Error Details:');
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.error?.message || error.message}`);
      
      if (error.response.status === 401) {
        console.log('\n💡 This looks like an authentication error.');
        console.log('   - Check that your API key is correct');
        console.log('   - Make sure there are no extra spaces in .env file');
      } else if (error.response.status === 402) {
        console.log('\n💡 Payment required.');
        console.log('   - Add credits to your OpenRouter account');
        console.log('   - Visit: https://openrouter.ai/credits');
      } else if (error.response.status === 429) {
        console.log('\n💡 Rate limit exceeded.');
        console.log('   - Wait a moment and try again');
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏱️  Request timeout');
      console.log('   - Check your internet connection');
      console.log('   - OpenRouter might be experiencing issues');
    } else {
      console.error(`   ${error.message}`);
    }
    
    console.log('\n🔗 Useful links:');
    console.log('   - OpenRouter Dashboard: https://openrouter.ai/');
    console.log('   - OpenRouter Status: https://status.openrouter.ai/');
    console.log('   - OpenRouter Docs: https://openrouter.ai/docs\n');
    
    process.exit(1);
  }
};

testOpenRouter();
