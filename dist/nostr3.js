"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Nostr3 = void 0;
const nostr_tools_1 = require("nostr-tools");
const crypto_ipfs_1 = __importDefault(require("@scobru/crypto-ipfs"));
class Nostr3 {
    constructor(privateKey) {
        this.encrypt = async (data) => {
            const nonce = await crypto_ipfs_1.default.crypto.asymmetric.generateNonce();
            const encrypted = Buffer.concat([
                Buffer.from(nonce),
                Buffer.from(crypto_ipfs_1.default.crypto.asymmetric.secretBox.encryptMessage(Buffer.from(data), nonce, Buffer.from(this.privateKey).slice(0, 32))),
            ]);
            return encrypted;
        };
        this.decrypt = async (data) => {
            const contentBuffer = Buffer.from(data, "hex");
            const nonce = contentBuffer.slice(0, 24);
            const ciphertext = contentBuffer.slice(24);
            const decrypted = await crypto_ipfs_1.default.crypto.asymmetric.secretBox.decryptMessage(new Uint8Array(ciphertext), new Uint8Array(nonce), Buffer.from(this.privateKey).slice(0, 32));
            return decrypted;
        };
        this.privateKey = privateKey;
    }
    generateNostrKeys() {
        //const privateKey = generatePrivateKey();
        const publicKey = (0, nostr_tools_1.getPublicKey)(this.privateKey);
        const nsec = nostr_tools_1.nip19.nsecEncode(this.privateKey);
        const npub = nostr_tools_1.nip19.npubEncode(publicKey);
        const nprofile = nostr_tools_1.nip19.nprofileEncode({ pubkey: publicKey });
        //
        return { pub: publicKey, sec: this.privateKey, npub: npub, nsec: nsec, nprofile: nprofile };
    }
}
exports.Nostr3 = Nostr3;
