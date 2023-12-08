"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Nostr3 = void 0;
const nostr_tools_1 = require("nostr-tools");
const crypto_ipfs_1 = __importDefault(require("@scobru/crypto-ipfs"));
const crypto_1 = __importDefault(require("crypto"));
const ethers_1 = require("ethers");
let secp;
Promise.resolve().then(() => __importStar(require("@noble/secp256k1"))).then(secp256k1 => {
    secp = secp256k1;
})
    .catch(error => {
    // Handle error
});
class Nostr3 {
    constructor(privateKey) {
        this.encrypt = async (data) => {
            const nonce = await crypto_ipfs_1.default.crypto.asymmetric.generateNonce();
            const encrypted = crypto_ipfs_1.default.crypto.asymmetric.secretBox.encryptMessage(Buffer.from(data), nonce, Buffer.from(this.privateKey).slice(0, 32));
            return [encrypted, nonce];
        };
        this.decrypt = async (encrypted, nonce) => {
            const decrypted = await crypto_ipfs_1.default.crypto.asymmetric.secretBox.decryptMessage(encrypted, nonce, Buffer.from(this.privateKey).slice(0, 32));
            return decrypted;
        };
        this.encryptDM = async (data, publicKey) => {
            const sharedPoint = secp.getSharedSecret(this.privateKey, "02" + publicKey);
            const sharedX = sharedPoint.slice(1, 33);
            const iv = crypto_1.default.randomFillSync(new Uint8Array(16));
            let cipher = crypto_1.default.createCipheriv("aes-256-cbc", Buffer.from(sharedX), iv);
            let encryptedMessage = cipher.update(data, "utf8", "base64");
            encryptedMessage += cipher.final("base64");
            const ivBase64 = Buffer.from(iv.buffer).toString("base64");
            const encrypted = encryptedMessage + "?iv=" + ivBase64;
            return encrypted;
        };
        this.decryptDM = async (encrypted, publicKey) => {
            const [encryptedMessage, ivBase64] = encrypted.split("?iv=");
            const iv = Buffer.from(ivBase64, "base64");
            // Derive shared secret
            const sharedPoint = secp.getSharedSecret(this.privateKey, "02" + publicKey);
            const sharedX = sharedPoint.slice(1, 33);
            // Initialize decryption cipher
            var decipher = crypto_1.default.createDecipheriv("aes-256-cbc", Buffer.from(sharedX), iv);
            // Decrypt the message
            let decryptedMessage = decipher.update(encryptedMessage, "base64", "utf8");
            decryptedMessage += decipher.final("utf8");
            return decryptedMessage;
        };
        this.privateKey = privateKey;
    }
    generateNostrKeys() {
        //const privateKey = generatePrivateKey();
        const publicKey = (0, nostr_tools_1.getPublicKey)(this.privateKey);
        const nsec = nostr_tools_1.nip19.nsecEncode(this.privateKey);
        const npub = nostr_tools_1.nip19.npubEncode(publicKey);
        const nprofile = nostr_tools_1.nip19.nprofileEncode({ pubkey: publicKey });
        return { pub: publicKey, sec: this.privateKey, npub: npub, nsec: nsec, nprofile: nprofile };
    }
    async privateKeyFromX(username, caip10, sig, password) {
        if (sig.length < 64)
            throw new Error("Signature too short");
        const inputKey = (0, ethers_1.sha256)(secp.hexToBytes(sig.toLowerCase().startsWith("0x") ? sig.slice(2) : sig));
        const info = `${caip10}:${username}`;
        const salt = (0, ethers_1.sha256)(`${info}:${password ? password : ""}:${sig.slice(-64)}`);
        const hashKey = await secp.hkdf(ethers_1.sha256, inputKey, salt, info, 42);
        return secp.bytesToHex(secp.hashToPrivateKey(hashKey));
    }
    async signInWithX(username, caip10, sig, password) {
        let profile = null;
        let petname = username;
        if (username.includes(".")) {
            try {
                profile = await nostr_tools_1.nip05.queryProfile(username);
            }
            catch (e) {
                console.log(e);
                throw new Error("Nostr Profile Not Found");
            }
            if (profile == null) {
                throw new Error("Nostr Profile Not Found");
            }
            petname = username.split("@").length == 2 ? username.split("@")[0] : username.split(".")[0];
        }
        const privkey = await this.privateKeyFromX(petname, caip10, sig, password);
        const pubkey = (0, nostr_tools_1.getPublicKey)(privkey);
        if ((profile === null || profile === void 0 ? void 0 : profile.pubkey) && pubkey !== profile.pubkey) {
            throw new Error("Invalid Signature/Password");
        }
        return {
            petname,
            profile,
            pubkey,
            privkey,
        };
    }
}
exports.Nostr3 = Nostr3;
