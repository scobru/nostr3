/// <reference types="node" />
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
    encrypt: (data: string) => Promise<Buffer>;
    decrypt: (data: Uint8Array) => Promise<any>;
}
