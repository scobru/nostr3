import { generatePrivateKey, getPublicKey, nip19 } from "nostr-tools";
import MecenateHelper from "@scobru/crypto-ipfs";
import { ethers } from "ethers";

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
    //
    return { pub: publicKey, sec: this.privateKey, npub: npub, nsec: nsec, nprofile: nprofile };
  }

  encrypt = async (data: string) => {
    const nonce = await MecenateHelper.crypto.asymmetric.generateNonce();
    const encrypted = Buffer.concat([
      Buffer.from(nonce),
      Buffer.from(
        MecenateHelper.crypto.asymmetric.secretBox.encryptMessage(
          Buffer.from(data),
          nonce,
          Buffer.from(this.privateKey).slice(0, 32),
        ),
      ),
    ]);

    return encrypted;
  };

  decrypt = async (data: Uint8Array) => {
    const contentBuffer = Buffer.from(data as any, "hex");
    const nonce = contentBuffer.slice(0, 24);
    const ciphertext = contentBuffer.slice(24);

    const decrypted = await MecenateHelper.crypto.asymmetric.secretBox.decryptMessage(
      new Uint8Array(ciphertext),
      new Uint8Array(nonce),
      Buffer.from(this.privateKey).slice(0, 32),
    );

    return decrypted;
  };
}
