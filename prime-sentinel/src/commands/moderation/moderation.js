const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');

let caseNumber = 1;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Hệ thống quản trị')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(sub =>
      sub.setName('warn')
        .setDescription('Cảnh cáo thành viên')
        .addUserOption(opt =>
          opt.setName('user').setDescription('Thành viên').setRequired(true))
        .addStringOption(opt =>
          opt.setName('reason').setDescription('Lý do').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('mute')
        .setDescription('Tắt tiếng thành viên')
        .addUserOption(opt =>
          opt.setName('user').setDescription('Thành viên').setRequired(true))
        .addStringOption(opt =>
          opt.setName('reason').setDescription('Lý do').setRequired(false))
        .addIntegerOption(opt =>
          opt.setName('duration').setDescription('Thời gian (phút)').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('unmute')
        .setDescription('Bỏ tắt tiếng thành viên')
        .addUserOption(opt =>
          opt.setName('user').setDescription('Thành viên').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('kick')
        .setDescription('Đuổi thành viên khỏi server')
        .addUserOption(opt =>
          opt.setName('user').setDescription('Thành viên').setRequired(true))
        .addStringOption(opt =>
          opt.setName('reason').setDescription('Lý do').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('ban')
        .setDescription('Cấm thành viên vĩnh viễn')
        .addUserOption(opt =>
          opt.setName('user').setDescription('Thành viên').setRequired(true))
        .addStringOption(opt =>
          opt.setName('reason').setDescription('Lý do').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('unban')
        .setDescription('Bỏ cấm thành viên')
        .addStringOption(opt =>
          opt.setName('userid').setDescription('ID thành viên').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const reason = interaction.options.getString('reason') || 'Không có lý do';
    const mod = interaction.member;
    const guild = interaction.guild;
    const logChannel = guild.channels.cache.find(c => c.name === 'mod-log');
    const caseId = `MOD-${String(caseNumber++).padStart(4, '0')}`;

    async function sendLog(action, color, target, extra = '') {
      if (!logChannel) return;
      const logEmbed = new EmbedBuilder()
        .setTitle(`🔨 ${action}`)
        .addFields(
          { name: 'Thành viên', value: target ? `${target}` : 'N/A', inline: true },
          { name: 'Moderator', value: `${mod}`, inline: true },
          { name: 'Lý do', value: reason, inline: false },
          { name: 'Thời gian', value: new Date().toLocaleString('vi-VN'), inline: true },
          { name: 'Case ID', value: caseId, inline: true }
        )
        .setColor(color)
        .setTimestamp();
      if (extra) logEmbed.addFields({ name: 'Chi tiết', value: extra });
      logChannel.send({ embeds: [logEmbed] });
    }

    // ── WARN ──
    if (sub === 'warn') {
      const user = interaction.options.getMember('user');
      const embed = new EmbedBuilder()
        .setTitle('⚠️ CẢNH CÁO')
        .setDescription(`${user} đã bị cảnh cáo!`)
        .addFields(
          { name: 'Lý do', value: reason, inline: true },
          { name: 'Moderator', value: `${mod}`, inline: true },
          { name: 'Case ID', value: caseId, inline: true }
        )
        .setColor(0xffcc00)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      await sendLog('Warn', 0xffcc00, user);
      user.send(`⚠️ Bạn đã bị cảnh cáo tại **${guild.name}**\n📋 Lý do: **${reason}**`).catch(() => {});
    }

    // ── MUTE ──
    if (sub === 'mute') {
      const user = interaction.options.getMember('user');
      const duration = interaction.options.getInteger('duration') || 10;
      const muteRole = guild.roles.cache.find(r => r.name === 'Muted');

      if (!muteRole) {
        return interaction.reply({
          content: '❌ Không tìm thấy role **Muted**! Hãy tạo role này trước.',
          ephemeral: true
        });
      }

      await user.roles.add(muteRole);
      setTimeout(() => user.roles.remove(muteRole).catch(() => {}), duration * 60 * 1000);

      const embed = new EmbedBuilder()
        .setTitle('🔇 MUTE THÀNH VIÊN')
        .setDescription(`${user} đã bị tắt tiếng **${duration} phút**!`)
        .addFields(
          { name: 'Lý do', value: reason, inline: true },
          { name: 'Thời gian', value: `${duration} phút`, inline: true },
          { name: 'Case ID', value: caseId, inline: true }
        )
        .setColor(0xff6600)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      await sendLog('Mute', 0xff6600, user, `Thời gian: ${duration} phút`);
      user.send(`🔇 Bạn đã bị mute **${duration} phút** tại **${guild.name}**\n📋 Lý do: **${reason}**`).catch(() => {});
    }

    // ── UNMUTE ──
    if (sub === 'unmute') {
      const user = interaction.options.getMember('user');
      const muteRole = guild.roles.cache.find(r => r.name === 'Muted');
      if (muteRole) await user.roles.remove(muteRole);

      const embed = new EmbedBuilder()
        .setTitle('🔊 UNMUTE THÀNH VIÊN')
        .setDescription(`${user} đã được bỏ tắt tiếng!`)
        .setColor(0x00ff88)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      await sendLog('Unmute', 0x00ff88, user);
    }

    // ── KICK ──
    if (sub === 'kick') {
      const user = interaction.options.getMember('user');
      await user.send(`👢 Bạn đã bị kick khỏi **${guild.name}**\n📋 Lý do: **${reason}**`).catch(() => {});
      await user.kick(reason);

      const embed = new EmbedBuilder()
        .setTitle('👢 KICK THÀNH VIÊN')
        .setDescription(`${user.user?.tag} đã bị kick!`)
        .addFields(
          { name: 'Lý do', value: reason, inline: true },
          { name: 'Case ID', value: caseId, inline: true }
        )
        .setColor(0xff4400)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      await sendLog('Kick', 0xff4400, user);
    }

    // ── BAN ──
    if (sub === 'ban') {
      const user = interaction.options.getMember('user');
      await user.send(`🔨 Bạn đã bị ban khỏi **${guild.name}**\n📋 Lý do: **${reason}**`).catch(() => {});
      await user.ban({ reason });

      const embed = new EmbedBuilder()
        .setTitle('🔨 BAN THÀNH VIÊN')
        .setDescription(`${user.user?.tag} đã bị ban vĩnh viễn!`)
        .addFields(
          { name: 'Lý do', value: reason, inline: true },
          { name: 'Case ID', value: caseId, inline: true }
        )
        .setColor(0xff0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      await sendLog('Ban', 0xff0000, user);
    }

    // ── UNBAN ──
    if (sub === 'unban') {
      const userId = interaction.options.getString('userid');
      await guild.members.unban(userId).catch(() => {});

      const embed = new EmbedBuilder()
        .setTitle('✅ UNBAN THÀNH VIÊN')
        .setDescription(`ID: \`${userId}\` đã được bỏ ban!`)
        .setColor(0x00ff88)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  }
};
