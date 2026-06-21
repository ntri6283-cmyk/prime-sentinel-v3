const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage, client) {
    if (!oldMessage.guild) return;
    if (oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const logChannel = oldMessage.guild.channels.cache.find(c => c.name === 'message-log');
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle('TIN NHAN BI SUA')
      .setColor(0xffcc00)
      .addFields(
        { name: 'Nguoi gui', value: oldMessage.author ? oldMessage.author.toString() : 'Khong ro', inline: true },
        { name: 'Kenh', value: oldMessage.channel.toString(), inline: true },
        { name: 'Noi dung cu', value: oldMessage.content?.slice(0, 500) || 'Khong ro', inline: false },
        { name: 'Noi dung moi', value: newMessage.content?.slice(0, 500) || 'Khong ro', inline: false }
      )
      .setFooter({ text: 'Prime Sentinel - Logging System' })
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  }
};
