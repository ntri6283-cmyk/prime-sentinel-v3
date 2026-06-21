const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, saveUser, User } = require('../../systems/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rep')
    .setDescription('He thong danh tieng')
    .addSubcommand(sub =>
      sub.setName('give')
        .setDescription('Danh gia thanh vien')
        .addUserOption(opt => opt.setName('user').setDescription('Thanh vien can danh gia').setRequired(true))
        .addStringOption(opt =>
          opt.setName('type').setDescription('Loai danh gia').setRequired(true)
            .addChoices(
              { name: 'Helpful - Nhiet tinh giup do', value: 'helpful' },
              { name: 'Friendly - Than thien hoa dong', value: 'friendly' },
              { name: 'Trusted - Dang tin cay', value: 'trusted' },
              { name: 'Active - Hoat dong tich cuc', value: 'active' },
            )
        )
    )
    .addSubcommand(sub => sub.setName('top').setDescription('Xem bang xep hang danh tieng'))
    .addSubcommand(sub =>
      sub.setName('check').setDescription('Xem danh tieng thanh vien')
        .addUserOption(opt => opt.setName('user').setDescription('Thanh vien can xem').setRequired(false))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'give') {
      const target = interaction.options.getUser('user');
      const type = interaction.options.getString('type');
      const giverId = interaction.user.id;

      if (target.id === giverId) {
        return interaction.reply({ content: 'Ban khong the tu danh gia ban than!', ephemeral: true });
      }

      const giverData = await getUser(giverId);
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      const lastRepTime = giverData.lastRep?.get(target.id);
      if (lastRepTime && now - lastRepTime < oneDayMs) {
        const timeLeft = oneDayMs - (now - lastRepTime);
        const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        return interaction.reply({
          content: `Ban da danh gia nguoi nay roi! Con ${hoursLeft} gio ${minutesLeft} phut nua moi co the danh gia lai.`,
          ephemeral: true
        });
      }

      const targetData = await getUser(target.id);
      if (!targetData.repDetails) targetData.repDetails = { helpful: 0, friendly: 0, trusted: 0, active: 0 };
      targetData.repDetails[type] = (targetData.repDetails[type] || 0) + 1;
      targetData.reputation = (targetData.reputation || 0) + 1;
      await targetData.save();

      if (!giverData.lastRep) giverData.lastRep = new Map();
      giverData.lastRep.set(target.id, now);
      await giverData.save();

      const typeNames = { helpful: 'Helpful - Nhiet tinh', friendly: 'Friendly - Than thien', trusted: 'Trusted - Dang tin cay', active: 'Active - Tich cuc' };

      const embed = new EmbedBuilder()
        .setTitle('DANH GIA THANH CONG!')
        .setDescription(`${interaction.user} da danh gia ${target}!\n\nLoai: **${typeNames[type]}**\nCam on ban da dong gop cho cong dong!`)
        .setColor(0x00ff88)
        .addFields(
          { name: 'Nguoi duoc danh gia', value: target.toString(), inline: true },
          { name: 'Tong Reputation', value: String(targetData.reputation), inline: true },
          { name: 'Loai', value: typeNames[type], inline: true }
        )
        .setThumbnail(target.displayAvatarURL())
        .setFooter({ text: 'Prime Sentinel • Reputation System' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'check') {
      const target = interaction.options.getUser('user') || interaction.user;
      const targetData = await getUser(target.id);
      if (!targetData.repDetails) targetData.repDetails = { helpful: 0, friendly: 0, trusted: 0, active: 0 };

      const { helpful, friendly, trusted, active } = targetData.repDetails;

      const embed = new EmbedBuilder()
        .setTitle('DANH TIENG: ' + target.username)
        .setThumbnail(target.displayAvatarURL())
        .setColor(0x1a3a6e)
        .addFields(
          { name: 'Tong Reputation', value: String(targetData.reputation || 0) + ' sao', inline: true },
          { name: 'Helpful', value: String(helpful), inline: true },
          { name: 'Friendly', value: String(friendly), inline: true },
          { name: 'Trusted', value: String(trusted), inline: true },
          { name: 'Active', value: String(active), inline: true }
        )
        .setFooter({ text: 'Prime Sentinel • Reputation System' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'top') {
      const topUsers = await User.find().sort({ reputation: -1 }).limit(10);

      if (!topUsers.length) {
        return interaction.reply({ content: 'Chua co ai duoc danh gia!', ephemeral: true });
      }

      const medals = ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.'];
      let leaderboard = '';
      topUsers.forEach((u, i) => {
        leaderboard += `${medals[i]} <@${u.userId}> — **${u.reputation || 0}** rep\n`;
      });

      const embed = new EmbedBuilder()
        .setTitle('BANG XEP HANG DANH TIENG')
        .setDescription(leaderboard)
        .setColor(0xffd700)
        .setFooter({ text: 'Prime Sentinel • Reputation System' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  }
};
