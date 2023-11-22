import { Mogu, EncryptedNode } from "@scobru/mogu";
import { generatePrivateKey, getPublicKey, nip19 } from "nostr-tools";
import fs from "fs-extra";
import ethers from "ethers";

export class Nostr3IPFS {
  mogu: Mogu;
  cidFile: string;
  private privateKey: string;


  constructor(privateKey: string, pinataApiKey: string, pinataApiSecret: string, dbName: string, cidFilePath: string) {
    this.mogu = new Mogu(privateKey, pinataApiKey, pinataApiSecret, dbName);
    this.cidFile = cidFilePath;
    this.privateKey = privateKey;
  }

  generateNostrKeys() {
    //const privateKey = generatePrivateKey();
    const publicKey = getPublicKey(this.privateKey);
    const nsec = nip19.nsecEncode(this.privateKey);
    const npub = nip19.npubEncode(this.privateKey);
    return { pub: publicKey, sec: this.privateKey, npub: npub, nsec: nsec };
  }

  async encryptAndSaveData(nodeData: any) {
    let cid;

    if (fs.existsSync(this.cidFile)) {
      const cidData = fs.readFileSync(this.cidFile, "utf8");
      if (cidData) {
        try {
          cid = JSON.parse(cidData);
          await this.mogu.load(cid.hash);
          return cid; // Return the existing CID
        } catch (error) {
          console.error("Error parsing CID file:", error);
          // Gestisci il caso di errore nel parse qui
        }
      }
    }

    const node: EncryptedNode = {
      id: "0", // Set an appropriate ID
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

    fs.writeFileSync(this.cidFile, JSON.stringify(jsonData));
    return cid;
  }

  async retrieveAndDecryptData() {
    let cid;
    if (fs.existsSync(this.cidFile)) {
      const cidData = fs.readFileSync(this.cidFile, "utf8");
      if (cidData) {
        try {
          cid = JSON.parse(cidData);
          await this.mogu.load(cid.hash);

          const nodes = this.mogu.queryByType("FILE");
          const nostrKeyNode = nodes.find((node: { name: string; }) => node.name === "NostrKeys");
          console.log("Nostr Key Node:", nostrKeyNode);

          if (nostrKeyNode) {
            return JSON.parse(nostrKeyNode.content);
          } else {
            throw new Error("Nostr key node not found");
          }
        } catch (error) {
          console.error("Error parsing CID file:", error);
          throw new Error("Invalid CID file content");
        }
      } else {
        throw new Error("CID file is empty");
      }
    } else {
      throw new Error("CID file not found");
    }
  }
}

