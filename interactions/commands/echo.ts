import { 
    SlashCommand, 
    CommandOptionType, 
    CommandContext, 
    SlashCreator
} from 'slash-create';
  
export default class EchoCommand extends SlashCommand {
    constructor(creator: SlashCreator) {
        console.log("Registered Command: /message")
        super(creator, {
            name: 'message',
            description: 'Send messages with the bot account in another channel.',
            options: [{
                type: CommandOptionType.STRING,
                name: 'content',
                description: 'The message to repeat.',
                required: true
            },
            {
                type: CommandOptionType.CHANNEL,
                name: 'channel',
                description: 'The channel to type the message in.',
                required: true
            }]
      });
    }
  
    async run(ctx: CommandContext) {
        console.log("Making POST request");
        console.log(`Channel ID: ${ctx.options.channel}`)
        ctx.creator.requestHandler.request("POST", 
                                           `/channels/${ctx.options.channel}/messages`,
                                           {
                                                auth: true,
                                                body: {"content": ctx.options.content}                            
                                           });
        return `Success`;
    }
}