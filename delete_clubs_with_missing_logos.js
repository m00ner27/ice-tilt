#!/usr/bin/env node

const fs = require('fs');

// Read the clubs to delete
const clubsToDelete = JSON.parse(fs.readFileSync('/tmp/clubs_to_delete.json', 'utf8'));

console.log(`🗑️  DELETING ${clubsToDelete.length} CLUBS WITH MISSING/EMPTY LOGOS\n`);

// Function to delete a club via API
async function deleteClub(club) {
  try {
    const response = await fetch(`https://ice-tilt-backend.onrender.com/api/clubs/${club._id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log(`✅ Deleted: ${club.name} (${club._id})`);
      return true;
    } else {
      console.log(`❌ Failed to delete: ${club.name} - ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error deleting ${club.name}: ${error.message}`);
    return false;
  }
}

async function deleteAllClubs() {
  let successCount = 0;
  let failCount = 0;
  
  for (const club of clubsToDelete) {
    const success = await deleteClub(club);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Small delay between deletions
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 DELETION SUMMARY:`);
  console.log(`✅ Successfully deleted: ${successCount}`);
  console.log(`❌ Failed to delete: ${failCount}`);
  
  if (successCount > 0) {
    console.log(`\n🎉 ${successCount} clubs have been deleted!`);
    console.log(`You can now recreate these clubs with proper logos through your admin panel.`);
  }
}

deleteAllClubs();
