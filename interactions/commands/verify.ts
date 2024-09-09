import { 
  SlashCommand,
  CommandContext, 
  SlashCreator, 
  ComponentType,
  TextInputStyle,
  ModalInteractionContext,
  ButtonStyle,
  ComponentContext,
  DiscordHTTPError,
  DiscordRESTError
} from 'slash-create';

import { ChannelDto } from '../../Dtos/ChannelDto';
import { GuildMemberDto } from '../../Dtos/UserDto';


// Import environment settings
const VERIFY_CHANNEL = process.env["VERIFY_CHANNEL_ID"];
const LOG_CHANNEL = process.env["LOG_CHANNEL_ID"];
const MEMBER_ROLE = process.env['MEMBER_ROLE_ID'];
const GUILD_ID = process.env['GUILD_ID'];


async function onVerifyDecision(ctx: ComponentContext) {
  if (ctx.customID.includes("member-accept") || ctx.customID.includes("member-reject")) {
    // Get target member ID
    const user_id = ctx.customID.substring(14);
    
    // Add role to user if they've been accepted
    if (ctx.customID.includes("accept")) {
      try {
        const member: GuildMemberDto = await ctx.creator.requestHandler.request(
          "GET",
          `/guilds/${GUILD_ID}/members/${user_id}`,
          {
            auth: true
          }
        );
        member.roles.push(MEMBER_ROLE);
        await ctx.creator.requestHandler.request(
          "PATCH",
          `/guilds/${GUILD_ID}/members/${user_id}`,
          {
            auth: true,
            body: {
              roles: member.roles
            },
            headers: {
              "X-Audit-Log-Reason": "Membership verified by committee."
            }
          }
        );
      } catch(e) {
        if (e instanceof DiscordHTTPError || e instanceof DiscordRESTError ) {
          console.log(`Discord responded with ${e.code} whilst trying to create DM.`);
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
    };

    // Create DM channel with User
    try {
      var dm_res: ChannelDto = await ctx.creator.requestHandler.request(
        "POST",
        "/users/@me/channels",
        {
          auth: true,
          body: {
            "recipient_id": user_id
          }
        }
      );
      
      // Set DM message based on if they've been accepted or declined
      if (ctx.customID.includes("accept")) {
        var dm_content: string = "**You have now recieved your member role!**\nThank you for supporting the University of Exeter Esports Society 💚";
      } else {
        var dm_content: string = `Your member role request has been denied by ${ctx.user.globalName}.\n*If you believe this was an error, contact a member of committee!*`;
      }

      // Post message to user's DM's as a response to the previous message
      await ctx.creator.requestHandler.request(
        "POST", 
        `/channels/${dm_res.id}/messages`,
        {
          auth: true,
          body: {
            content: dm_content,
            message_reference: {
              type: 0,
              message_id: dm_res.last_message_id,
              fail_if_not_exists: false
            }
          }                            
      });
    } catch(e) {
      if (e instanceof DiscordHTTPError || e instanceof DiscordRESTError ) {
        console.log(`Discord responded with ${e.code} whilst trying to create DM.`);
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
    await ctx.delete(ctx.message.id);

    // Send log message
    if (ctx.customID.includes("accept")) {
      await ctx.creator.requestHandler.request(
        "POST", 
        `/channels/${LOG_CHANNEL}/messages`,
        {
          auth: true,
          body: {
            embeds: [{
              title: "Verification Accepted",
              description: `Member: <@${dm_res.recipients[0].id}>`,
              type: "rich",
              color: 5763719,
              timestamp: new Date(), 
              author: {
                name: ctx.user.globalName,
                icon_url: ctx.user.avatarURL
              }
            }]
          }
        }
      );
    } else {
      await ctx.creator.requestHandler.request(
        "POST", 
        `/channels/${LOG_CHANNEL}/messages`,
        {
          auth: true,
          body: {
            embeds: [{
              title: "Verification Denied",
              description: `Member: <@${dm_res.recipients[0].id}>`,
              type: "rich",
              color: 15548997,
              timestamp: new Date(), 
              author: {
                name: ctx.user.globalName,
                icon_url: ctx.user.avatarURL
              }
            }]
        }}
      );
    }
  }
}


async function onFormComplete(ctx: ModalInteractionContext) {
  await ctx.delete(ctx.message.id);

  await ctx.creator.requestHandler.request("POST", 
    `/channels/${VERIFY_CHANNEL}/messages`,
    {
      auth: true,
      body: {
        embeds: [{
          title: "Verification Request",
          type: "rich",
          color: 2067276,
          timestamp: new Date(), 
          fields: [
            {
              name: "Name",
              value: ctx.values.name,
              inline: true
            },
            {
              name: "Discord",
              value: ctx.user.mention,
              inline: true
            },
            {
              name: "Student Email",
              value: ctx.values.email,
              inline: false
            }]
        }],
        components: [
          {
            type: ComponentType.ACTION_ROW,
            components: [
              {
              custom_id: `member-reject-${ctx.user.id}`,
              label: "Reject",
              style: ButtonStyle.DANGER,
              type: ComponentType.BUTTON
            },
            {
              custom_id: `member-accept-${ctx.user.id}`,
              label: "Accept",
              style: ButtonStyle.SUCCESS,
              type: ComponentType.BUTTON
            }]
          }]
      }});
  await ctx.send(`Thank you! Your request has been sent to the committee for moderation.\nYou will recieve an update here once you've recieved your role!`);
}


async function onPrivacyAccept(ctx: ComponentContext) {
  ctx.sendModal(
    {
      title: 'Get Your Member Role',
      components: [
        {
          type: ComponentType.ACTION_ROW,
          components: [
            {
              type: ComponentType.TEXT_INPUT,
              label: 'Full Name',
              style: TextInputStyle.SHORT,
              custom_id: 'name',
              placeholder: 'Enter your full name as on your guild account...'
            }
          ]
        },
        {
          type: ComponentType.ACTION_ROW,
          components: [
            {
              type: ComponentType.TEXT_INPUT,
              label: 'Student Email',
              style: TextInputStyle.SHORT,
              custom_id: 'email',
              placeholder: 'Enter your student email...'
            }
          ]
        },
      ]
    },
    onFormComplete
  );
}


async function onPrivacyDecline(ctx: ComponentContext) {
  await ctx.delete(ctx.messageID);
  ctx.send("**Operation Cancelled!**\nRun `/verify` to restart.")
}


export default class VerifyCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    console.log("Registered Command: /verify")
    super(creator, {
      name: 'verify',
      description: "Get your membership role in Discord once you've purchased it from the guild."
    });

    creator.registerGlobalComponent("privacy_accept", onPrivacyAccept);
    creator.registerGlobalComponent("privacy_decline", onPrivacyDecline);
    creator.on('componentInteraction', onVerifyDecision);
  }

  async run(ctx: CommandContext) {
    try {
      const res: ChannelDto = await ctx.creator.requestHandler.request(
        "POST",
        "/users/@me/channels",
        {
          auth: true,
          body: {
            "recipient_id": ctx.user.id
          }
        }
      );
      
      await ctx.creator.requestHandler.request("POST", 
        `/channels/${res.id}/messages`,
        {
          auth: true,
          body: {
            content: 
`### Before you continue, please read & accept following TOC's: 
To comply with GDPR, we process your information as below:
**-** *Personal information will only be stored temporarily for the purpose of checking you hold a valid Esports society membership.*
**-** *Information will only be visible to current committee members.*
**-** *Any stored information will be permanently deleted as soon as your membership has been verified.*
-# Any questions or issues, please don't hesitate to contact a member of committee! :slight_smile:`,
            components: [
              {
                type: ComponentType.ACTION_ROW,
                components: [
                  {
                  custom_id: 'privacy_decline',
                  label: "Cancel",
                  style: ButtonStyle.SECONDARY,
                  type: ComponentType.BUTTON
                },
                {
                  custom_id: 'privacy_accept',
                  label: "Accept",
                  style: ButtonStyle.SUCCESS,
                  type: ComponentType.BUTTON
                }]
              }
            ]
          }                            
        });

    } catch(e) {
      if (e instanceof DiscordHTTPError || e instanceof DiscordRESTError ) {
        if (e.code == 403) {
          await ctx.send({
            content: "Failed to send DM. See here for more info: https://support.discord.com/hc/en-us/articles/360060145013-Why-isn-t-my-DM-going-through",
            ephemeral: true
          });
          return;  
        
        } else {
          console.log(`Discord responded with ${e.code} whilst trying to create DM.`);
        }
      }
      
      await ctx.send({
        content: "An unknown error occured. If this issue persists, contact a member of committee!",
        ephemeral: true
      });
      throw e;
    };
  
    await ctx.send({
      content: "Please check your DMs",
      ephemeral: true
    });
  }
}