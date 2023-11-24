import { getPublicKey, nip19 } from "nostr-tools";
import MecenateHelper from "@scobru/crypto-ipfs";
import crypto from "crypto";
import * as secp from "@noble/secp256k1";

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

  encrypt = async (data: string) => {
    const nonce = await MecenateHelper.crypto.asymmetric.generateNonce();
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

    const encrypted = MecenateHelper.crypto.asymmetric.secretBox.encryptMessage(
      Buffer.from(data),
      nonce,
      Buffer.from(this.privateKey).slice(0, 32),
    );

    return [encrypted, nonce];
  };

  decrypt = async (encrypted: string, nonce: string) => {
    const decrypted = await MecenateHelper.crypto.asymmetric.secretBox.decryptMessage(
      encrypted,
      nonce,
      Buffer.from(this.privateKey).slice(0, 32),
    );

    return decrypted;
  };

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
}
