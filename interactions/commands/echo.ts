import { 
    SlashCommand, 
    CommandOptionType, 
    CommandContext, 
    SlashCreator
} from 'slash-create';
  
export default class EchoCommand extends SlashCommand {
    constructor(creator: SlashCreator) {
        console.log("Registered Command: /echo")
        super(creator, {
            name: 'echo',
            description: 'Echos a message in a specified channel.',
            options: [{
                type: CommandOptionType.STRING,
                name: 'message',
                description: 'The message to repeat.',
                required: true
            },
            {
                type: CommandOptionType.CHANNEL,
                name: 'channel',
                description: 'The channel to type the message in.',
                required: false
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
                                                body: {"content": ctx.options.message}                            
                                           });
        return `Success`;
    }
}