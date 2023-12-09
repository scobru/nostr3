import { getPublicKey, nip05, nip19 } from "nostr-tools";
import crypto from "crypto";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";
import { ProfilePointer } from "nostr-tools/lib/types/nip19";

let secp: any;

import("@noble/secp256k1")
  .then(secp256k1 => {
    secp = secp256k1;
  })
  .catch(error => {
    // Handle error
  });

export class Nostr3 {
  private privateKey: string;

  constructor(privateKey: any) {
    this.privateKey = privateKey;
  }

  generateNostrKeys() {
    //const privateKey = generatePrivateKey();
    const publicKey = getPublicKey(this.privateKey);
    const nsec = nip19.nsecEncode(this.privateKey);
    const npub = nip19.npubEncode(publicKey);
    const nprofile = nip19.nprofileEncode({ pubkey: publicKey });
    return { pub: publicKey, sec: this.privateKey, npub: npub, nsec: nsec, nprofile: nprofile };
  }

  encryptDM = async (data: string, publicKey: string) => {
    const sharedPoint = secp.getSharedSecret(this.privateKey, "02" + publicKey);
    const sharedX = sharedPoint.slice(1, 33);
    const iv = crypto.randomFillSync(new Uint8Array(16));
    let cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(sharedX), iv);
    let encryptedMessage = cipher.update(data, "utf8", "base64");

    encryptedMessage += cipher.final("base64");

    const ivBase64 = Buffer.from(iv.buffer).toString("base64");
    const encrypted = encryptedMessage + "?iv=" + ivBase64;

    return encrypted;
  };

  decryptDM = async (encrypted: string, publicKey: string) => {
    const [encryptedMessage, ivBase64] = encrypted.split("?iv=");
    const iv = Buffer.from(ivBase64, "base64");

    // Derive shared secret
    const sharedPoint = secp.getSharedSecret(this.privateKey, "02" + publicKey);
    const sharedX = sharedPoint.slice(1, 33);

    // Initialize decryption cipher
    var decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(sharedX), iv);

    // Decrypt the message
    let decryptedMessage = decipher.update(encryptedMessage, "base64", "utf8");
    decryptedMessage += decipher.final("utf8");
    return decryptedMessage;
  };

  async privateKeyFromX(username: string, caip10: string, sig: string, password: string | undefined): Promise<string> {
    if (sig.length < 64) throw new Error("Signature too short");
    const inputKey = sha256(secp.etc.hexToBytes(sig.toLowerCase().startsWith("0x") ? sig.slice(2) : sig));
    const info = `${caip10}:${username}`;
    const salt = sha256(`${info}:${password ? password : ""}:${sig.slice(-64)}`);
    const hashKey = await hkdf(sha256, inputKey, salt, info, 42);

    return secp.etc.bytesToHex(secp.etc.hashToPrivateKey(hashKey));
  }

  async signInWithX(
    username: string,
    caip10: string,
    sig: string,
    password: string | undefined,
  ): Promise<{
    petname: string;
    profile: ProfilePointer | null;
    pubkey: string;
    privkey: string;
  }> {
    let profile = null;
    let petname = username;

    if (username.includes(".")) {
      try {
        profile = await nip05.queryProfile(username);
      } catch (e) {
        console.log(e);
        throw new Error("Nostr Profile Not Found");
      }
      if (profile == null) {
        throw new Error("Nostr Profile Not Found");
      }
      petname = username.split("@").length == 2 ? username.split("@")[0] : username.split(".")[0];
    }

    const privkey = await this.privateKeyFromX(petname, caip10, sig, password);
    const pubkey = getPublicKey(privkey);

    if (profile?.pubkey && pubkey !== profile.pubkey) {
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
