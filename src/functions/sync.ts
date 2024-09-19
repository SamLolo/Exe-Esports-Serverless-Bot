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
    
    context.log(`slash-create: New client for app_id '${process.env["ESPORTS_APP_ID"]}'`);
    const creator = new SlashCreator({
        applicationID: process.env["ESPORTS_APP_ID"],
        publicKey: process.env["ESPORTS_PUB_KEY"],
        token: process.env["ESPORTS_TOKEN"]
    });

    creator.on('debug', m => context.log('slash-create:', m));
    creator.on('warn', m => context.warn('slash-create:', m));
    creator.on('error', m => context.error('slash-create:', m.message));
    creator.on('rawREST', r => context.trace(`slash-create: Raw request: \n${JSON.stringify(r, null, 2)}`));
    
    context.log(`Registering commands in dir: 'src/commands'`);
    await creator.registerCommandsIn(require('path').join(__dirname,'../interactions/commands'));

    if (!guild) {
        context.log('Syncing commands globally.');
        await creator.syncGlobalCommands(true);
    } else {
        context.log(`Syncing commands to guild: ${guild}`);
        await creator.syncCommandsIn(guild, true);
    };

    const response: HttpResponseInit = {
        status: 200,
        body: "Success"
    };

    context.trace(`Response: ${JSON.stringify(response, null, 2)}`);
    return response;

};


app.http('sync', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: "discord/sync",
    handler: sync
})