const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban, client) {
    const logChannel = ban.guild.channels.cache.find(c => c.name === 'mod-log');
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle('THANH VIEN BI BAN')
      .setColor(0xff0000)
      .addFields(
        { name: 'Thanh vien', value: ban.user.tag, inline: true },
        { name: 'ID', value: ban.user.id, inline: true },
        { name: 'Ly do', value: ban.reason || 'Khong co ly do', inline: false }
      )
      .setThumbnail(ban.user.displayAvatarURL())
      .setFooter({ text: 'Prime Sentinel - Logging System' })
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  }
};