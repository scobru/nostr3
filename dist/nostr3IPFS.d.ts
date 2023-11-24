import { Mogu } from "@scobru/mogu";
import { Wallet } from "ethers";
export declare class Nostr3IPFS {
    mogu: Mogu;
    cidFile: string;
    private privateKey;
    constructor(privateKey: string, pinataApiKey: string, pinataApiSecret: string, dbName: string, cidFilePath: string);
    generateNostrKeys(): {
        pub: string;
        sec: string;
        npub: `npub1${string}`;
        nsec: `nsec1${string}`;
        nprofile: `nprofile1${string}`;
        wallet: Wallet;
    };
    encryptAndSaveData(nodeData: any): Promise<any>;
    retrieveAndDecryptData(): Promise<any>;
    encrypt: (data: string) => Promise<any[]>;
    decrypt: (encrypted: string, nonce: string) => Promise<any>;
}
