#!/usr/bin/env node

/**
 * Test script for NHL 26 API connection
 * This script tests the updated API configuration and platform settings
 */

const axios = require('axios');

// Configuration
const EA_NHL_API_BASE_URL = 'https://proclubs.ea.com/api/nhl';
const EA_NHL_PLATFORM = 'common-gen5';
const EA_NHL_MATCH_TYPE = 'club_private';

// Test club IDs - you can add more here
const TEST_CLUB_IDS = [
  '23708', // From the provided NHL 26 URL
  // Add more club IDs here to test
];

const EA_NHL_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0',
  'Accept': 'text/html,application/xhtml+xml,application/xml',
  'Accept-Language': 'en-US,en',
  'Accept-Encoding': 'gzip, deflate, br',
  'Content-Type': 'application/json',
  'Connection': 'keep-alive'
};

async function testApiConnection(clubId) {
  console.log(`\n🧪 Testing NHL 26 API with Club ID: ${clubId}`);
  console.log(`Platform: ${EA_NHL_PLATFORM}`);
  console.log('=' .repeat(50));
  
  try {
    // Test basic API connectivity
    const testUrl = `${EA_NHL_API_BASE_URL}/clubs/matches`;
    const params = {
      clubIds: clubId,
      platform: EA_NHL_PLATFORM,
      matchType: EA_NHL_MATCH_TYPE
    };

    console.log(`📡 Making request to: ${testUrl}`);
    console.log(`📋 Parameters:`, params);

    const response = await axios.get(testUrl, {
      params,
      headers: EA_NHL_HEADERS,
      timeout: 10000
    });

    console.log(`✅ Response Status: ${response.status}`);
    console.log(`📊 Response Headers:`, Object.keys(response.headers));
    
    if (response.data) {
      console.log(`📄 Response Data Type: ${typeof response.data}`);
      console.log(`📄 Response Data Keys:`, Object.keys(response.data));
    }

    return {
      success: true,
      status: response.status,
      platform: EA_NHL_PLATFORM,
      version: '26',
      clubId: clubId
    };

  } catch (error) {
    console.log(`❌ Error testing NHL 26 API for Club ID ${clubId}:`);
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Status Text: ${error.response.statusText}`);
      console.log(`   Headers:`, error.response.headers);
      
      if (error.response.data) {
        console.log(`   Data:`, JSON.stringify(error.response.data, null, 2));
      }
    } else if (error.request) {
      console.log(`   No response received: ${error.message}`);
    } else {
      console.log(`   Request setup error: ${error.message}`);
    }

    return {
      success: false,
      error: error.message,
      platform: EA_NHL_PLATFORM,
      version: '26',
      clubId: clubId
    };
  }
}

async function main() {
  console.log('🚀 NHL 26 API Connection Test');
  console.log('Testing NHL 26 API with multiple club IDs...\n');

  const results = [];

  // Test each club ID
  for (const clubId of TEST_CLUB_IDS) {
    const result = await testApiConnection(clubId);
    results.push(result);
  }

  // Summary
  console.log('\n📋 Test Summary');
  console.log('=' .repeat(50));
  
  let successCount = 0;
  results.forEach(result => {
    const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
    console.log(`Club ID ${result.clubId}: ${status}`);
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
    } else {
      successCount++;
    }
  });

  console.log(`\n🎯 Overall: ${successCount}/${results.length} club IDs tested successfully`);

  if (successCount > 0) {
    console.log('\n🎉 NHL 26 API is working! Your app is ready to use NHL 26 data with any valid club ID.');
    console.log('💡 To test with other club IDs, add them to the TEST_CLUB_IDS array in this script.');
  } else {
    console.log('\n⚠️  Note: API endpoints may not be publicly accessible or may require authentication');
    console.log('   This is normal for EA Sports APIs - they typically require proper authentication');
  }
}

// Run the test
main().catch(console.error);
