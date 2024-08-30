import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { AzureFunctionServer, SlashCreator } from 'slash-create';

const sync: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    console.log('Recieved Request to sync commands to Discord');
    const guild = req.query.guild;
    
    const creator = new SlashCreator({
        applicationID: process.env["ESPORTS_APP_ID"],
        publicKey: process.env["ESPORTS_PUB_KEY"],
        token: process.env["ESPORTS_TOKEN"]
    });

    creator.on('debug', m => console.log('slash-create debug:', m))
    creator.on('warn', m => console.log('slash-create warn:', m))
    creator.on('error', m => console.log('slash-create error:', m))
    
    // The first argument is required, but the second argument is the "target" or the name of the export.
    // By default, the target is "interactions".
    creator.withServer(new AzureFunctionServer(module.exports))
    
    console.log('Entering Async Block');
    (async() => {
        console.log('Registering commands')
        await creator.registerCommandsIn(require('path').join(__dirname,'../interactions/commands'));
    
        // Syncing the commands each time the function is executed is wasting computing time
        if (!guild) {
            console.log('Syncing commands globally.')
            await creator.syncCommands();
        } else {
            console.log(`Syncing commands to guild: ` + guild)
            await creator.syncCommandsIn(guild);
        };
    })();

    context.res = {
        status: 200,
        body: "Success"
    };

};

export default sync;