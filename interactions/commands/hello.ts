import { 
    SlashCommand,
    CommandContext, 
    SlashCreator 
} from 'slash-create';

export default class HelloCommand extends SlashCommand {
    constructor(creator: SlashCreator) {
        console.log("Registered Command: /hello")
        super(creator, {
            name: 'hello',
            description: 'Says hello to you.'
        });
    }

    async run(ctx: CommandContext) {
      return ctx.options.food ? `You like ${ctx.options.food}? Nice!` : `Hello, ${ctx.user.username}!`;
    }
}