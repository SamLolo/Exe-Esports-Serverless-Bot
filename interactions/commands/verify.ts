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


const VERIFY_CHANNEL = process.env["VERIFY_CHANNEL_ID"];
const LOG_CHANNEL = process.env["LOG_CHANNEL_ID"];
const MEMBER_ROLE = process.env['MEMBER_ROLE_ID'];


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
  ctx.creator.registerGlobalComponent(`member-reject-${ctx.user.id}`, onVerifyDenied);
  ctx.creator.registerGlobalComponent(`member-accept-${ctx.user.id}`, onVerifyApproved);
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


async function onVerifyApproved(ctx: ComponentContext) {
  const user_id = ctx.customID.substring(14);

  try {
    const role_res: GuildMemberDto = await ctx.creator.requestHandler.request(
      "PATCH",
      `/guilds/${ctx.guildID}/members/${user_id}`,
      {
        auth: true,
        body: {
          roles: [MEMBER_ROLE]
        },
        headers: {
          "X-Audit-Log-Reason": "Membership verified by committee."
        }
      }
    );
    console.log(role_res);
  } catch(e) {
    if (e instanceof DiscordHTTPError || e instanceof DiscordRESTError ) {
      console.log(`Discord responded with ${e.code} whilst trying to create DM.`);
      await ctx.send({
        content: "Unable to add member role.",
        ephemeral: true
      });
    } else {
      await ctx.send({
        content: "An unexpected error occured whilst trying to add the meber role.",
        ephemeral: true
      })
      throw e;
    }
  };

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
    
    await ctx.creator.requestHandler.request(
      "POST", 
      `/channels/${dm_res.id}/messages`,
      {
        auth: true,
        body: {
          content: "You have now recieved your member role! Thank you for supporting Univeristy of Exeter Esports Society 💚",
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
        content: "Unable to send a DM.",
        ephemeral: true
      });
    } else {
      await ctx.send({
        content: "An unexpected error occured whilst trying to DM the member.",
        ephemeral: true
      })
      throw e;
    }
  };

  await ctx.delete(ctx.message.id);
  ctx.creator.unregisterGlobalComponent(`member-accept-${user_id}`);
  ctx.creator.unregisterGlobalComponent(`member-reject-${user_id}`);

  await ctx.creator.requestHandler.request(
    "POST", 
    `/channels/${LOG_CHANNEL}/messages`,
    {
      auth: true,
      body: {
        embeds: [{
          title: "Verification Accepted",
          description: `Member: @${dm_res.recipients[0].username}`,
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
}


async function onVerifyDenied(ctx: ComponentContext) {
  const user_id = ctx.customID.substring(14);

  try {
    var res: ChannelDto = await ctx.creator.requestHandler.request(
      "POST",
      "/users/@me/channels",
      {
        auth: true,
        body: {
          "recipient_id": user_id
        }
      }
    );
    
    await ctx.creator.requestHandler.request("POST", 
      `/channels/${res.id}/messages`,
      {
        auth: true,
        body: {
          content: `Your member role request has been denied by ${ctx.user.globalName}.\n*If you believe this was an error, contact a member of committee!*`,
          message_reference: {
            type: 0,
            message_id: res.last_message_id,
            fail_if_not_exists: false
          }
        }                            
      });

  } catch(e) {
    if (e instanceof DiscordHTTPError || e instanceof DiscordRESTError ) {
      if (e instanceof DiscordHTTPError || e instanceof DiscordRESTError ) {
        console.log(`Discord responded with ${e.code} whilst trying to create DM.`);
        await ctx.send({
          content: "Unable to send a DM.",
          ephemeral: true
        });
      } else {
        await ctx.send({
          content: "An unexpected error occured whilst trying to DM the member.",
          ephemeral: true
        });
        throw e;
      }
    }
  };

  await ctx.delete(ctx.message.id);
  ctx.creator.unregisterGlobalComponent(`member-accept-${user_id}`);
  ctx.creator.unregisterGlobalComponent(`member-reject-${user_id}`);

  await ctx.creator.requestHandler.request(
    "POST", 
    `/channels/${LOG_CHANNEL}/messages`,
    {
      auth: true,
      body: {
        embeds: [{
          title: "Verification Denied",
          description: `Member: @${res.recipients[0].username}`,
          type: "rich",
          color: 15548997,
          timestamp: new Date(), 
          author: {
            name: ctx.user.globalName,
            icon_url: ctx.user.avatarURL
          }
        }]
      }
    }
  );
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
            `## Before you continue:
             To verify your membership with the guild, we need to collect your full name and student email to check aginst our records.
             - All personal information will only be stored temporarily for the purpose of checking you hold a valid Esports society membership.
             - Any stored information will only be visible to current committee members and will be deleted as soon as your membership has been verified.
             *Due to Guild restrictions, memberships need to be verified manually and make take up to a day*
             
             **By clicking accept, you agree to the above terms and conditions!**`,
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
          await ctx.send({
            content: "An unknown error occured. If this issue persists, contact a member of committee!",
            ephemeral: true
          });
        }
      
      } else {
        await ctx.send({
          content: "An unknown error occured. If this issue persists, contact a member of committee!",
          ephemeral: true
        });
      }
      throw e;
    };
  
    await ctx.send({
      content: "Please check your DMs",
      ephemeral: true
    });
  }
}