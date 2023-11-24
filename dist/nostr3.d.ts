export declare class Nostr3 {
    private privateKey;
    constructor(privateKey: any);
    generateNostrKeys(): {
        pub: string;
        sec: string;
        npub: `npub1${string}`;
        nsec: `nsec1${string}`;
        nprofile: `nprofile1${string}`;
    };
    encrypt: (data: string) => Promise<any[]>;
    decrypt: (encrypted: string, nonce: string) => Promise<any>;
    encryptDM: (data: string, publicKey: string) => Promise<string>;
    decryptDM: (encrypted: string, publicKey: string) => Promise<string>;
}
