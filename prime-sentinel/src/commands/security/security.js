const { 
  SlashCommandBuilder, 
  EmbedBuilder,
  PermissionFlagsBits 
} = require('discord.js');
const { checkSuspicious } = require('../../systems/security');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('security')
    .setDescription('Quản lý hệ thống bảo mật')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('Xem trạng thái hệ thống bảo mật')
    )
    .addSubcommand(sub =>
      sub.setName('check')
        .setDescription('Kiểm tra thông tin thành viên')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('Thành viên cần kiểm tra')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── STATUS ──
    if (sub === 'status') {
      const embed = new EmbedBuilder()
        .setTitle('🛡️ TRẠNG THÁI BẢO MẬT')
        .addFields(
          { name: '🚫 Anti Spam', value: '✅ Đang hoạt động\nGiới hạn: 5 tin/5 giây', inline: true },
          { name: '🛡️ Anti Raid', value: '✅ Đang hoạt động\nGiới hạn: 7 người/10 giây', inline: true },
          { name: '🔒 Security Check', value: '✅ Đang hoạt động\nKiểm tra tài khoản mới', inline: true }
        )
        .setColor(0x00ff88)
        .setFooter({ text: 'Prime Sentinel • Security System' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── CHECK ──
    if (sub === 'check') {
      const target = interaction.options.getUser('user');
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);

      if (!member) {
        return interaction.reply({
          content: '❌ Không tìm thấy thành viên này trong server!',
          ephemeral: true
        });
      }

      const check = checkSuspicious(member);
      const riskLevel = !check.hasAvatar || check.isNew ? '🔴 Cao' : '🟢 Thấp';

      const embed = new EmbedBuilder()
        .setTitle('🔍 SECURITY CHECK')
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: 'Thành viên', value: `${member}`, inline: true },
          { name: 'ID', value: member.id, inline: true },
          { name: 'Tuổi tài khoản', value: `${check.ageInDays} ngày`, inline: true },
          { name: 'Có avatar', value: check.hasAvatar ? '✅ Có' : '❌ Không', inline: true },
          { name: 'Tài khoản mới', value: check.isNew ? '⚠️ Dưới 7 ngày' : '✅ Bình thường', inline: true },
          { name: 'Mức độ rủi ro', value: riskLevel, inline: true }
        )
        .setColor(check.isNew || !check.hasAvatar ? 0xff6600 : 0x00ff88)
        .setFooter({ text: 'Prime Sentinel • Security System' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
