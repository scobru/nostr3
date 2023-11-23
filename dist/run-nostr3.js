"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nostr3_1 = require("./nostr3");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function runSDK() {
    const sdk = new nostr3_1.Nostr3(String(process.env.PRIVATE_KEY));
    const nostrKeys = sdk.generateNostrKeys();
    const [encrypted, nonce] = await sdk.encrypt(JSON.stringify(nostrKeys));
    console.log("Encrypted:", encrypted);
    console.log("Nonce", nonce);
    let retrievedData;
    try {
        retrievedData = await sdk.decrypt(encrypted, nonce);
    }
    catch (error) {
        console.error("Error decrypting:", error);
    }
    console.log("Retrieved Data:", retrievedData);
}
runSDK();
