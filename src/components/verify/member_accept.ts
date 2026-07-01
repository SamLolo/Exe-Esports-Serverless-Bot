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
    // Set flags
    var dm: boolean = true;
    var role: boolean = true;

    // Get target member ID
    const user_id = ctx.customID.substring(14);
    
    // Add role to user
    try {
        var member: APIGuildMember = await ctx.creator.requestHandler.request(
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
        role = false;
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
        var dm_channel: APIDMChannel = await ctx.creator.requestHandler.request(
            "POST",
            "/users/@me/channels",
            {
                auth: true,
                body: { "recipient_id": member.user.id }
            }
        );

        // Message User
        await ctx.creator.requestHandler.request(
            "POST", 
            `/channels/${dm_channel.id}/messages`,
            {
                auth: true,
                body: {
                    content: "**You have now recieved your member role!**\nThank you for supporting the University of Exeter Esports Society 💚"
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
    if (role === true) {
        message = message.concat('\nRole: ✅')
    } else {
        message = message.concat('\nRole: ❌')
    }

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
