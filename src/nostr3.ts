import { getPublicKey, nip19 } from "nostr-tools";
import MecenateHelper from "@scobru/crypto-ipfs";
import { Wallet } from "ethers";

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
    const wallet = new Wallet(this.privateKey);
    return { pub: publicKey, sec: this.privateKey, npub: npub, nsec: nsec, nprofile: nprofile, wallet: wallet };
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
}
