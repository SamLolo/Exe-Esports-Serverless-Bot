import { 
    SlashCommand,
    CommandContext, 
    SlashCreator, 
    ComponentType,
    TextInputStyle
} from 'slash-create';


const VERIFY_CHANNEL = "1153055395259101194";


export default class VerifyCommand extends SlashCommand {
    constructor(creator: SlashCreator) {
        console.log("Registered Command: /verify")
        super(creator, {
            name: 'verify',
            description: "Get your membership role in Discord once you've purchased it from the guild."
        });
    }

    async run(ctx: CommandContext) {
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
                }
              ]
            },

            (mctx) => {
              mctx.creator.requestHandler.request("POST", 
                `/channels/${VERIFY_CHANNEL}/messages`,
                {
                  auth: true,
                  body: {"embeds": [{
                    "title": "Verification Request",
                    "type": "rich",
                    "description": `New role request for ${mctx.user.mention}.\n[View Original Message](https://discord.com/channels/${mctx.guildID}/${mctx.channelID}/${mctx.messageID})`,
                    "timestamp": new Date(), 
                    "fields": [
                      {
                        "name": "Name",
                        "value": mctx.values.name,
                        "inline": false
                      },
                      {
                        "name": "Email",
                        "value": mctx.values.email,
                        "inline": false
                      }
                    ]
                  }]}                            
                });
              mctx.send(`Your request has been sent!`);
            }
        );
    }
}