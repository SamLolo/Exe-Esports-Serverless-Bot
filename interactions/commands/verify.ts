import { 
  SlashCommand,
  CommandContext, 
  SlashCreator, 
  ComponentType,
  TextInputStyle,
  ModalInteractionContext
} from 'slash-create';


const VERIFY_CHANNEL = "1153055395259101194";


function onFormComplete(ctx: ModalInteractionContext) {
  ctx.creator.requestHandler.request("POST", 
    `/channels/${VERIFY_CHANNEL}/messages`,
    {
      auth: true,
      body: {"embeds": [{
        "title": "Verification Request",
        "type": "rich",
        "description": `New role request for ${ctx.user.mention}.`,
        "timestamp": new Date(), 
        "fields": [
          {
            "name": "Name",
            "value": ctx.values.name,
            "inline": false
          },
          {
            "name": "Email",
            "value": ctx.values.email,
            "inline": false
          }
        ]
      }]}                            
    });
  ctx.send(`Your request has been sent!`);
}

function onGdprAccept() {

}


async function verifyApproved() {
    console.log("Approved");
}


async function verifyDenied() {
    console.log("Denied");
}


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
            },
          ]
        },
        onFormComplete
      );
    }
}