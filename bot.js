const Discord = require('discord.js');
const config = require('./config.json');
const bot = new Discord.Client({
    disableEveryone: false
});
const fs = require('fs');

//TODO for Google API token refresh
// const axios = require('axios');
// const CREDENTIALS_PATH = require('./credentials.json');
// const TOKEN_PATH = require('./token.json');

bot.commands = new Discord.Collection();
bot.polls = require('./polls.json');

const commandFiles = fs.readdirSync('./cmds').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./cmds/${file}`);
    bot.commands.set(command.name, command);
    // console.log(`${command.name} loaded`);
}

bot.login(config.token);

bot.on('ready', async () => {
    console.log(`Bot online as ${bot.user.username} in ${bot.guilds.first()}`);
    bot.user.setActivity('your every move', {
        type: 'WATCHING'
    }); //* sets what the bot is playing

    //* script for creating an invite link for the bot, uncomment to add bot to another server
    // try {
    //     const invite = await bot.generateInvite(['ADD_REACTIONS', 'SEND_MESSAGES', 'VIEW_CHANNEL', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'CONNECT', 'SPEAK', 'CHANGE_NICKNAME', 'MANAGE_ROLES', 'MANAGE_EMOJIS']);
    //     console.log(invite);
    // } catch (error) {
    //     console.log(error);
    // }
    let msg = await bot.guilds.get(config.guildID).channels.get(config.rulesChannel).fetchMessage(config.reactMsg); // cache the rules message for reaction roles //644833324657016842
    msg.react('✅');

    bot.setInterval(async () => {
        for (let i in bot.polls) {
            if (!bot.polls.hasOwnProperty(i)) continue; // filters out built in key-value pairs
            const time = bot.polls[i].time;

            if (Date.now() > time) {
                const question = bot.polls[i].question;
                const message = await bot.channels.get(config.pollsChannel).fetchMessage(i);
                const options = bot.polls[i].options;
                bot.commands.get('poll').result(bot, message, question, options);
                delete bot.polls[i];

                fs.writeFile('./polls.json', JSON.stringify(bot.polls, null, '\t'), err => {
                    if (err) return console.error(err);
                });
            }
        }
    }, 30000);

    // bot.setInterval(async () => { //TODO logic for Google Sheets API token refresh
    //     try {
    //         let client_id, client_secret, refresh_token;
    //         //* read credentials and token to gather refresh token
    //         fs.readFile(CREDENTIALS_PATH, (err, content) => {
    //             if (err) return console.error(err);
    //             const credentials = JSON.parse(content);
    //             client_id = credentials.installed.client_id;
    //             client_secret = credentials.installed.client_secret;
    //         });
    //         fs.readFile(TOKEN_PATH, (err, content) => {
    //             if (err) return console.error(err);
    //             const token = JSON.parse(content);
    //             refresh_token = token.refresh_token;
    //         });
    //         let response = await axios({
    //             method: 'post',
    //             url: 'https://oauth2.googleapis.com/token',
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             },
    //             data: {
    //                 'client_id': client_id,
    //                 'client_secret': client_secret,
    //                 'refresh_token': refresh_token,
    //                 'grant_type': 'refresh_token'
    //             }
    //         });
    //         //* read and write updated tokens
    //         fs.readFile(TOKEN_PATH, (err, content) => {
    //             if (err) return console.error(err);
    //             let token = JSON.parse(content);
    //             let currentExpiry = token.expiry_date;
    //             token[access_token] = response.access_token;
    //             token[expiry_date] = currentExpiry + response.expires_in;
    //         });
    //     } catch (error) {
    //         console.log(error.response.data);
    //     }
    // }, 604800000);
});

bot.on('messageReactionAdd', (reaction, user) => {
    if (!user) return;
    if (user.bot) return;
    if (!reaction.message.channel.guild) return;
    if (reaction.emoji.name === '✅' && reaction.message.id === config.reactMsg) {
        let role = reaction.message.guild.roles.find(r => r.name === 'Member');
        reaction.message.guild.member(user).addRole(role).catch(console.error);
    }
});

bot.on('messageReactionRemove', (reaction, user) => {
    if (!user) return;
    if (user.bot) return;
    if (!reaction.message.channel.guild) return;
    if (reaction.emoji.name === '✅' && reaction.message.id === config.reactMsg) {
        let role = reaction.message.guild.roles.find(r => r.name === 'Member');
        reaction.message.guild.member(user).removeRole(role).catch(console.error);
    }
});

bot.on('message', async (message) => {
    bot.guilds.get(config.guildID).channels.get(config.rulesChannel).fetchMessage(config.reactMsg); // keeps welcome message in cache to ensure reactions keep working
    if (message.author.bot) return; //*  ignores messages made by bots
    if (message.channel.type === ('dm' || 'group')) return; //* ignores messages outside of channels
    if (message.channel.id === config.announcementsChannel) return; //* ignores messages in announcements
    if (message.content.includes('\`')) return; //* ignores messages with code blocks

    const args = message.content.toLowerCase().split(/ +/);
    const commandName = args.shift();

    if (message.content.toLowerCase().includes('hello')) {
        const blobwave = await findEmoji("blobwave");
        message.channel.send(`Hi! ${blobwave}`);
    }
    if (message.mentions.everyone) {
        const pingsock = await findEmoji('pingsock');
        const pingthink = await findEmoji('pingthink');
        let emojis = [pingsock, pingthink];

        message.react(emojis[Math.floor(Math.random() * emojis.length)]);
    }
    if (message.content.toLowerCase().includes('sticky liquid' || 'sticky juice')) {
        message.react('💦');
    }
    if (message.author.id === '216771586651455492' && (message.content.toLowerCase().includes('vodka') || message.content.toLowerCase().includes('russian water') || message.content.toLowerCase().includes('slav') || message.content.toLowerCase().includes('whiskey'))) {
        const blyat = await findEmoji('blyat');
        message.react(blyat);
    }
    if (message.content.toLowerCase().includes('good night') || message.content.toLowerCase().includes('gnight') || message.content.toLowerCase().includes('good morning') || message.content.toLowerCase().includes('good afternoon')) {
        try {
            bot.commands.get('greeting').execute(bot, message, args);
        } catch (error) {
            console.error(error);
        }
    }
    if (message.content.toLowerCase().includes('heads or tails')) {
        try {
            bot.commands.get('cointoss').execute(bot, message, args);
        } catch (error) {
            console.error(error);
        }
    }
    if (message.content.toLowerCase().includes('blyat')) {
        const blyat = await findEmoji('blyat');
        message.react(blyat);
    }
    if (message.content.toLowerCase().includes('good bot')) {
        message.react('🤗');
        message.channel.send(`Thank you, ${message.member.nickname || message.author.username}!`);
    }
    if (message.content.toLowerCase().includes('bad bot') || message.content.toLowerCase().includes('fuck you bot') || message.content.toLowerCase().includes('fuck you, bot')) {
        message.react('🖕');
        let diss = ['no u 😠', '😤', 'fite me', '😢'];
        let saydiss = diss[Math.floor(Math.random() * diss.length)];
        message.channel.send(saydiss);
    }
    if (message.content.toLowerCase().includes('cone') && (message.content.toLowerCase().includes('avoid') || message.content.toLowerCase().includes('mind') || message.content.toLowerCase().includes('watch out'))) {
        const cone = await findEmoji('cone');
        message.react(cone);
    }
    if (message.content.toLowerCase().includes('ducttape') || message.content.toLowerCase().includes('duct tape')) {
        const ducttape = await findEmoji('ducttape');
        message.react(ducttape);
    }
    if (message.content.toLowerCase().match(/ye{2,}t/)) {
        const yeet = await findEmoji('yeet');
        message.react(yeet);
    }
    if (message.content.toLowerCase().includes('send it') || message.content.toLowerCase().includes('sent it')) {
        const send = await findEmoji('sendit');
        message.react(send);
    }
    if (message.content.toLowerCase().includes('euro')) {
        message.react('🇪🇺');
    }
    if (message.content.toLowerCase().includes('doubt')) {
        const doubt = await findEmoji('doubt');
        message.react(doubt);
    }
    if (message.author.id === '216771586651455492' && message.content.toLowerCase().includes('user error')) {
        message.channel.send('https://media.giphy.com/media/3oz8xLd9DJq2l2VFtu/giphy.gif');
    }
    if (message.content.toLowerCase().includes('unbelievable')) {
        message.channel.send('http://gfycat.com/MadUnfinishedDarklingbeetle');
    }
    if (message.content.toLowerCase().includes('sentient')) {
        message.react('👀');
        message.channel.send('https://media.giphy.com/media/3ohs7KViF6rA4aan5u/giphy.gif');
    }
    if (message.content.toLowerCase().includes('shoey')) {
        message.channel.send('https://tenor.com/view/daniel-ricciardo-honey-badger-dr3-shoey-f1-gif-12688182');
    }
    if (message.content.toLowerCase().includes(' ass ') && (message.content.toLowerCase().includes('wrc') || message.content.toLowerCase().includes('rally') || message.content.toLowerCase().includes('timo'))) {
        message.channel.send('https://youtu.be/JleS4BdTGlo?t=17');
    }
    if (message.content.toLowerCase().includes('!salty')) {
        message.channel.send('https://streamable.com/6t08o');
    }
    if (message.content.toLowerCase().includes('they had us') || message.content.toLowerCase().includes('first half')) {
        let reactions = ['https://i.imgur.com/QpnBp7G.jpg', 'https://youtu.be/u35MwQ_zrBI?t=24'];
        let firstHalf = reactions[Math.floor(Math.random() * reactions.length)];
        message.channel.send(firstHalf);
    }
    if (message.content.toLowerCase().includes('shitshow') || message.content.toLowerCase().includes('shit show')) {
        message.channel.send('https://youtu.be/FJzW_gFoXR0?t=44');
    }
    if (message.content.toLowerCase().includes('fucking idiot')) {
        message.channel.send('https://www.youtube.com/watch?v=stb0sqtwAZA');
    }
    if (message.content.toLowerCase().includes('monza') || message.content.toLowerCase().includes('orgasm')) {
        message.channel.send('https://www.youtube.com/watch?v=DJ1EZOvLJcI');
    }
    if (message.content.toLowerCase().includes('how cute')) {
        message.channel.send('https://i.imgur.com/Dvi8rwG.jpg');
    }
    if (message.content.toLowerCase().includes('oh deer') || message.content.toLowerCase().includes('oh dear')) {
        message.channel.send('https://www.youtube.com/watch?v=VaU6pqhwur4');
    }
    if (message.content.toLowerCase().includes('can\'t believe you\'ve done this') || message.content.toLowerCase().includes('cant believe youve done this') || message.content.toLowerCase().includes('can\'t believe it') || message.content.toLowerCase().includes('cant believe it')) {
        message.channel.send('https://youtu.be/O7lRV1VHv1g?t=3');
    }
    if (commandName.startsWith(config.prefix)) { //* dynamic command handler
        const cmds = commandName.slice(config.prefix.length);
        const command = bot.commands.get(cmds) || bot.commands.find(cmd => cmd.aliases && cmd.aliases.includes(cmds));
        try {
            if (command.args && !args.length) {
                message.channel.send('You need to provide arguments for that command.');
            } else {
                command.execute(bot, message, args);
            }
        } catch (error) {
            console.error(error);
            message.channel.send('There was an error executing that command.');
            bot.guilds.first().members.get('197530293597372416').send(`General error:\n\n${error}`);
        }
    }
});

async function findEmoji(emojiName) {
    const emoji = await bot.emojis.find(emote => emote.name === emojiName);
    return emoji;
}