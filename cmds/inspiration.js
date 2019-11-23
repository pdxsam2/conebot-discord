const Discord = require('discord.js');
const axios = require('axios');

module.exports = {
    name: 'inspiration',
    aliases: ['inspirationalimage', 'inspirational', 'motivation', 'getmotivated'],
    description: 'When you need motivation to get through the day...',
    easteregg: true,
    execute(message, args) {
        axios.get('http://inspirobot.me/api?generate=true').then(res => {
            const payload = res.data;
            const embed = new Discord.RichEmbed()
                .setColor('#96031A')
                .setImage(`${payload}`)
                .setFooter('Generated from InspiroBot');

            message.channel.send(embed);
        });
    }
}