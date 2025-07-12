import { 
    ComponentContext,
    DiscordHTTPError,
    DiscordRESTError
} from 'slash-create';

import { LOG_CHANNEL } from "../../settings"
import { APIDMChannel } from 'discord-api-types/v10'


export default async function onMemberDecline(ctx: ComponentContext) {
    // Get target member ID
    const user_id = ctx.customID.substring(14);
        
    // Create DM channel with User
    try {
        var dm_res: APIDMChannel = await ctx.creator.requestHandler.request(
            "POST",
            "/users/@me/channels",
            {
                auth: true,
                body: { "recipient_id": user_id }
            }
        );
    
        // Post message to user's DM's as a response to the previous message
        await ctx.creator.requestHandler.request(
            "POST", 
            `/channels/${dm_res.id}/messages`,
            {
              auth: true,
              body: {
                content: `Your member role request has been denied by ${ctx.user.globalName}.\n*If you believe this was an error, contact a member of committee!*`,
                message_reference: {
                  type: 0,
                  message_id: dm_res.last_message_id,
                  fail_if_not_exists: false
                }
              }                            
            }
        );
    } catch(e) {
        if (e instanceof DiscordHTTPError || e instanceof DiscordRESTError ) {
            await ctx.send({
                content: "Unable to send a DM. Member role has been applied!",
                ephemeral: true
            });
        } else {
            await ctx.send({
                content: "An unexpected error occured whilst trying to DM the member. Role has been applied.",
                ephemeral: true
            })
            throw e;
        }
    };
    
    // Delete message in #verification
    await ctx.creator.requestHandler.request(
        "DELETE",
        `/channels/${ctx.channel.id}/messages/${ctx.message.id}`,
        { auth: true }
    );
    
        
    await ctx.creator.requestHandler.request(
        "POST", 
        `/channels/${LOG_CHANNEL}/messages`,
        {
            auth: true,
            body: {
            embeds: [{
                description: `Member: <@${dm_res.recipients[0].id}>`,
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