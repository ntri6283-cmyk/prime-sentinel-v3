const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildBanRemove',
  async execute(ban, client) {
    const logChannel = ban.guild.channels.cache.find(c => c.name === 'mod-log');
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle('THANH VIEN DUOC BO BAN')
      .setColor(0x00ff88)
      .addFields(
        { name: 'Thanh vien', value: ban.user.tag, inline: true },
        { name: 'ID', value: ban.user.id, inline: true }
      )
      .setThumbnail(ban.user.displayAvatarURL())
      .setFooter({ text: 'Prime Sentinel - Logging System' })
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  }
};