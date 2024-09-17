import { 
    app,
    HttpRequest, 
    HttpResponseInit, 
    InvocationContext
} from '@azure/functions';

import { 
    DiscordClient 
} from '../lib/clients/Discord';

import { 
    SlashCreator 
} from 'slash-create';
import { DiscordInteractionDto } from '../lib/interfaces/InteractionDto';

async function interactionHandler(
    request: HttpRequest,
    context: InvocationContext
    ): Promise<HttpResponseInit> {
   
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
    
    context.log(`Registering commands in dir: 'commands'`);
    await creator.registerCommandsIn(require('path').join(__dirname,'../commands'));
    
    // Verify Discord signature before handling request (https://discord.com/developers/docs/interactions/overview#setting-up-an-endpoint-validating-security-request-headers)
    context.log("Verifying Discord signature");
    const body: DiscordInteractionDto = JSON.parse(await request.text());
    const secure: boolean = discord.verifyRequest(request.headers, JSON.stringify(body));
    if (!secure) {
        context.log("Invalid signature!");
        return {
            status: 401,
            body: "Invalid signature"
        }
    }

    // Handle ping request from Discord (https://discord.com/developers/docs/interactions/overview#setting-up-an-endpoint-acknowledging-ping-requests)
    if (body.type == 1) {
        context.log("Recieved PING request");
        return {
            status: 200,
            jsonBody: { type: 1 },
            headers: { "Content-Type": "application/json"}
        }
    }

    context.log("Recieved interactions");
    context.log(body);
    var slash_res;

    //@ts-ignore
    await creator._onInteraction(
        //@ts-ignore
        body,
        async (response) => {
            context.log(response);
            slash_res = response;
        },
        true,
        slash_res
    );

    return {
        status: slash_res.status || 200,
        jsonBody: slash_res.body,
        headers: { "Content-Type": "application/json"}
    }
};

app.http("interactions", {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: "discord/interactions",
    handler: interactionHandler
})