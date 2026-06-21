const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    if (!message.guild) return;
    if (message.author?.bot) return;
    if (!message.content) return;

    const logChannel = message.guild.channels.cache.find(c => c.name === 'message-log');
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle('TIN NHAN BI XOA')
      .setColor(0xff0000)
      .addFields(
        { name: 'Nguoi gui', value: message.author ? message.author.toString() : 'Khong ro', inline: true },
        { name: 'Kenh', value: message.channel.toString(), inline: true },
        { name: 'Noi dung', value: message.content.slice(0, 1000) || 'Khong co noi dung', inline: false }
      )
      .setFooter({ text: 'Prime Sentinel - Logging System' })
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  }
};