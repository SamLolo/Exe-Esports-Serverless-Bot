
import { app } from "@azure/functions"
import { AzureFunctionV4Server, SlashCreator } from 'slash-create';
import { sync } from "./functions/sync";

// Import commands
import EchoCommand from './commands/echo';
import VerifyCommand from "./commands/verify";

// Import components
import onPrivacyAccept from './components/verify/privacy_accept';

export const creator = new SlashCreator({
    applicationID: process.env.ESPORTS_APP_ID,
    publicKey: process.env.ESPORTS_PUB_KEY,
    token: process.env.ESPORTS_TOKEN
});
creator.withServer(new AzureFunctionV4Server(app))

// Redirect slash-create events to context so they appear in app insights
creator.on('debug', m => console.log('[slash-create]', m));
creator.on('warn', m => console.warn('[slash-create]', m));
creator.on('error', m => console.error('[slash-create]', m.message));
creator.on('rawREST', r => console.debug('[slash-create] Raw request:', r));

// Register commands
console.log("[slash-create] Registering commands");
creator.registerCommand(EchoCommand);
creator.registerCommand(VerifyCommand);

// Register global components
console.log("[slash-create] Registering global callbacks");
creator.registerGlobalComponent("privacy_accept", onPrivacyAccept);

// Add sync function
app.http('sync', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: "sync",
    handler: sync
})