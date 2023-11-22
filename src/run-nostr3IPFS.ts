import { Nostr3IPFS } from "./nostr3IPFS";
import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

async function runSDK() {
  const sdk = new Nostr3IPFS(
    process.env.PRIVATE_KEY as string,
    process.env.PINATA_API_KEY as string,
    process.env.PINATA_API_SECRET as string,
    process.env.DB_NAME as string,
    "./cids/cids.json"
  );

  const nostrKeys = sdk.generateNostrKeys();
  const cid = await sdk.encryptAndSaveData(nostrKeys);
  console.log("CID:", cid);

  const retrievedData = await sdk.retrieveAndDecryptData();
  console.log("Retrieved Data:", retrievedData);
}

runSDK();
