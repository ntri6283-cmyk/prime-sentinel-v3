const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    const logChannel = member.guild.channels.cache.find(c => c.name === 'server-log');
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle('THANH VIEN ROI SERVER')
      .setColor(0xff6600)
      .addFields(
        { name: 'Thanh vien', value: member.user.tag, inline: true },
        { name: 'ID', value: member.id, inline: true },
        { name: 'Tham gia luc', value: member.joinedAt ? member.joinedAt.toLocaleString('vi-VN') : 'Khong ro', inline: true }
      )
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: 'Prime Sentinel - Logging System' })
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  }
};