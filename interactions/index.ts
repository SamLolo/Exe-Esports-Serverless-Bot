import { 
    AzureFunction, 
    Context, 
    HttpRequest, 
    HttpResponseSimple
} from '@azure/functions';

import { 
    DiscordClient 
} from '../Clients/Discord';

import { 
    SlashCreator 
} from 'slash-create';

const interactions: AzureFunction = async function (
    context: Context, 
    req: HttpRequest
    ): Promise<HttpResponseSimple> {
   
    // Setup a new Discord Client
    const discord = new DiscordClient(
        process.env["ESPORTS_APP_ID"],
        process.env["ESPORTS_PUB_KEY"],
        process.env["ESPORTS_TOKEN"]
    );

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
    
    // Verify Discord signature before handling request (https://discord.com/developers/docs/interactions/overview#setting-up-an-endpoint-validating-security-request-headers)
    context.log("Verifying Discord signature");
    const secure: boolean = discord.verifyRequest(req.headers, req.rawBody);
    if (!secure) {
        context.log("Invalid signature!");
        return {
            statusCode: 401,
            body: "Invalid signature"
        }
    }

    // Handle ping request from Discord (https://discord.com/developers/docs/interactions/overview#setting-up-an-endpoint-acknowledging-ping-requests)
    if (req.body.type == 1) {
        context.log("Recieved PING request");
        return {
            statusCode: 200,
            body: { type: 1 },
            headers: { "Content-Type": "application/json"}
        }
    }

    context.log("Recieved interactions");
    context.log(req.body);

    //@ts-ignore
    await creator._onInteraction(
        req.body,
        async (response) => {
            context.log(response);
            context.res.status = response.status || 200;
            context.res.body = response.body;
        },
        true,
        context
    );

    return {
        statusCode: context.res.status,
        body: context.res.body,
        headers: { "Content-Type": "application/json"}
    }
};

export default interactions;