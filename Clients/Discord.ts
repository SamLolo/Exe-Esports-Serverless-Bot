import { 
    HttpRequestHeaders, 
} from "@azure/functions";

import { 
    Buffer 
} from 'node:buffer';

export class DiscordClient {
    PUBLIC_KEY: string;

    constructor(appId: string, pubKey: string, token: string) {
        this.PUBLIC_KEY = pubKey;
    }

    public verifyRequest(headers: HttpRequestHeaders, body: string): boolean {
        const isVerified = require("tweetnacl").sign.detached.verify(
            Buffer.from(headers['x-signature-timestamp'] + body),
            Buffer.from(headers['x-signature-ed25519'], "hex"),
            Buffer.from(this.PUBLIC_KEY, "hex")
        );
        if (!isVerified) {
            return false
        } else {
            return true
        };
    }
}