#!/usr/bin/env node

const https = require('https');

// Function to check if a URL returns 404
function checkUrlExists(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

async function checkMissingLogos() {
  try {
    // Get all clubs
    const clubsResponse = await fetch('https://ice-tilt-backend.onrender.com/api/clubs');
    const clubs = await clubsResponse.json();
    
    console.log(`Found ${clubs.length} clubs total\n`);
    
    const missingLogos = [];
    const workingLogos = [];
    const emptyLogos = [];
    
    for (const club of clubs) {
      if (!club.logoUrl || club.logoUrl.trim() === '') {
        emptyLogos.push(club);
        console.log(`❌ ${club.name} - Empty logoUrl`);
        continue;
      }
      
      const fullUrl = `https://ice-tilt-backend.onrender.com${club.logoUrl}`;
      const exists = await checkUrlExists(fullUrl);
      
      if (exists) {
        workingLogos.push(club);
        console.log(`✅ ${club.name} - Logo exists`);
      } else {
        missingLogos.push(club);
        console.log(`❌ ${club.name} - Logo missing (${club.logoUrl})`);
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`✅ Working logos: ${workingLogos.length}`);
    console.log(`❌ Missing logos: ${missingLogos.length}`);
    console.log(`⚠️  Empty logos: ${emptyLogos.length}`);
    
    if (missingLogos.length > 0) {
      console.log(`\n🗑️  CLUBS TO DELETE (missing logos):`);
      missingLogos.forEach(club => {
        console.log(`- ${club.name} (ID: ${club._id})`);
      });
    }
    
    if (emptyLogos.length > 0) {
      console.log(`\n🗑️  CLUBS TO DELETE (empty logos):`);
      emptyLogos.forEach(club => {
        console.log(`- ${club.name} (ID: ${club._id})`);
      });
    }
    
    // Save the results for deletion script
    const toDelete = [...missingLogos, ...emptyLogos];
    require('fs').writeFileSync('/tmp/clubs_to_delete.json', JSON.stringify(toDelete, null, 2));
    console.log(`\n💾 Saved ${toDelete.length} clubs to delete in /tmp/clubs_to_delete.json`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkMissingLogos();
