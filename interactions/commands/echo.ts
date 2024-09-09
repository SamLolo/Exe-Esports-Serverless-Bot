import { 
    SlashCommand, 
    CommandOptionType, 
    CommandContext, 
    SlashCreator,
    DiscordHTTPError,
    DiscordRESTError
} from 'slash-create';
import { GuildMemberDto } from '../../Dtos/UserDto';
  

const LOG_CHANNEL = process.env["LOG_CHANNEL_ID"];
const COMMITTEE_ROLE = process.env['COMMITTEE_ROLE_ID'];
const GUILD_ID = process.env['GUILD_ID'];


export default class EchoCommand extends SlashCommand {
    constructor(creator: SlashCreator) {
        console.log("Registered Command: /echo")
        super(creator, {
            name: 'echo',
            description: 'Sends a message with the bot account in another channel.',
            dmPermission: false,
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
                required: true
            }]
      });
    }
  
    async run(ctx: CommandContext) {

        // Check that the user has committee role to be able to run the command
        try {
            const member: GuildMemberDto = await ctx.creator.requestHandler.request(
                "GET",
                `/guilds/${GUILD_ID}/members/${ctx.user.id}`,
                {
                    auth: true
                }
            );
            if (!member.roles.includes(COMMITTEE_ROLE)) {
                await ctx.send({
                    content: "You don't have the permission to use this command!",
                    ephemeral: true
                })
                return;
            };
        } catch(e) {
            await ctx.send({
                content: "An error occured whilst trying to fetch user data.",
                ephemeral: true
                });
            if (e instanceof DiscordHTTPError || e instanceof DiscordRESTError ) {
                console.log(`Discord responded with ${e.code} whilst trying to create DM.`);   
            } else {
                throw e;
            }
            return;
        };

        // Send message in Channel
        ctx.creator.requestHandler.request(
            "POST", 
            `/channels/${ctx.options.channel}/messages`,
            {
                auth: true,
                body: {"content": ctx.options.message}                            
            }
        );

        // Respond to user to let them know the message has been sent
        await ctx.send({
            content: `Sent "${ctx.options.message}" in <#${ctx.options.channel}>.`,
            ephemeral: true
        });
        
        // Create record in the log channel of message event
        ctx.creator.requestHandler.request(
            "POST", 
            `/channels/${LOG_CHANNEL}/messages`,
            {
                auth: true,
                body: {
                    embeds: [{
                    description: ctx.options.message,
                    type: "rich",
                    color: 10181046,
                    timestamp: new Date(), 
                    author: {
                        name: "Sent a message",
                        icon_url: ctx.user.avatarURL
                    }
                    }]
                }
            }
        );
    }
}