#!/usr/bin/env node

// This script should be run on your backend server to clean up clubs with missing logos
// You can run this by connecting to your MongoDB directly or through your backend

const clubsToDelete = [
  "68d30ced9192ee09b034c447", // Nordic Redhawks
  "68d5dceb56b4f9646938d6d9", // Under Investigation
  "68d6ff398b7b79e06463138f", // Goatss
  "68d7088e8b7b79e0646332df", // Shanghai Sharks
  "68d8b61b8cd1d960daaffd0f", // Motley Crew of Pants
  "68d8b94e8cd1d960dab000dc", // Brothers In Gaming Y
  "68ddc4862a5b575ef107b0f6", // Teno
  "68ddc4d32a5b575ef107b41b", // Team Infernus
  "68ddc5402a5b575ef107b62d", // Carolus Icemen
  "68ddc5f32a5b575ef107bc86", // Wildcats Esport I
  "68ddc7272a5b575ef107c8ee", // Brothers In Gaming Delta
  "68ddd5022a5b575ef107cb08", // The Boys are back
  "68ddd5c52a5b575ef107cea1", // Musta Korvatunturi
  "68ddd64b2a5b575ef107d274", // Blue Line Snipers
  "68ddd7112a5b575ef107d49c", // Hasbulla Goat
  "68dee1aeb02ff5610f3a0ea9"  // Dynamik
];

console.log("🧹 CLUB CLEANUP SCRIPT");
console.log("=====================");
console.log(`This script will delete ${clubsToDelete.length} clubs with missing/empty logos:`);
console.log();

clubsToDelete.forEach((id, index) => {
  console.log(`${index + 1}. Club ID: ${id}`);
});

console.log();
console.log("📋 MONGODB COMMANDS TO RUN:");
console.log("==========================");
console.log("1. Connect to your MongoDB database");
console.log("2. Run these commands:");
console.log();

clubsToDelete.forEach(id => {
  console.log(`db.clubs.deleteOne({_id: ObjectId("${id}")});`);
});

console.log();
console.log("🔍 VERIFICATION:");
console.log("===============");
console.log("After running the commands, verify with:");
console.log(`db.clubs.countDocuments({_id: {$in: [${clubsToDelete.map(id => `ObjectId("${id}")`).join(', ')}]}});`);
console.log("(Should return 0)");

console.log();
console.log("⚠️  IMPORTANT NOTES:");
console.log("===================");
console.log("1. This will permanently delete these clubs and all their data");
console.log("2. Make sure you have a backup before running these commands");
console.log("3. You can recreate these clubs through your admin panel with proper logos");
console.log("4. This will also clean up any related data (games, rosters, etc.)");
