import { 
    HttpRequest,
    HttpResponseInit,
    InvocationContext
} from "@azure/functions"

import { creator } from '../index';


export async function sync(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Recieved Request to sync commands to Discord');
    context.log('[slash-create] Commands to sync: ', creator.commands.keys());

    const guild = request.query.get('guild');
    if (!guild) {
        context.log('[slash-create] Syncing commands globally.');
        await creator.syncGlobalCommands(true);
    } else {
        context.log(`[slash-create] Syncing commands to guild: ${guild}`);
        await creator.syncCommandsIn(guild, true);
    };

    const response: HttpResponseInit = {
        status: 200,
        body: "Success"
    };

    context.debug(`Response: ${JSON.stringify(response, null, 2)}`);
    return response;
};