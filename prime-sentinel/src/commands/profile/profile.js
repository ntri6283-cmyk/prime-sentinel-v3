const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser } = require('../../systems/database');
const { getEconomy } = require('../../systems/economy');

const BADGES = {
  'first_message':    '🏅',
  'chatty':           '💬',
  'veteran_member':   '⚔️',
  'community_helper': '🤝',
  'prime_guardian':   '🛡️',
  'prime_legend':     '👑',
  'trusted':          '✅',
  'popular':          '⭐',
  'voice_master':     '🎙️',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Xem ho so thanh vien')
    .addUserOption(o => o.setName('user').setDescription('Thanh vien muon xem').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.reply({ content: 'Khong tim thay thanh vien!', ephemeral: true });

    const userData = await getUser(target.id);
    const ecoData = await getEconomy(target.id);

    const xpNeeded = userData.level * 500;
    const xpPercent = Math.min(Math.floor((userData.xp / xpNeeded) * 100), 100);
    const filled = Math.floor(xpPercent / 10);
    const progressBar = '█'.repeat(filled) + '░'.repeat(10 - filled) + ` ${xpPercent}%`;

    const joinedAt = member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : 'Khong ro';
    const createdAt = `<t:${Math.floor(target.createdTimestamp / 1000)}:D>`;

    // Rank title dua theo level
    const getRank = (level) => {
      if (level >= 50) return '👑 Prime Legend';
      if (level >= 30) return '🔥 Elite Member';
      if (level >= 15) return '⚔️ Veteran';
      if (level >= 5)  return '🌟 Active Member';
      return '🌱 Newcomer';
    };

    // Badges
    const badgeList = (userData.achievements || []).map(a => BADGES[a] || '🏆').join(' ') || 'Chua co badge';

    // Voice time format
    const voiceMin = userData.voiceMinutes || 0;
    const voiceHr = Math.floor(voiceMin / 60);
    const voiceRemain = voiceMin % 60;
    const voiceStr = voiceHr > 0 ? `${voiceHr}h ${voiceRemain}m` : `${voiceMin}m`;

    // Journey
    const journey = (userData.journey || []).slice(-5).map(j => `• ${j.event}`).join('\n') || 'Chua co hanh trinh';

    // Risk level
    const risk = userData.riskScore || 0;
    const riskStr = risk <= 20 ? '🟢 An toan' : risk <= 50 ? '🟡 Trung binh' : '🔴 Rui ro';

    const embed = new EmbedBuilder()
      .setTitle(`PROFILE 2.0 • ${member.displayName}`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .setColor(0x7c3aed)
      .addFields(
        { name: 'Prime ID',       value: userData.primeId || 'N/A', inline: true },
        { name: 'Rank',           value: getRank(userData.level),   inline: true },
        { name: 'Risk Level',     value: riskStr,                   inline: true },
        { name: 'Level',          value: `⭐ ${userData.level}`,    inline: true },
        { name: 'Reputation',     value: `🏆 ${userData.reputation}`, inline: true },
        { name: 'Prime Coins',    value: `🪙 ${ecoData.coins}`,     inline: true },
        { name: 'Tin nhan',       value: `💬 ${userData.messageCount || 0}`, inline: true },
        { name: 'Voice Time',     value: `🎙️ ${voiceStr}`,          inline: true },
        { name: 'Events',         value: `🎯 ${userData.eventsJoined || 0}`, inline: true },
        { name: 'Daily Streak',   value: `🔥 ${ecoData.dailyStreak || 0} ngay`, inline: true },
        { name: 'Achievements',   value: `🎖️ ${(userData.achievements || []).length}`, inline: true },
        { name: 'Badges',         value: `${(userData.badges || []).length}`, inline: true },
        { name: 'Tien do XP',     value: `${userData.xp}/${xpNeeded}\n${progressBar}`, inline: false },
        { name: '🏅 Badges',      value: badgeList, inline: false },
        { name: '🗺️ Hanh Trinh',  value: journey, inline: false },
        { name: 'Tham gia server', value: joinedAt, inline: true },
        { name: 'Tao tai khoan',   value: createdAt, inline: true },
      )
      .setFooter({ text: `Prime Sentinel • ${target.username}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
