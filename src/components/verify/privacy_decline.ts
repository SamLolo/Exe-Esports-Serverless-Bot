
import { ComponentContext } from 'slash-create';

export default async function onPrivacyDecline(ctx: ComponentContext) {
    await ctx.creator.requestHandler.request(
      "DELETE",
      `/channels/${ctx.channel.id}/messages/${ctx.message.id}`,
      {
        auth: true
      }
    );
    await ctx.send("**Operation Cancelled!**\nRun `/verify` to restart.")
  }