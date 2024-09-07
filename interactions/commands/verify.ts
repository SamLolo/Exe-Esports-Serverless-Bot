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
  await ctx.delete(ctx.message.id);

  const user_id = ctx.customID.substring(14);
  ctx.creator.unregisterGlobalComponent(`member-accept-${user_id}`);
  ctx.creator.unregisterGlobalComponent(`member-reject-${user_id}`);

}


async function onVerifyDenied(ctx: ComponentContext) {
  await ctx.delete(ctx.message.id);
  
  const user_id = ctx.customID.substring(14);
  ctx.creator.unregisterGlobalComponent(`member-accept-${user_id}`);
  ctx.creator.unregisterGlobalComponent(`member-reject-${user_id}`);

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
      var res: ChannelDto = await ctx.creator.requestHandler.request(
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
            content: "`Placeholder TOCs`",
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