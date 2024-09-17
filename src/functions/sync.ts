import { 
    app,
    HttpRequest,
    HttpResponseInit,
    InvocationContext
} from "@azure/functions"

import { 
    SlashCreator 
} from 'slash-create';

async function sync(
    request: HttpRequest,
    context: InvocationContext
    ): Promise<HttpResponseInit> {
    context.log('Recieved Request to sync commands to Discord');
    const guild = request.query.get('guild');
    
    const creator = new SlashCreator({
        applicationID: process.env["ESPORTS_APP_ID"],
        publicKey: process.env["ESPORTS_PUB_KEY"],
        token: process.env["ESPORTS_TOKEN"]
    });

    creator.on('debug', m => context.log('[DEBUG] slash-create:', m));
    creator.on('warn', m => context.log('[WARNING] slash-create:', m));
    creator.on('error', m => context.log('[ERROR] slash-create:', m.message));
    
    context.log(`Registering commands in dir: 'interactions/commands'`);
    await creator.registerCommandsIn(require('path').join(__dirname,'../interactions/commands'));

    if (!guild) {
        context.log('Syncing commands globally.');
        await creator.syncGlobalCommands(true);
    } else {
        context.log(`Syncing commands to guild: ${guild}`);
        await creator.syncCommandsIn(guild, true);
    };

    return {
        status: 200,
        body: "Success"
    };

};

app.http('sync', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: "discord/sync",
    handler: sync
})