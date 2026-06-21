const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');

const polls = new Map();

const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('He thong binh chon')
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Tao binh chon moi')
        .addStringOption(opt =>
          opt.setName('question')
            .setDescription('Cau hoi binh chon')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('options')
            .setDescription('Cac lua chon, cach nhau boi dau |  (VD: A|B|C)')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('duration')
            .setDescription('Thoi gian (phut), de trong = khong gioi han')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('end')
        .setDescription('Ket thuc binh chon va xem ket qua')
        .addStringOption(opt =>
          opt.setName('pollid')
            .setDescription('ID binh chon')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('quick')
        .setDescription('Tao binh chon Co/Khong nhanh')
        .addStringOption(opt =>
          opt.setName('question')
            .setDescription('Cau hoi binh chon')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── CREATE ──
    if (sub === 'create') {
      const question = interaction.options.getString('question');
      const optionsStr = interaction.options.getString('options');
      const duration = interaction.options.getInteger('duration');

      const options = optionsStr.split('|').map(o => o.trim()).filter(o => o.length > 0);

      if (options.length < 2) {
        return interaction.reply({
          content: 'Can it nhat 2 lua chon! Vi du: A|B|C',
          ephemeral: true
        });
      }

      if (options.length > 10) {
        return interaction.reply({
          content: 'Toi da 10 lua chon!',
          ephemeral: true
        });
      }

      const pollId = 'POLL-' + Date.now().toString().slice(-6);

      let description = '';
      options.forEach((opt, i) => {
        description += numberEmojis[i] + ' ' + opt + '\n\n';
      });

      const embed = new EmbedBuilder()
        .setTitle('BINH CHON: ' + question)
        .setDescription(description)
        .setColor(0x1a3a6e)
        .addFields(
          { name: 'Nguoi tao', value: interaction.user.toString(), inline: true },
          { name: 'ID', value: pollId, inline: true }
        )
        .setFooter({ text: 'Prime Sentinel - Poll System | Nhan emoji de binh chon' })
        .setTimestamp();

      if (duration) {
        embed.addFields({
          name: 'Ket thuc',
          value: '<t:' + Math.floor((Date.now() + duration * 60000) / 1000) + ':R>',
          inline: true
        });
      }

      const msg = await interaction.channel.send({ embeds: [embed] });

      // Them reaction cho moi lua chon
      for (let i = 0; i < options.length; i++) {
        await msg.react(numberEmojis[i]);
      }

      polls.set(pollId, {
        id: pollId,
        question,
        options,
        messageId: msg.id,
        channelId: msg.channel.id,
        host: interaction.user.id,
        ended: false
      });

      await interaction.reply({
        content: 'Da tao binh chon **' + question + '**! ID: ' + pollId,
        ephemeral: true
      });

      // Tu dong ket thuc neu co duration
      if (duration) {
        setTimeout(async () => {
          await endPoll(pollId, interaction.guild);
        }, duration * 60 * 1000);
      }
    }

    // ── QUICK (Co/Khong) ──
    if (sub === 'quick') {
      const question = interaction.options.getString('question');

      const embed = new EmbedBuilder()
        .setTitle('BINH CHON NHANH')
        .setDescription(question)
        .setColor(0x1a3a6e)
        .addFields(
          { name: 'Nguoi tao', value: interaction.user.toString(), inline: true }
        )
        .setFooter({ text: 'Prime Sentinel - Poll System | Nhan ✅ hoac ❌ de binh chon' })
        .setTimestamp();

      const msg = await interaction.channel.send({ embeds: [embed] });
      await msg.react('✅');
      await msg.react('❌');

      await interaction.reply({
        content: 'Da tao binh chon nhanh!',
        ephemeral: true
      });
    }

    // ── END ──
    if (sub === 'end') {
      const pollId = interaction.options.getString('pollid');
      const poll = polls.get(pollId);

      if (!poll) {
        return interaction.reply({
          content: 'Khong tim thay binh chon: ' + pollId,
          ephemeral: true
        });
      }

      if (poll.ended) {
        return interaction.reply({
          content: 'Binh chon nay da ket thuc roi!',
          ephemeral: true
        });
      }

      await endPoll(pollId, interaction.guild);
      await interaction.reply({
        content: 'Da ket thuc binh chon **' + poll.question + '**!',
        ephemeral: true
      });
    }
  },

  polls
};

// Ham ket thuc poll va hien ket qua
async function endPoll(pollId, guild) {
  const { polls } = require('./poll');
  const poll = polls.get(pollId);

  if (!poll || poll.ended) return;
  poll.ended = true;

  try {
    const channel = await guild.channels.fetch(poll.channelId);
    const msg = await channel.messages.fetch(poll.messageId);

    // Lay so luong vote cho moi lua chon
    const results = [];
    for (let i = 0; i < poll.options.length; i++) {
      const reaction = msg.reactions.cache.get(numberEmojis[i]);
      const count = reaction ? reaction.count - 1 : 0; // Tru 1 vi bot tu react
      results.push({ option: poll.options[i], count: Math.max(0, count) });
    }

    // Sap xep theo so vote
    results.sort((a, b) => b.count - a.count);
    const totalVotes = results.reduce((sum, r) => sum + r.count, 0);

    let description = '';
    results.forEach((r, i) => {
      const percent = totalVotes > 0 ? Math.round((r.count / totalVotes) * 100) : 0;
      const barLength = Math.round(percent / 10);
      const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
      description += (i === 0 ? '🏆 ' : '') + r.option + '\n' + bar + ' ' + r.count + ' votes (' + percent + '%)\n\n';
    });

    const resultEmbed = new EmbedBuilder()
      .setTitle('KET QUA: ' + poll.question)
      .setDescription(description)
      .setColor(0x00ff88)
      .addFields(
        { name: 'Tong so vote', value: String(totalVotes), inline: true },
        { name: 'Ket qua', value: totalVotes > 0 ? results[0].option + ' chien thang!' : 'Khong co vote nao', inline: true }
      )
      .setFooter({ text: 'Prime Sentinel - Poll System | Da ket thuc' })
      .setTimestamp();

    await msg.edit({ embeds: [resultEmbed] });
    await channel.send({ embeds: [resultEmbed] });

  } catch (err) {
    console.error('Loi ket thuc poll:', err);
  }
}
