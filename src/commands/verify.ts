import { 
  SlashCommand,
  CommandContext, 
  SlashCreator, 
  ComponentType,
  ButtonStyle,
  DiscordHTTPError,
  DiscordRESTError
} from 'slash-create';

import {
  MEMBER_ROLE,
  GUILD_ID
} from '../settings'

import { 
  APIGuildMember,
  APIChannel
} from 'discord-api-types/v10'

export default class VerifyCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'verify',
      description: "Get your membership role in Discord once you've purchased it from the guild."
    });
  }

  async run(ctx: CommandContext) {
    // Check that the user doesn't already have the member role
    try {
      const member: APIGuildMember = await ctx.creator.requestHandler.request(
          "GET",
          `/guilds/${GUILD_ID}/members/${ctx.user.id}`,
          {
              auth: true
          }
      );
      if (member.roles.includes(MEMBER_ROLE)) {
          await ctx.send({
              content: "You already have the member role.",
              ephemeral: true
          })
          return;
      };
    } catch(e) {
        await ctx.send({
            content: "An error occured whilst trying to fetch user data.",
            ephemeral: true
            });
        throw e;
    };

    // Send TOC's via DM to user.
    try {
      const dm_channel: APIChannel = await ctx.creator.requestHandler.request(
        "POST",
        "/users/@me/channels",
        {
          auth: true,
          body: {
            "recipient_id": ctx.user.id
          }
        }
      );
      
      await ctx.creator.requestHandler.request(
        "POST", 
        `/channels/${dm_channel.id}/messages`,
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
                    custom_id: 'privacy_accept',
                    label: "Verify",
                    style: ButtonStyle.PRIMARY,
                    type: ComponentType.BUTTON
                  }
                ]
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
        } 
      }
      
      await ctx.send({
        content: "An unknown error occured. If this issue persists, contact a member of committee!",
        ephemeral: true
      });
      throw e;
    };
  
    // Tell user to check their DM's
    await ctx.send({
      content: "Please check your DMs",
      ephemeral: true
    });
  }
}