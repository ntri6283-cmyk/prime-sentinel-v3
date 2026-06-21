const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser } = require('../../systems/database');
const { getEconomy } = require('../../systems/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('primeid')
    .setDescription('He thong Prime ID - Danh tinh thong nhat')
    .addSubcommand(s => s.setName('view').setDescription('Xem Prime ID cua ban')
      .addUserOption(o => o.setName('user').setDescription('Thanh vien').setRequired(false)))
    .addSubcommand(s => s.setName('link').setDescription('Xem cac server da lien ket')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'view') {
      const target = interaction.options.getUser('user') || interaction.user;
      const userData = await getUser(target.id);
      const ecoData = await getEconomy(target.id);
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);

      const embed = new EmbedBuilder()
        .setTitle('🆔 PRIME ID')
        .setColor(0x7c3aed)
        .setThumbnail(target.displayAvatarURL())
        .setDescription(`Danh tinh thong nhat cua **${target.username}** trong he sinh thai Prime.`)
        .addFields(
          { name: '🔑 Prime ID',      value: `\`${userData.primeId}\``, inline: true },
          { name: '⭐ Level',          value: String(userData.level), inline: true },
          { name: '🏆 Reputation',     value: String(userData.reputation || 0), inline: true },
          { name: '🪙 Prime Coins',    value: String(ecoData.coins || 0), inline: true },
          { name: '💬 Tin nhan',       value: String(userData.messageCount || 0), inline: true },
          { name: '🎖️ Achievements',   value: String((userData.achievements || []).length), inline: true },
          { name: '🌐 He sinh thai Prime', value: [
            '🏰 Prime Kingdom — Tham gia',
            '⚔️ Prime Legion — Lien ket',
            '🛒 Prime Market — San sang',
            '👥 Prime Staff — Khong truy cap',
          ].join('\n'), inline: false },
        )
        .setFooter({ text: 'Prime Sentinel • Prime ID Integration' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'link') {
      const embed = new EmbedBuilder()
        .setTitle('🔗 PRIME ECOSYSTEM CONNECTIONS')
        .setColor(0x1d4ed8)
        .setDescription('Cac server va he thong duoc ket noi voi Prime ID cua ban.')
        .addFields(
          { name: '🏰 Prime Kingdom', value: '✅ Da ket noi — Server chinh', inline: true },
          { name: '⚔️ Prime Legion',  value: '🔗 Lien ket kha dung', inline: true },
          { name: '🛒 Prime Market',  value: '🔗 Lien ket kha dung', inline: true },
          { name: '👥 Prime Staff',   value: '🔒 Yeu cau quyen han', inline: true },
          { name: '🤖 Prime Regent',  value: '🔗 AI Bot Lien ket', inline: true },
          { name: '💼 Prime Steward', value: '🔗 Staff Bot Lien ket', inline: true },
        )
        .setFooter({ text: 'Prime Sentinel • Prime ID System' }).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  }
};
