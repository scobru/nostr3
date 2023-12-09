import { ProfilePointer } from "nostr-tools/lib/types/nip19";
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
    encryptDM: (data: string, publicKey: string) => Promise<string>;
    decryptDM: (encrypted: string, publicKey: string) => Promise<string>;
    privateKeyFromX(username: string, caip10: string, sig: string, password: string | undefined): Promise<string>;
    signInWithX(username: string, caip10: string, sig: string, password: string | undefined): Promise<{
        petname: string;
        profile: ProfilePointer | null;
        pubkey: string;
        privkey: string;
    }>;
}
