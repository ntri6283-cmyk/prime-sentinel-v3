const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');
const { getUser } = require('../../systems/database');
const fs = require('fs');
const path = require('path');

// Role tu dong theo level
const levelRoles = [
  { level: 5,  name: 'Active Member' },
  { level: 15, name: 'Veteran' },
  { level: 30, name: 'Elite Member' },
  { level: 50, name: 'Prime Legend' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('He thong level')
    .addSubcommand(sub =>
      sub.setName('rank')
        .setDescription('Xem level cua ban than hoac thanh vien khac')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('Thanh vien muon xem')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('top')
        .setDescription('Bang xep hang level')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── RANK ──
    if (sub === 'rank') {
      const target = interaction.options.getUser('user') || interaction.user;
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);

      if (!member) {
        return interaction.reply({
          content: 'Khong tim thay thanh vien!',
          ephemeral: true
        });
      }

      const userData = await getUser(target.id);
      const xpNeeded = userData.level * 500;
      const xpPercent = Math.floor((userData.xp / xpNeeded) * 100);
      const filled = Math.floor(xpPercent / 10);
      const empty = 10 - filled;
      const progressBar = '█'.repeat(filled) + '░'.repeat(empty) + ' ' + xpPercent + '%';

      // Tim role tiep theo
      const nextRole = levelRoles.find(r => r.level > userData.level);
      const nextRoleText = nextRole
        ? 'Level ' + nextRole.level + ' → ' + nextRole.name
        : 'Da dat cap cao nhat!';

      // Tim role hien tai
      const currentRole = [...levelRoles].reverse().find(r => r.level <= userData.level);
      const currentRoleText = currentRole ? currentRole.name : 'Chua co role level';

      const embed = new EmbedBuilder()
        .setTitle('HANG LEVEL: ' + target.username)
        .setThumbnail(target.displayAvatarURL({ size: 256 }))
        .setColor(0x1a3a6e)
        .addFields(
          { name: 'Level hien tai', value: String(userData.level), inline: true },
          { name: 'XP', value: userData.xp + ' / ' + xpNeeded, inline: true },
          { name: 'Role level', value: currentRoleText, inline: true },
          { name: 'Tien do', value: progressBar, inline: false },
          { name: 'Role tiep theo', value: nextRoleText, inline: false }
        )
        .setFooter({ text: 'Prime Sentinel • Level System' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    // ── TOP ──
    if (sub === 'top') {
      const usersPath = path.join(__dirname, '../../../data/users.json');

      if (!fs.existsSync(usersPath)) {
        return interaction.reply({
          content: 'Chua co du lieu level!',
          ephemeral: true
        });
      }

      const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      const sorted = Object.entries(users)
        .sort((a, b) => {
          if (b[1].level !== a[1].level) return b[1].level - a[1].level;
          return b[1].xp - a[1].xp;
        })
        .slice(0, 10);

      if (sorted.length === 0) {
        return interaction.reply({
          content: 'Chua co du lieu!',
          ephemeral: true
        });
      }

      const medals = ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.'];
      let leaderboard = '';

      for (let i = 0; i < sorted.length; i++) {
        const [userId, userData] = sorted[i];
        leaderboard += medals[i] + ' <@' + userId + '> — Level **' + userData.level + '** | ' + userData.xp + ' XP\n';
      }

      const embed = new EmbedBuilder()
        .setTitle('BANG XEP HANG LEVEL')
        .setDescription(leaderboard)
        .setColor(0xffd700)
        .setFooter({ text: 'Prime Sentinel • Level System' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },

  levelRoles
};
