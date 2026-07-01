import { 
    ComponentContext,
    DiscordHTTPError,
    DiscordRESTError
} from 'slash-create';

import { GUILD_ID, LOG_CHANNEL } from "../../settings"
import { APIDMChannel, APIGuildMember } from 'discord-api-types/v10'


export default async function onMemberDecline(ctx: ComponentContext) {
    // Set flags
    var dm: boolean = true;

    // Get target member ID
    const user_id = ctx.customID.substring(14);
        
    // Create DM channel with User
    try {
        var member: APIGuildMember = await ctx.creator.requestHandler.request(
            "GET",
            `/guilds/${GUILD_ID}/members/${user_id}`,
            { auth: true }
        );
        var dm_channel: APIDMChannel = await ctx.creator.requestHandler.request(
            "POST",
            "/users/@me/channels",
            {
                auth: true,
                body: { "recipient_id": user_id }
            }
        );
    
        // Message user
        await ctx.creator.requestHandler.request(
            "POST", 
            `/channels/${dm_channel.id}/messages`,
            {
              auth: true,
              body: {
                content: `Your member role request has been denied by ${ctx.user.globalName}.\n*If you believe this is incorrect, please speak to a member of committee!*`
              }                            
            }
        );
    } catch(e) {
        dm = false;
    };

    // Unregister global components
    ctx.creator.unregisterGlobalComponent(`member-accept-${ctx.user.id}`);
    ctx.creator.unregisterGlobalComponent(`member-reject-${ctx.user.id}`);
    
    // Delete message in #verification
    await ctx.creator.requestHandler.request(
        "DELETE",
        `/channels/${ctx.channel.id}/messages/${ctx.message.id}`,
        { auth: true }
    );
    
    // Construct embed content
    var message: string = `User: ${member.user.username}`
    if (dm === true) {
        message = message.concat('\nDM: ✅')
    } else {
        message = message.concat('\nDM: ❌')
    }
    
    // Send log message
    await ctx.creator.requestHandler.request(
        "POST", 
        `/channels/${LOG_CHANNEL}/messages`,
        {
            auth: true,
            body: {
            embeds: [{
                description: message,
                type: "rich",
                color: 15548997,
                timestamp: new Date(), 
                author: {
                    name: "Verification Denied",
                    icon_url: ctx.user.avatarURL
                }
            }]
        }}
    );
    
}