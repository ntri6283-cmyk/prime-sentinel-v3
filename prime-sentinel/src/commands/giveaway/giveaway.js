const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits
} = require('discord.js');

const giveaways = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('He thong giveaway')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Tao giveaway moi')
        .addStringOption(opt =>
          opt.setName('prize')
            .setDescription('Phan thuong')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('duration')
            .setDescription('Thoi gian (phut)')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('winners')
            .setDescription('So nguoi thang')
            .setRequired(false)
        )
        .addIntegerOption(opt =>
          opt.setName('minlevel')
            .setDescription('Level toi thieu de tham gia')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('end')
        .setDescription('Ket thuc giveaway som')
        .addStringOption(opt =>
          opt.setName('giveawayid')
            .setDescription('ID giveaway')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('reroll')
        .setDescription('Quay lai giveaway')
        .addStringOption(opt =>
          opt.setName('giveawayid')
            .setDescription('ID giveaway')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Xem danh sach giveaway dang dien ra')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'create') {
      const prize = interaction.options.getString('prize');
      const duration = interaction.options.getInteger('duration');
      const winners = interaction.options.getInteger('winners') || 1;
      const minLevel = interaction.options.getInteger('minlevel') || 0;
      const giveawayId = 'GVW-' + Date.now();
      const endTime = Date.now() + duration * 60 * 1000;

      giveaways.set(giveawayId, {
        id: giveawayId,
        prize,
        duration,
        winners,
        minLevel,
        host: interaction.user.id,
        participants: [],
        endTime,
        ended: false,
        channelId: interaction.channel.id,
        messageId: null
      });

      const embed = new EmbedBuilder()
        .setTitle('GIVEAWAY!')
        .setDescription(
          'Phan thuong: **' + prize + '**\n\n' +
          'Nhan nut ben duoi de tham gia!\n\n' +
          'Ket thuc: <t:' + Math.floor(endTime / 1000) + ':R>'
        )
        .setColor(0xffd700)
        .addFields(
          { name: 'So nguoi thang', value: String(winners), inline: true },
          { name: 'Level toi thieu', value: minLevel > 0 ? String(minLevel) : 'Khong yeu cau', inline: true },
          { name: 'Nguoi to chuc', value: interaction.user.toString(), inline: true },
          { name: 'Dang ky', value: '0 nguoi', inline: true },
          { name: 'ID', value: giveawayId, inline: true }
        )
        .setFooter({ text: 'Prime Sentinel - Giveaway System' })
        .setTimestamp();

      const joinButton = new ButtonBuilder()
        .setCustomId('giveaway_join_' + giveawayId)
        .setLabel('Tham Gia')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎉');

      const row = new ActionRowBuilder().addComponents(joinButton);
      const msg = await interaction.channel.send({ embeds: [embed], components: [row] });

      const giveaway = giveaways.get(giveawayId);
      giveaway.messageId = msg.id;

      await interaction.reply({
        content: 'Da tao giveaway **' + prize + '**! ID: ' + giveawayId,
        ephemeral: true
      });

      setTimeout(async () => {
        await endGiveaway(giveawayId, interaction.guild, interaction.channel);
      }, duration * 60 * 1000);
    }

    if (sub === 'end') {
      const giveawayId = interaction.options.getString('giveawayid');
      const giveaway = giveaways.get(giveawayId);

      if (!giveaway) {
        return interaction.reply({
          content: 'Khong tim thay giveaway: ' + giveawayId,
          ephemeral: true
        });
      }

      if (giveaway.ended) {
        return interaction.reply({
          content: 'Giveaway nay da ket thuc roi!',
          ephemeral: true
        });
      }

      await endGiveaway(giveawayId, interaction.guild, interaction.channel);
      await interaction.reply({
        content: 'Da ket thuc giveaway **' + giveaway.prize + '**!',
        ephemeral: true
      });
    }

    if (sub === 'reroll') {
      const giveawayId = interaction.options.getString('giveawayid');
      const giveaway = giveaways.get(giveawayId);

      if (!giveaway || !giveaway.ended) {
        return interaction.reply({
          content: 'Khong tim thay giveaway da ket thuc: ' + giveawayId,
          ephemeral: true
        });
      }

      if (giveaway.participants.length === 0) {
        return interaction.reply({
          content: 'Khong co ai tham gia giveaway nay!',
          ephemeral: true
        });
      }

      const newWinners = pickWinners(giveaway.participants, giveaway.winners);
      const winnerMentions = newWinners.map(id => '<@' + id + '>').join(', ');

      const embed = new EmbedBuilder()
        .setTitle('REROLL GIVEAWAY!')
        .setDescription(
          'Nguoi thang moi cua giveaway **' + giveaway.prize + '**!\n\n' +
          'Chuc mung: ' + winnerMentions
        )
        .setColor(0xffd700)
        .setTimestamp();

      await interaction.channel.send({ embeds: [embed] });
      await interaction.reply({
        content: 'Da reroll giveaway!',
        ephemeral: true
      });
    }

    if (sub === 'list') {
      const activeGiveaways = [...giveaways.values()].filter(g => !g.ended);

      if (activeGiveaways.length === 0) {
        return interaction.reply({
          content: 'Hien tai khong co giveaway nao!',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('DANH SACH GIVEAWAY')
        .setColor(0xffd700)
        .setTimestamp();

      activeGiveaways.forEach(g => {
        embed.addFields({
          name: g.prize + ' | ' + g.id,
          value:
            'Nguoi thang: ' + g.winners + '\n' +
            'Dang ky: ' + g.participants.length + ' nguoi\n' +
            'Ket thuc: <t:' + Math.floor(g.endTime / 1000) + ':R>',
          inline: false
        });
      });

      await interaction.reply({ embeds: [embed] });
    }
  },

  giveaways
};

function pickWinners(participants, count) {
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

async function endGiveaway(giveawayId, guild, channel) {
  const { giveaways } = require('./giveaway');
  const giveaway = giveaways.get(giveawayId);

  if (!giveaway || giveaway.ended) return;
  giveaway.ended = true;

  if (giveaway.participants.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle('GIVEAWAY KET THUC!')
      .setDescription('Giveaway **' + giveaway.prize + '** da ket thuc!\n\nKhong co ai tham gia!')
      .setColor(0xff0000)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    return;
  }

  const winners = pickWinners(giveaway.participants, giveaway.winners);
  const winnerMentions = winners.map(id => '<@' + id + '>').join(', ');

  const embed = new EmbedBuilder()
    .setTitle('GIVEAWAY KET THUC!')
    .setDescription(
      'Giveaway **' + giveaway.prize + '** da ket thuc!\n\n' +
      'Nguoi thang: ' + winnerMentions + '\n\n' +
      'Chuc mung! Lien he <@' + giveaway.host + '> de nhan thuong!'
    )
    .setColor(0xffd700)
    .addFields(
      { name: 'Phan thuong', value: giveaway.prize, inline: true },
      { name: 'Tong dang ky', value: String(giveaway.participants.length), inline: true },
      { name: 'So nguoi thang', value: String(winners.length), inline: true }
    )
    .setFooter({ text: 'Prime Sentinel - Giveaway System' })
    .setTimestamp();

  await channel.send({
    content: winnerMentions + ' Chuc mung ban da thang giveaway!',
    embeds: [embed]
  });
}
