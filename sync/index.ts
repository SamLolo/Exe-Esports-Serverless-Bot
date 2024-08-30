import { 
    AzureFunction, 
    Context, 
    HttpRequest, 
    HttpResponseSimple
} from "@azure/functions"

import { 
    SlashCreator 
} from 'slash-create';

export default async function sync (
    context: Context, 
    req: HttpRequest
): Promise<HttpResponseSimple> {
    context.log('Recieved Request to sync commands to Discord');
    const guild = req.query.guild;
    
    const creator = new SlashCreator({
        applicationID: process.env["ESPORTS_APP_ID"],
        publicKey: process.env["ESPORTS_PUB_KEY"],
        token: process.env["ESPORTS_TOKEN"]
    });

    creator.on('warn', m => console.log('[WARNING] slash-create:', m));
    creator.on('error', m => console.log('[ERROR] slash-create:', m));
    
    context.log(`Registering commands in dir: 'interactions/commands'`);
    await creator.registerCommandsIn(require('path').join(__dirname,'../interactions/commands'));

    if (!guild) {
        context.log('Syncing commands globally.');
        await creator.syncCommands();
    } else {
        context.log(`Syncing commands to guild: ${guild}`);
        await creator.syncCommandsIn(guild);
    };

    return {
        status: 200,
        body: "Success"
    };

};