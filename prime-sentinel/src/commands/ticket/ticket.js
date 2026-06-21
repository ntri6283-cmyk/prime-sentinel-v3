const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
  ChannelType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('He thong ticket ho tro')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('Tao panel ticket (chi Admin)')
    )
    .addSubcommand(sub =>
      sub.setName('close')
        .setDescription('Dong ticket hien tai')
    )
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Them thanh vien vao ticket')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('Thanh vien can them')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Xoa thanh vien khoi ticket')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('Thanh vien can xoa')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── SETUP ──
    if (sub === 'setup') {
      const embed = new EmbedBuilder()
        .setTitle('HE THONG TICKET')
        .setDescription(
          'Chao mung den voi he thong ho tro cua **Prime Kingdom**!\n\n' +
          'Chon loai ticket phu hop voi van de cua ban:\n\n' +
          'Ho Tro — Giai dap thac mac\n' +
          'Bao Cao Vi Pham — Bao cao thanh vien vi pham\n' +
          'Hop Tac — De xuat hop tac\n' +
          'Lien He Staff — Lien he truc tiep voi staff\n' +
          'Gop Y — Dong gop y kien cho server'
        )
        .setColor(0x1a3a6e)
        .setFooter({ text: 'Prime Sentinel • Ticket System' })
        .setTimestamp();

      const select = new StringSelectMenuBuilder()
        .setCustomId('ticket_select')
        .setPlaceholder('Chon loai ticket...')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('Ho Tro')
            .setDescription('Giai dap thac mac, ho tro su dung server')
            .setValue('support')
            .setEmoji('❓'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Bao Cao Vi Pham')
            .setDescription('Bao cao thanh vien vi pham noi quy')
            .setValue('report')
            .setEmoji('🚨'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Hop Tac')
            .setDescription('De xuat hop tac voi Prime Kingdom')
            .setValue('collab')
            .setEmoji('🤝'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Lien He Staff')
            .setDescription('Lien he truc tiep voi doi ngu staff')
            .setValue('staff')
            .setEmoji('👨‍💼'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Gop Y')
            .setDescription('Dong gop y kien de cai thien server')
            .setValue('suggestion')
            .setEmoji('💡')
        );

      const row = new ActionRowBuilder().addComponents(select);

      await interaction.channel.send({ embeds: [embed], components: [row] });
      await interaction.reply({
        content: 'Da tao panel ticket thanh cong!',
        ephemeral: true
      });
    }

    // ── CLOSE ──
    if (sub === 'close') {
      const channel = interaction.channel;

      if (!channel.name.startsWith('ticket-')) {
        return interaction.reply({
          content: 'Day khong phai kenh ticket!',
          ephemeral: true
        });
      }

      await interaction.reply({
        content: 'Ticket se duoc dong sau 5 giay...'
      });

      // Luu transcript
      const messages = await channel.messages.fetch({ limit: 100 });
      const transcript = messages.reverse().map(m =>
        '[' + new Date(m.createdTimestamp).toLocaleString('vi-VN') + '] ' +
        m.author.tag + ': ' + m.content
      ).join('\n');

      // Gui transcript vao log channel
      const logChannel = interaction.guild.channels.cache.find(
        c => c.name === 'ticket-log'
      );

      if (logChannel && transcript) {
        const logEmbed = new EmbedBuilder()
          .setTitle('TICKET CLOSED: ' + channel.name)
          .setDescription('```' + transcript.slice(0, 3900) + '```')
          .setColor(0xff6600)
          .addFields(
            { name: 'Dong boi', value: interaction.user.toString(), inline: true },
            { name: 'Thoi gian', value: new Date().toLocaleString('vi-VN'), inline: true }
          )
          .setTimestamp();
        logChannel.send({ embeds: [logEmbed] });
      }

      setTimeout(() => channel.delete().catch(() => {}), 5000);
    }

    // ── ADD ──
    if (sub === 'add') {
      const user = interaction.options.getMember('user');
      const channel = interaction.channel;

      if (!channel.name.startsWith('ticket-')) {
        return interaction.reply({
          content: 'Day khong phai kenh ticket!',
          ephemeral: true
        });
      }

      await channel.permissionOverwrites.create(user, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      });

      await interaction.reply({
        content: user.toString() + ' da duoc them vao ticket!'
      });
    }

    // ── REMOVE ──
    if (sub === 'remove') {
      const user = interaction.options.getMember('user');
      const channel = interaction.channel;

      if (!channel.name.startsWith('ticket-')) {
        return interaction.reply({
          content: 'Day khong phai kenh ticket!',
          ephemeral: true
        });
      }

      await channel.permissionOverwrites.delete(user);

      await interaction.reply({
        content: user.toString() + ' da bi xoa khoi ticket!'
      });
    }
  }
};