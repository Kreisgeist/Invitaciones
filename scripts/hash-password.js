/**
 * Helper script to generate a bcrypt password hash.
 * Usage: node scripts/hash-password.js YOUR_PASSWORD
 *
 * Copy the output hash and set it as ADMIN_PASSWORD_HASH in your .env file.
 */
const bcrypt = require("bcryptjs");

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-password.js YOUR_PASSWORD");
  process.exit(1);
}

bcrypt.hash(password, 12).then((hash) => {
  console.log("\n🔐 Password hash generated:\n");
  console.log(hash);
  console.log("\nCopy this value and set it as ADMIN_PASSWORD_HASH in your .env file.\n");
});
