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
    InteractionResponseType,
    SlashCreator 
} from 'slash-create';

import { 
    DiscordInteractionDto,
    InteractionType
} from '../lib/interfaces/InteractionDto';
import { onFormComplete } from '../commands/verify';


async function interactionHandler(
    request: HttpRequest,
    context: InvocationContext
    ): Promise<HttpResponseInit> {
   
    // Setup a new Discord Client
    context.log(`Creating new Discord client (app_id: ${process.env["ESPORTS_APP_ID"]})`);
    const discord = new DiscordClient(
        process.env["ESPORTS_APP_ID"],
        process.env["ESPORTS_PUB_KEY"],
        process.env["ESPORTS_TOKEN"]
    );

    // Setup a new Slash-Create client to handle actual interactions
    context.log(`slash-create: New client for app_id '${process.env["ESPORTS_APP_ID"]}'`);
    const creator = new SlashCreator({
        applicationID: process.env["ESPORTS_APP_ID"],
        publicKey: process.env["ESPORTS_PUB_KEY"],
        token: process.env["ESPORTS_TOKEN"],
        disableTimeouts: true
    });

    // Redirect slash-create events to context so they appear in app insights
    creator.on('debug', m => context.log('[slash-create]', m));
    creator.on('warn', m => context.warn('[slash-create]', m));
    creator.on('error', m => context.error('[slash-create]', m.message));
    creator.on('rawREST', r => context.debug('[slash-create] Raw request:', r));
    
    // Register slash-commands in src/commands
    context.log(`Registering slash commands in dir: './src/commands'`);
    await creator.registerCommandsIn(require('path').join(__dirname,'../commands'));
    
    // Trace request headers for debugging
    let head_json: string = "{"
    for (const pair of request.headers.entries()) {
        head_json = head_json.concat(`\n  ${pair[0]}: ${pair[1]},`);
    };
    context.debug(`Headers: \n${head_json}\n}`);
    
    // Verify Discord signature before handling request (https://discord.com/developers/docs/interactions/overview#setting-up-an-endpoint-validating-security-request-headers)
    context.log("Verifying request signature");
    const body: DiscordInteractionDto = JSON.parse(await request.text());
    const secure: boolean = discord.verifyRequest(request.headers, JSON.stringify(body));
    if (!secure) {
        context.warn(`Invalid signature (x-signature-ed25519: ${request.headers.get('x-signature-ed25519')}, x-signature-timestamp: ${request.headers.get('x-signature-timestamp')})`);
        return {
            status: 401,
            body: "Invalid signature"
        }
    }

    // Trace request body for debugging
    context.log("Successfully validated Discord signature");
    context.debug(`Body: \n${JSON.stringify(body, null, 2)}`);
    let response: HttpResponseInit;

    // Handle ping request from Discord (https://discord.com/developers/docs/interactions/overview#setting-up-an-endpoint-acknowledging-ping-requests)
    if (body.type == InteractionType.PING) {
        context.log("Acknowledging Discord PING request");
        response = {
            status: 200,
            jsonBody: { type: 1 },
            headers: { "Content-Type": "application/json"}
        }
    }

    context.log("Recieved interactions");

    if (body.type !== InteractionType.MODAL_SUBMIT) {
        var slash_res;

        //@ts-ignore
        await creator._onInteraction(
            body,
            async (response) => {
                context.debug('[slash-create] Interaction response:', response);
                slash_res = response;
            },
            true,
            slash_res
        );

        response = {
            status: slash_res.status,
            jsonBody: slash_res.body,
            headers: { "Content-Type": "application/json"}
        };
    
    } else {
        if (body.data.custom_id == "verify-form") {
            const data = await onFormComplete(body, creator.requestHandler);
            response = {
                status: 200,
                jsonBody: {
                    type: 4,
                    data: data
                },
                headers: { "Content-Type": "application/json"}
            }
        } else {
            response = {
                status: 404
            }
        }
    }

    context.debug(`Response: ${JSON.stringify(response, null, 2)}`);
    return response;
};


app.http("interactions", {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: "discord/interactions",
    handler: interactionHandler
})