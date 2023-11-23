import { Nostr3 } from "./nostr3";
import dotenv from "dotenv";

dotenv.config();

async function runSDK() {
  const sdk = new Nostr3(String(process.env.PRIVATE_KEY));
  const nostrKeys = sdk.generateNostrKeys();
  const [encrypted, nonce] = await sdk.encrypt(JSON.stringify(nostrKeys));
  console.log("Encrypted:", encrypted);
  console.log("Nonce", nonce);
  let retrievedData;
  try {
    retrievedData = await sdk.decrypt(encrypted, nonce);
  } catch (error) {
    console.error("Error decrypting:", error);
  }
  console.log("Retrieved Data:", retrievedData);
}

runSDK();
