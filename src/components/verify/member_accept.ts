import { 
    ComponentContext,
    DiscordHTTPError,
    DiscordRESTError
} from 'slash-create';

import {
    MEMBER_ROLE,
    GUILD_ID,
    LOG_CHANNEL
} from "../../settings"

import { 
    APIGuildMember,
    APIDMChannel
  } from 'discord-api-types/v10'
  

export default async function onMemberAccept(ctx: ComponentContext) {
    // Get target member ID
    const user_id = ctx.customID.substring(14);
    
    // Add role to user
    try {
        const member: APIGuildMember = await ctx.creator.requestHandler.request(
            "GET",
            `/guilds/${GUILD_ID}/members/${user_id}`,
            { auth: true }
        );
        member.roles.push(MEMBER_ROLE);
        await ctx.creator.requestHandler.request(
            "PATCH",
            `/guilds/${GUILD_ID}/members/${user_id}`,
            {
                auth: true,
                body: { roles: member.roles },
                headers: { "X-Audit-Log-Reason": "Membership verified by committee." }
            }
        );
    } catch(e) {
        if (e instanceof DiscordHTTPError || e instanceof DiscordRESTError ) {
            await ctx.send({
                content: "Unable to add member role.",
                ephemeral: true
            });
            return;
        } else {
            await ctx.send({
                content: "An unexpected error occured whilst trying to add the meber role.",
                ephemeral: true
            })
            throw e;
        }
    };

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
                    content: "**You have now recieved your member role!**\nThank you for supporting the University of Exeter Esports Society 💚",
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
                content: "Unable to send a DM. Role added anyway!",
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

    // Send log message
    await ctx.creator.requestHandler.request(
        "POST", 
        `/channels/${LOG_CHANNEL}/messages`,
        {
            auth: true,
            body: {
                embeds: [{
                    description: `Member: <@${dm_res.recipients[0].id}>`,
                    type: "rich",
                    color: 5763719,
                    timestamp: new Date(), 
                    author: {
                        name: "Verification Accepted",
                        icon_url: ctx.user.avatarURL
                    }
                }]
            }
        }
    );
}
