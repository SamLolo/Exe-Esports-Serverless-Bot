import { 
  SlashCommand,
  CommandContext, 
  SlashCreator, 
  ComponentType,
  TextInputStyle,
  ModalInteractionContext,
  ButtonStyle,
  ComponentContext
} from 'slash-create';
import { ChannelDto } from '../../Dtos/ChannelDto';


const VERIFY_CHANNEL = "1153055395259101194";


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
              custom_id: 'member_reject',
              label: "Reject",
              style: ButtonStyle.DANGER,
              type: ComponentType.BUTTON
            },
            {
              custom_id: 'member_accept',
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


async function onVerifyApproved(ctx: ComponentContext) {
  await ctx.delete(ctx.message.id);
  console.log("Approved");
}


async function onVerifyDenied(ctx: ComponentContext) {
  await ctx.delete(ctx.message.id);
  console.log("Denied");
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
    creator.registerGlobalComponent("member_reject", onVerifyDenied);
    creator.registerGlobalComponent("member_accept", onVerifyApproved);
  }

  async run(ctx: CommandContext) {
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

    ctx.creator.requestHandler.request("POST", 
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
  
    ctx.send({
      content: "Please check your DMs",
      ephemeral: true
    });
  }
}