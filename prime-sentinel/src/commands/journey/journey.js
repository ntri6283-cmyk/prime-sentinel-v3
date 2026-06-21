const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, addJourney } = require('../../systems/database');

const MILESTONES = [
  { event: 'Joined',     check: u => true },
  { event: 'Verified',   check: u => (u.warnings || 0) === 0 && (u.messageCount || 0) >= 1 },
  { event: 'Level 5',    check: u => u.level >= 5 },
  { event: 'First Event',check: u => (u.eventsJoined || 0) >= 1 },
  { event: 'Trusted',    check: u => (u.reputation || 0) >= 10 },
  { event: 'Veteran',    check: u => u.level >= 15 },
  { event: 'Elite',      check: u => u.level >= 30 },
  { event: 'Legend',     check: u => u.level >= 50 },
];

const MILESTONE_ICONS = {
  'Joined': '🚪', 'Verified': '✅', 'Level 5': '⭐', 'First Event': '🎯',
  'Trusted': '🤝', 'Veteran': '⚔️', 'Elite': '🔥', 'Legend': '👑'
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('journey')
    .setDescription('Xem hanh trinh thanh vien')
    .addSubcommand(s => s.setName('view').setDescription('Xem hanh trinh cua ban')
      .addUserOption(o => o.setName('user').setDescription('Thanh vien').setRequired(false)))
    .addSubcommand(s => s.setName('update').setDescription('Cap nhat hanh trinh cua ban')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'view') {
      const target = interaction.options.getUser('user') || interaction.user;
      const userData = await getUser(target.id);
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);

      const completed = MILESTONES.filter(m => m.check(userData));
      const current = completed[completed.length - 1] || MILESTONES[0];
      const next = MILESTONES[completed.length] || null;

      const timeline = MILESTONES.map(m => {
        const done = m.check(userData);
        const icon = MILESTONE_ICONS[m.event] || '📍';
        return `${done ? '✅' : '⬜'} ${icon} **${m.event}**`;
      }).join('\n');

      // Journey log
      const journeyLog = (userData.journey || []).slice(-5)
        .map(j => `• <t:${Math.floor(new Date(j.date).getTime() / 1000)}:d> — ${j.event}`)
        .join('\n') || 'Chua co su kien nao';

      const embed = new EmbedBuilder()
        .setTitle(`🗺️ MEMBER JOURNEY • ${target.username}`)
        .setColor(0x7c3aed)
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: 'Giai doan hien tai', value: `${MILESTONE_ICONS[current.event]} **${current.event}**`, inline: true },
          { name: 'Giai doan tiep theo', value: next ? `${MILESTONE_ICONS[next.event]} ${next.event}` : '👑 Da dat dinh!', inline: true },
          { name: 'Tien do', value: `${completed.length}/${MILESTONES.length} moc`, inline: true },
          { name: '📊 Thong ke', value: [
            `💬 Tin nhan: ${userData.messageCount || 0}`,
            `⭐ Level: ${userData.level}`,
            `🤝 Reputation: ${userData.reputation || 0}`,
            `🎯 Events: ${userData.eventsJoined || 0}`,
            `🎙️ Voice: ${Math.floor((userData.voiceMinutes || 0) / 60)}h`,
          ].join('\n'), inline: true },
          { name: '🏁 Lo trinh', value: timeline, inline: false },
          { name: '📅 Lich su gan day', value: journeyLog, inline: false },
        )
        .setFooter({ text: 'Prime Sentinel • Member Journey System' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'update') {
      const userData = await getUser(interaction.user.id);
      const newMilestones = [];

      for (const m of MILESTONES) {
        const alreadyLogged = (userData.journey || []).some(j => j.event === m.event);
        if (!alreadyLogged && m.check(userData)) {
          await addJourney(interaction.user.id, m.event);
          newMilestones.push(m.event);
        }
      }

      if (newMilestones.length > 0) {
        const embed = new EmbedBuilder()
          .setTitle('🎉 HANH TRINH CAP NHAT!')
          .setColor(0x00ff88)
          .setDescription(`${interaction.user} da dat duoc cac moc moi:\n\n${newMilestones.map(m => `✅ ${MILESTONE_ICONS[m]} **${m}**`).join('\n')}`)
          .setFooter({ text: 'Prime Sentinel • Member Journey' }).setTimestamp();
        await interaction.reply({ embeds: [embed] });
      } else {
        await interaction.reply({ content: 'Hanh trinh cua ban da duoc cap nhat day du!', ephemeral: true });
      }
    }
  }
};
