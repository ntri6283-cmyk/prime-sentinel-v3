const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverstats')
    .setDescription('Xem thong ke chi tiet ve server'),

  async execute(interaction) {
    const guild = interaction.guild;

    await guild.members.fetch();

    const totalMembers = guild.memberCount;
    const onlineMembers = guild.members.cache.filter(
      m => m.presence?.status && m.presence.status !== 'offline'
    ).size;
    const botCount = guild.members.cache.filter(m => m.user.bot).size;
    const humanCount = totalMembers - botCount;

    const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
    const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
    const categories = guild.channels.cache.filter(c => c.type === 4).size;
    const totalRoles = guild.roles.cache.size;

    const boostLevel = guild.premiumTier;
    const boostCount = guild.premiumSubscriptionCount || 0;

    const embed = new EmbedBuilder()
      .setTitle('THONG KE SERVER: ' + guild.name)
      .setThumbnail(guild.iconURL())
      .setColor(0x1a3a6e)
      .addFields(
        { name: 'Tong thanh vien', value: String(totalMembers), inline: true },
        { name: 'Dang online', value: String(onlineMembers), inline: true },
        { name: 'Bot', value: String(botCount), inline: true },
        { name: 'Nguoi dung', value: String(humanCount), inline: true },
        { name: 'Kenh chat', value: String(textChannels), inline: true },
        { name: 'Kenh voice', value: String(voiceChannels), inline: true },
        { name: 'Danh muc', value: String(categories), inline: true },
        { name: 'Tong role', value: String(totalRoles), inline: true },
        { name: 'Boost Level', value: 'Level ' + boostLevel + ' (' + boostCount + ' boosts)', inline: true },
        { name: 'Server tao luc', value: '<t:' + Math.floor(guild.createdTimestamp / 1000) + ':D>', inline: false }
      )
      .setFooter({ text: 'Prime Sentinel - Server Stats' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};