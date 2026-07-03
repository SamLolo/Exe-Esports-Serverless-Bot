import { 
    HttpRequest,
    HttpResponseInit,
    InvocationContext
} from "@azure/functions"

import { creator } from '../index';


export async function sync(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Recieved Request to sync commands to Discord');

    // Log registered commands for debugging
    context.log('[slash-create] Commands to sync: ', creator.commands.keys());

    // Sync all registered commands
    await creator.syncCommands({
        syncGuilds: true,
        deleteCommands: true,
        skipGuildErrors: true
    });

    return {
        status: 200,
        body: "Success"
    };
};