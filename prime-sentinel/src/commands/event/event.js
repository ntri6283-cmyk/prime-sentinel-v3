const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits
} = require('discord.js');

// Luu tru su kien
const events = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('He thong su kien')
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Tao su kien moi')
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('Ten su kien')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('description')
            .setDescription('Mo ta su kien')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('time')
            .setDescription('Thoi gian su kien (VD: 20:00 18/06/2026)')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('maxplayers')
            .setDescription('So nguoi tham gia toi da')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt.setName('location')
            .setDescription('Dia diem hoac kenh')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Xem danh sach su kien dang dien ra')
    )
    .addSubcommand(sub =>
      sub.setName('end')
        .setDescription('Ket thuc su kien')
        .addStringOption(opt =>
          opt.setName('eventid')
            .setDescription('ID su kien')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── CREATE ──
    if (sub === 'create') {
      const name = interaction.options.getString('name');
      const description = interaction.options.getString('description');
      const time = interaction.options.getString('time');
      const maxPlayers = interaction.options.getInteger('maxplayers') || 100;
      const location = interaction.options.getString('location') || 'Voice Channel';

      const eventId = 'EVT-' + Date.now();

      // Luu su kien
      events.set(eventId, {
        id: eventId,
        name,
        description,
        time,
        maxPlayers,
        location,
        host: interaction.user.id,
        participants: [],
        createdAt: Date.now()
      });

      const embed = new EmbedBuilder()
        .setTitle('SU KIEN MOI: ' + name)
        .setDescription(description)
        .setColor(0x1a3a6e)
        .addFields(
          { name: 'Thoi gian', value: time, inline: true },
          { name: 'Dia diem', value: location, inline: true },
          { name: 'So nguoi toi da', value: String(maxPlayers), inline: true },
          { name: 'Nguoi to chuc', value: interaction.user.toString(), inline: true },
          { name: 'Dang ky', value: '0/' + maxPlayers, inline: true },
          { name: 'ID Su kien', value: eventId, inline: true }
        )
        .setFooter({ text: 'Prime Sentinel • Event System • Nhan nut de tham gia!' })
        .setTimestamp();

      const joinButton = new ButtonBuilder()
        .setCustomId('event_join_' + eventId)
        .setLabel('Tham Gia Ngay')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅');

      const leaveButton = new ButtonBuilder()
        .setCustomId('event_leave_' + eventId)
        .setLabel('Huy Tham Gia')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌');

      const row = new ActionRowBuilder().addComponents(joinButton, leaveButton);

      // Gui vao kenh event
      const eventChannel = interaction.guild.channels.cache.find(
        c => c.name === 'events' || c.name === 'su-kien'
      ) || interaction.channel;

      await eventChannel.send({ embeds: [embed], components: [row] });

      await interaction.reply({
        content: 'Da tao su kien **' + name + '** thanh cong! ID: `' + eventId + '`',
        ephemeral: true
      });

      // Nhac nho truoc 30 phut
      setTimeout(async () => {
        const event = events.get(eventId);
        if (!event) return;

        const reminderEmbed = new EmbedBuilder()
          .setTitle('NHAC NHO: ' + name)
          .setDescription('Su kien **' + name + '** se bat dau sau 30 phut!\nSo nguoi dang ky: ' + event.participants.length + '/' + maxPlayers)
          .setColor(0xffcc00)
          .setTimestamp();

        eventChannel.send({ embeds: [reminderEmbed] });
      }, 30 * 60 * 1000);
    }

    // ── LIST ──
    if (sub === 'list') {
      if (events.size === 0) {
        return interaction.reply({
          content: 'Hien tai khong co su kien nao!',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('DANH SACH SU KIEN')
        .setColor(0x1a3a6e)
        .setTimestamp();

      events.forEach((event) => {
        embed.addFields({
          name: event.name + ' | ' + event.id,
          value:
            'Thoi gian: ' + event.time + '\n' +
            'Dia diem: ' + event.location + '\n' +
            'Dang ky: ' + event.participants.length + '/' + event.maxPlayers,
          inline: false
        });
      });

      await interaction.reply({ embeds: [embed] });
    }

    // ── END ──
    if (sub === 'end') {
      const eventId = interaction.options.getString('eventid');
      const event = events.get(eventId);

      if (!event) {
        return interaction.reply({
          content: 'Khong tim thay su kien voi ID: `' + eventId + '`',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('SU KIEN DA KET THUC: ' + event.name)
        .setDescription('Su kien da ket thuc!')
        .setColor(0xff0000)
        .addFields(
          { name: 'Tong so nguoi tham gia', value: String(event.participants.length), inline: true },
          { name: 'Thoi gian', value: event.time, inline: true }
        )
        .setTimestamp();

      events.delete(eventId);

      const eventChannel = interaction.guild.channels.cache.find(
        c => c.name === 'events' || c.name === 'su-kien'
      ) || interaction.channel;

      await eventChannel.send({ embeds: [embed] });
      await interaction.reply({
        content: 'Da ket thuc su kien **' + event.name + '**!',
        ephemeral: true
      });
    }
  },

  events // Export de dung trong interactionCreate
};
