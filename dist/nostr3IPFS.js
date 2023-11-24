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
exports.Nostr3IPFS = void 0;
const mogu_1 = require("@scobru/mogu");
const nostr_tools_1 = require("nostr-tools");
const fs_extra_1 = __importDefault(require("fs-extra"));
const ethers_1 = require("ethers");
const crypto_ipfs_1 = __importDefault(require("@scobru/crypto-ipfs"));
const secp = __importStar(require("@noble/secp256k1"));
const crypto_1 = __importDefault(require("crypto"));
class Nostr3IPFS {
    constructor(privateKey, pinataApiKey, pinataApiSecret, dbName, cidFilePath) {
        this.encrypt = async (data) => {
            const nonce = await crypto_ipfs_1.default.crypto.asymmetric.generateNonce();
            /* const encrypted = Buffer.concat([
              Buffer.from(nonce),
              Buffer.from(
                MecenateHelper.crypto.asymmetric.secretBox.encryptMessage(
                  Buffer.from(data),
                  nonce,
                  Buffer.from(this.privateKey).slice(0, 32),
                ),
              ),
            ]); */
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
        this.mogu = new mogu_1.Mogu(privateKey, pinataApiKey, pinataApiSecret, dbName);
        this.cidFile = cidFilePath;
        this.privateKey = privateKey;
    }
    generateNostrKeys() {
        //const privateKey = generatePrivateKey();
        const publicKey = (0, nostr_tools_1.getPublicKey)(this.privateKey);
        const nsec = nostr_tools_1.nip19.nsecEncode(this.privateKey);
        const npub = nostr_tools_1.nip19.npubEncode(publicKey);
        const nprofile = nostr_tools_1.nip19.nprofileEncode({ pubkey: publicKey });
        const wallet = new ethers_1.Wallet(this.privateKey);
        return { pub: publicKey, sec: this.privateKey, npub: npub, nsec: nsec, nprofile: nprofile, wallet: wallet };
    }
    async encryptAndSaveData(nodeData) {
        let cid;
        if (fs_extra_1.default.existsSync(this.cidFile)) {
            const cidData = fs_extra_1.default.readFileSync(this.cidFile, "utf8");
            if (cidData) {
                try {
                    cid = JSON.parse(cidData);
                    await this.mogu.load(cid.hash);
                    return cid; // Return the existing CID
                }
                catch (error) {
                    console.error("Error parsing CID file:", error);
                    // Gestisci il caso di errore nel parse qui
                }
            }
        }
        const node = {
            id: "0",
            type: "FILE",
            name: "NostrKeys",
            parent: "",
            children: [],
            content: JSON.stringify(nodeData),
            encrypted: true, // Set to true if data is encrypted
        };
        console.log("Adding node:", node);
        this.mogu.addNode(node);
        cid = await this.mogu.store();
        const jsonData = {
            hash: cid,
        };
        fs_extra_1.default.writeFileSync(this.cidFile, JSON.stringify(jsonData));
        return cid;
    }
    async retrieveAndDecryptData() {
        let cid;
        if (fs_extra_1.default.existsSync(this.cidFile)) {
            const cidData = fs_extra_1.default.readFileSync(this.cidFile, "utf8");
            if (cidData) {
                try {
                    cid = JSON.parse(cidData);
                    await this.mogu.load(cid.hash);
                    const nodes = this.mogu.queryByType("FILE");
                    const nostrKeyNode = nodes.find((node) => node.name === "NostrKeys");
                    console.log("Nostr Key Node:", nostrKeyNode);
                    if (nostrKeyNode) {
                        return JSON.parse(nostrKeyNode.content);
                    }
                    else {
                        throw new Error("Nostr key node not found");
                    }
                }
                catch (error) {
                    console.error("Error parsing CID file:", error);
                    throw new Error("Invalid CID file content");
                }
            }
            else {
                throw new Error("CID file is empty");
            }
        }
        else {
            throw new Error("CID file not found");
        }
    }
}
exports.Nostr3IPFS = Nostr3IPFS;
