import { decrypt } from './src/utils/encryption.js';

const encrypted = "15668e0f17a320ea32bd153260023d27:d1c89c942a48f0ca4aa89aaf391d0389:4cc0089c5b5f05cb9c244732b5512d89333cde282e635ea139c295f74a1a381015ecf6f4a2b18ed6d5624f28e571f869ba";
try {
  const decrypted = decrypt(encrypted);
  console.log("Decrypted:", decrypted);
} catch (e) {
  console.error("Decrypt failed:", e.message);
}
