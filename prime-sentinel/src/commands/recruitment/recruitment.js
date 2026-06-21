const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recruit')
    .setDescription('He thong tuyen thanh vien')
    .addSubcommand(sub =>
      sub.setName('post')
        .setDescription('Dang tin tuyen thanh vien')
        .addStringOption(opt =>
          opt.setName('type')
            .setDescription('Loai tuyen dung')
            .setRequired(true)
            .addChoices(
              { name: 'Alliance - Tuyen thanh vien lien minh', value: 'alliance' },
              { name: 'Team - Tuyen thanh vien doi nhom', value: 'team' },
              { name: 'Project - Tuyen thanh vien du an', value: 'project' }
            )
        )
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('Ten lien minh/doi nhom/du an')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('description')
            .setDescription('Mo ta va yeu cau')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('requirements')
            .setDescription('Yeu cau tham gia (VD: RS5+, Active Players)')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt.setName('deadline')
            .setDescription('Han dang ky (VD: 30/06/2026)')
            .setRequired(false)
        )
        .addIntegerOption(opt =>
          opt.setName('slots')
            .setDescription('So vi tri con trong')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('close')
        .setDescription('Dong tin tuyen dung')
        .addStringOption(opt =>
          opt.setName('messageid')
            .setDescription('ID tin tuyen dung')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Xem danh sach tin tuyen dung dang mo')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── POST ──
    if (sub === 'post') {
      const type = interaction.options.getString('type');
      const name = interaction.options.getString('name');
      const description = interaction.options.getString('description');
      const requirements = interaction.options.getString('requirements') || 'Khong co yeu cau cu the';
      const deadline = interaction.options.getString('deadline') || 'Khong gioi han';
      const slots = interaction.options.getInteger('slots') || 0;

      const typeNames = {
        alliance: 'TUYEN THANH VIEN LIEN MINH',
        team: 'TUYEN THANH VIEN DOI NHOM',
        project: 'TUYEN THANH VIEN DU AN'
      };

      const typeColors = {
        alliance: 0xffd700,
        team: 0x1a3a6e,
        project: 0x00ff88
      };

      const typeEmojis = {
        alliance: 'Alliance',
        team: 'Team',
        project: 'Project'
      };

      // Tim kenh tuyen dung
      const recruitChannel = interaction.guild.channels.cache.find(
        c => c.name === 'recruitment' || c.name === 'tuyen-dung'
      );

      if (!recruitChannel) {
        return interaction.reply({
          content: 'Khong tim thay kenh #recruitment! Admin hay tao kenh nay.',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(typeNames[type] + ': ' + name)
        .setDescription(description)
        .setColor(typeColors[type])
        .addFields(
          { name: 'Loai', value: typeEmojis[type], inline: true },
          { name: 'Nguoi dang', value: interaction.user.toString(), inline: true },
          { name: 'Vi tri trong', value: slots > 0 ? String(slots) : 'Khong gioi han', inline: true },
          { name: 'Yeu cau', value: requirements, inline: false },
          { name: 'Han dang ky', value: deadline, inline: true },
          { name: 'Trang thai', value: 'Dang tuyen', inline: true }
        )
        .setThumbnail(interaction.guild.iconURL())
        .setFooter({ text: 'Prime Sentinel - Recruitment Board | Nhan nut de ung tuyen' })
        .setTimestamp();

      const applyBtn = new ButtonBuilder()
        .setCustomId('recruit_apply_' + interaction.user.id)
        .setLabel('Ung Tuyen Ngay')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅');

      const infoBtn = new ButtonBuilder()
        .setCustomId('recruit_info_' + interaction.user.id)
        .setLabel('Hoi Them Thong Tin')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('❓');

      const row = new ActionRowBuilder().addComponents(applyBtn, infoBtn);

      const msg = await recruitChannel.send({ embeds: [embed], components: [row] });

      await interaction.reply({
        content:
          'Da dang tin tuyen dung **' + name + '** thanh cong!\n' +
          'Xem tai: ' + recruitChannel.toString() + '\n' +
          'ID tin: ' + msg.id,
        ephemeral: true
      });
    }

    // ── CLOSE ──
    if (sub === 'close') {
      const messageId = interaction.options.getString('messageid');

      const recruitChannel = interaction.guild.channels.cache.find(
        c => c.name === 'recruitment' || c.name === 'tuyen-dung'
      );

      if (!recruitChannel) {
        return interaction.reply({
          content: 'Khong tim thay kenh #recruitment!',
          ephemeral: true
        });
      }

      try {
        const msg = await recruitChannel.messages.fetch(messageId);
        const oldEmbed = msg.embeds[0];

        const newEmbed = new EmbedBuilder()
          .setTitle(oldEmbed.title + ' [DA DONG]')
          .setDescription(oldEmbed.description)
          .setColor(0x808080)
          .addFields(
            ...oldEmbed.fields.map(f => {
              if (f.name === 'Trang thai') return { name: 'Trang thai', value: 'Da dong tuyen', inline: true };
              return { name: f.name, value: f.value, inline: f.inline };
            })
          )
          .setFooter({ text: 'Prime Sentinel - Recruitment Board | Da dong tuyen' })
          .setTimestamp();

        await msg.edit({ embeds: [newEmbed], components: [] });

        await interaction.reply({
          content: 'Da dong tin tuyen dung thanh cong!',
          ephemeral: true
        });

      } catch (err) {
        await interaction.reply({
          content: 'Khong tim thay tin tuyen dung voi ID: ' + messageId,
          ephemeral: true
        });
      }
    }

    // ── LIST ──
    if (sub === 'list') {
      const recruitChannel = interaction.guild.channels.cache.find(
        c => c.name === 'recruitment' || c.name === 'tuyen-dung'
      );

      if (!recruitChannel) {
        return interaction.reply({
          content: 'Khong tim thay kenh #recruitment!',
          ephemeral: true
        });
      }

      const messages = await recruitChannel.messages.fetch({ limit: 20 });
      const activeRecruits = messages.filter(m =>
        m.embeds.length > 0 &&
        m.embeds[0].title &&
        !m.embeds[0].title.includes('[DA DONG]')
      );

      if (activeRecruits.size === 0) {
        return interaction.reply({
          content: 'Hien tai khong co tin tuyen dung nao!',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('DANH SACH TUYEN DUNG DANG MO')
        .setColor(0x1a3a6e)
        .setTimestamp();

      activeRecruits.forEach(msg => {
        const e = msg.embeds[0];
        embed.addFields({
          name: e.title || 'Khong co tieu de',
          value: 'ID: ' + msg.id + '\n' + (e.description?.slice(0, 100) || '') + '...',
          inline: false
        });
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};