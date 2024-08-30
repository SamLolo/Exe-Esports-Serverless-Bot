import { 
    AzureFunctionServer, 
    SlashCreator 
} from 'slash-create';

const creator = new SlashCreator({
    applicationID: process.env["ESPORTS_APP_ID"],
    publicKey: process.env["ESPORTS_PUB_KEY"],
    token: process.env["ESPORTS_TOKEN"]
});

creator.on('warn', m => console.log('[WARNING] slash-create:', m));
creator.on('error', m => console.log('[ERROR] slash-create:', m));

console.log(`Establishing Azure function server`);
creator.withServer(new AzureFunctionServer(module.exports));

(async() => {
    console.log(`Registering commands in dir: 'interactions/commands'`);
    await creator.registerCommandsIn(require('path').join(__dirname, 'commands'));
})();