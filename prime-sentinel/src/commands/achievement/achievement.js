const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');
const { getUser } = require('../../systems/database');
const { getAllAchievements } = require('../../systems/achievement');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('achievement')
    .setDescription('He thong thanh tich')
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Xem danh sach achievement cua ban than')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('Thanh vien muon xem')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('all')
        .setDescription('Xem tat ca achievement co the mo khoa')
    )
    .addSubcommand(sub =>
      sub.setName('top')
        .setDescription('Bang xep hang achievement')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const allAchievements = getAllAchievements();

    // ── LIST ──
    if (sub === 'list') {
      const target = interaction.options.getUser('user') || interaction.user;
      const userData = await getUser(target.id);
      if (!userData.achievements) userData.achievements = [];

      const unlocked = allAchievements.filter(a =>
        userData.achievements.includes(a.id)
      );
      const locked = allAchievements.filter(a =>
        !userData.achievements.includes(a.id)
      );

      let unlockedText = unlocked.length > 0
        ? unlocked.map(a => '✅ **' + a.name + '** — ' + a.description).join('\n')
        : 'Chua co achievement nao!';

      let lockedText = locked.length > 0
        ? locked.map(a => '🔒 **' + a.name + '** — ' + a.description).join('\n')
        : 'Da mo khoa tat ca!';

      const embed = new EmbedBuilder()
        .setTitle('ACHIEVEMENT: ' + target.username)
        .setThumbnail(target.displayAvatarURL())
        .setColor(0xffd700)
        .addFields(
          {
            name: 'Da mo khoa (' + unlocked.length + '/' + allAchievements.length + ')',
            value: unlockedText,
            inline: false
          },
          {
            name: 'Chua mo khoa',
            value: lockedText,
            inline: false
          }
        )
        .setFooter({ text: 'Prime Sentinel • Achievement System' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── ALL ──
    if (sub === 'all') {
      const list = allAchievements
        .map(a => '🏅 **' + a.name + '** — ' + a.description)
        .join('\n');

      const embed = new EmbedBuilder()
        .setTitle('TAT CA ACHIEVEMENT (' + allAchievements.length + ')')
        .setDescription(list)
        .setColor(0xffd700)
        .setFooter({ text: 'Prime Sentinel • Achievement System' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── TOP ──
    if (sub === 'top') {
      const usersPath = path.join(__dirname, '../../../data/users.json');

      if (!fs.existsSync(usersPath)) {
        return interaction.reply({
          content: 'Chua co du lieu!',
          ephemeral: true
        });
      }

      const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      const sorted = Object.entries(users)
        .sort((a, b) =>
          (b[1].achievements?.length || 0) - (a[1].achievements?.length || 0)
        )
        .slice(0, 10);

      let leaderboard = '';
      const medals = ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.'];

      for (let i = 0; i < sorted.length; i++) {
        const [userId, userData] = sorted[i];
        leaderboard += medals[i] + ' <@' + userId + '> — **' +
          (userData.achievements?.length || 0) + '** achievements\n';
      }

      const embed = new EmbedBuilder()
        .setTitle('BANG XEP HANG ACHIEVEMENT')
        .setDescription(leaderboard || 'Chua co du lieu!')
        .setColor(0xffd700)
        .setFooter({ text: 'Prime Sentinel • Achievement System' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  }
};