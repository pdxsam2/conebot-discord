module.exports = {
    name: 'checkin',
    aliases: [],
    description: 'Google Drive folder of the current car',
    easteregg: false,
    args: false,
    execute: async (bot, message, args) => {
        message.channel.send('Check in to meetings, workshops, and events here:\nhttps://forms.gle/CJAxTvXG2pnG9C9A8');
    }
}