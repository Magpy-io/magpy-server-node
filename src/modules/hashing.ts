import crypto from 'crypto';

export function hashFile(base64String: string) {
  // Create the hash object
  const sha256 = crypto.createHash('sha256');

  // Update the hash with the base64-decoded data
  sha256.update(Buffer.from(base64String, 'base64'));

  // Calculate the digest (hash) and convert it to hex
  const hashHex = sha256.digest('hex');

  return hashHex;
}
