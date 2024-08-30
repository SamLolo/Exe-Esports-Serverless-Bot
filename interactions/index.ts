import path = require("path");
import { AzureFunctionServer, SlashCreator } from 'slash-create';

const creator = new SlashCreator({
    applicationID: process.env["ESPORTS_APP_ID"],
    publicKey: process.env["ESPORTS_PUB_KEY"],
    token: process.env["ESPORTS_TOKEN"]
});

creator.on('warn', m => console.log('slash-create warn:', m))
creator.on('error', m => console.log('slash-create error:', m))

// The first argument is required, but the second argument is the "target" or the name of the export.
// By default, the target is "interactions".
creator.withServer(new AzureFunctionServer(module.exports));

(async() => {
    await creator.registerCommandsIn(require('path').join(__dirname, 'commands'));
})();