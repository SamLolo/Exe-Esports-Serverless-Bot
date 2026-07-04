import { 
    SlashCommand, 
    CommandOptionType, 
    CommandContext, 
    SlashCreator
} from 'slash-create';

export default class LFGCommand extends SlashCommand {
    constructor(creator: SlashCreator) {
        super(creator, {
            name: 'lfg',
            description: 'Send a looking for group request in this channel!',
            dmPermission: false,
            options: [{
                type: CommandOptionType.STRING,
                name: 'message',
                description: 'An optional message to send alongside the ping.',
                required: false
            }]
      });
    }
  
    async run(ctx: CommandContext) {

        // Define map between Category ID and Role ID
        const LFG_ROLES = new Map<string, string>([
            ["579686446118731789", "329669818003488771"], // Committee
            ["694277731176677417", "1016752072059793508"], // Valorant
            ["582139525019729941", "1010940549852839986"], // Overwatch
            ["582233553295638585", "952637629873135656"], // Rocket League
            ["582139023984951316", "1010941777735340133"], // League of Legends
            ["582139125835104256", "1016752009933770762"], // Counter-Strike
            ["582139877878136832", "1016752066607206501"], // R6 Siege
            ["897936272214073374", "895027507860996106"], // Strategy
            ["582140389226446848", "952637606859010048"], // Dota 2
            ["1282097810572837058", "1282101821266989078"] // Test
        ]);

        // Check if category has a lfg role
        if (LFG_ROLES.has(ctx.channel.parentID)) {

            // Get role ID
            const role: string = LFG_ROLES.get(ctx.channel.parentID)

            // Send lfg request in channel
            await ctx.send({
                content: (ctx.options.message == undefined) ? `<@&${role}>` : `${ctx.options.message}\n<@&${role}>`
            });

        // Handle case where category ID isn't configured above
        } else {
            await ctx.send({
                content: `Looking for group cannot be used in this channel.`,
                ephemeral: true
            });
        }
    }
}