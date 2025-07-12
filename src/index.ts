
import { app } from "@azure/functions"
import { AzureFunctionV4Server, SlashCreator } from 'slash-create';

// Import components
import onPrivacyAccept from './components/verify/privacy_accept';
import onPrivacyDecline from './components/verify/privacy_decline';
import onMemberAccept from './components/verify/member_accept';
import onMemberDecline from './components/verify/member_decline';

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

async () => {
    console.log("Registering commands");
    await creator.registerCommandsIn(require('path').join(__dirname, 'commands'));

    console.log("Registering global callbacks");
    creator.registerGlobalComponent("privacy_accept", onPrivacyAccept);
    creator.registerGlobalComponent("privacy_decline", onPrivacyDecline);
    creator.registerGlobalComponent("member-accept", onMemberAccept);
    creator.registerGlobalComponent("member-decline", onMemberDecline);

    console.log("Syncing commands globally on startup. This may take a moment...");
    await creator.syncGlobalCommands(true);
};