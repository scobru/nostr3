"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nostr3IPFS_1 = require("./nostr3IPFS");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function runSDK() {
    const sdk = new nostr3IPFS_1.Nostr3IPFS(process.env.PRIVATE_KEY, process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET, process.env.DB_NAME, "./cids/cids.json");
    const nostrKeys = sdk.generateNostrKeys();
    const cid = await sdk.encryptAndSaveData(nostrKeys);
    console.log("CID:", cid);
    const retrievedData = await sdk.retrieveAndDecryptData();
    console.log("Retrieved Data:", retrievedData);
}
runSDK();
