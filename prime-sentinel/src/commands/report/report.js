const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('He thong bao cao')
    .addSubcommand(sub =>
      sub.setName('member')
        .setDescription('Bao cao thanh vien vi pham')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('Thanh vien can bao cao')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('reason')
            .setDescription('Ly do bao cao')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('evidence')
            .setDescription('Bang chung (link anh, mo ta)')
            .setRequired(false)
        )
        .addBooleanOption(opt =>
          opt.setName('anonymous')
            .setDescription('An danh? (Staff van thay ten ban)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('scam')
        .setDescription('Bao cao lua dao, scam')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('Thanh vien can bao cao')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('reason')
            .setDescription('Mo ta hanh vi scam')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('evidence')
            .setDescription('Bang chung (link anh, mo ta)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('rule')
        .setDescription('Bao cao vi pham noi quy')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('Thanh vien can bao cao')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('reason')
            .setDescription('Noi quy bi vi pham')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('evidence')
            .setDescription('Bang chung')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('staff')
        .setDescription('Bao cao hanh vi Staff khong phu hop')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('Staff can bao cao')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('reason')
            .setDescription('Ly do bao cao')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('evidence')
            .setDescription('Bang chung')
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason');
    const evidence = interaction.options.getString('evidence') || 'Khong co bang chung';
    const anonymous = interaction.options.getBoolean('anonymous') || false;

    // Khong tu bao cao ban than
    if (target.id === interaction.user.id) {
      return interaction.reply({
        content: 'Ban khong the tu bao cao ban than!',
        ephemeral: true
      });
    }

    const typeNames = {
      member: 'Thanh Vien Vi Pham',
      scam: 'Lua Dao - Scam',
      rule: 'Vi Pham Noi Quy',
      staff: 'Hanh Vi Staff Khong Phu Hop'
    };

    const typeColors = {
      member: 0xff6600,
      scam: 0xff0000,
      rule: 0xffcc00,
      staff: 0x9b59b6
    };

    const reportId = 'RPT-' + Date.now().toString().slice(-6);

    // Tim kenh bao cao
    const reportChannel = interaction.guild.channels.cache.find(
      c => c.name === 'report-log' || c.name === 'bao-cao'
    );

    if (!reportChannel) {
      return interaction.reply({
        content: 'Khong tim thay kenh bao cao! Admin hay tao kenh #report-log.',
        ephemeral: true
      });
    }

    // Gui bao cao den Staff
    const reportEmbed = new EmbedBuilder()
      .setTitle('BAO CAO MOI: ' + typeNames[sub])
      .setColor(typeColors[sub])
      .addFields(
        { name: 'Nguoi bi bao cao', value: target.toString() + ' (' + target.user.tag + ')', inline: true },
        { name: 'ID', value: target.id, inline: true },
        { name: 'Loai bao cao', value: typeNames[sub], inline: true },
        { name: 'Nguoi bao cao', value: anonymous ? 'An danh' : interaction.user.toString(), inline: true },
        { name: 'Ly do', value: reason, inline: false },
        { name: 'Bang chung', value: evidence, inline: false },
        { name: 'Report ID', value: reportId, inline: true },
        { name: 'Thoi gian', value: new Date().toLocaleString('vi-VN'), inline: true }
      )
      .setThumbnail(target.user.displayAvatarURL())
      .setFooter({ text: 'Prime Sentinel - Report System' })
      .setTimestamp();

    // Neu bao cao Staff thi gui len Admin
    if (sub === 'staff') {
      const adminChannel = interaction.guild.channels.cache.find(
        c => c.name === 'admin-log' || c.name === 'quan-tri'
      ) || reportChannel;

      await adminChannel.send({
        content: '⚠️ BAO CAO STAFF - Can xu ly gap!',
        embeds: [reportEmbed]
      });
    } else {
      await reportChannel.send({ embeds: [reportEmbed] });
    }

    // Thong bao cho nguoi bao cao
    await interaction.reply({
      content:
        'Bao cao cua ban da duoc gui den Staff!\n' +
        'Report ID: **' + reportId + '**\n' +
        'Staff se xu ly som nhat co the. Cam on ban da bao cao!',
      ephemeral: true
    });
  }
};