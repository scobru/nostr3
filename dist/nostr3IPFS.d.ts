import { Mogu } from "@scobru/mogu";
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
    };
    encryptAndSaveData(nodeData: any): Promise<any>;
    retrieveAndDecryptData(): Promise<any>;
}
