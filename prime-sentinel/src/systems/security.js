const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const config = {
  spam: { maxMessages: 5, timeWindow: 5000, muteDuration: 5 * 60 * 1000 },
  raid: { maxJoins: 7, timeWindow: 10000 }
};

const spamMap = new Map();
const raidMap = new Map();

async function checkSpam(message) {
  if (message.author.bot) return false;
  if (message.member?.permissions.has(PermissionFlagsBits.Administrator)) return false;
  const userId = message.author.id;
  const now = Date.now();
  if (!spamMap.has(userId)) { spamMap.set(userId, { count: 1, firstMessage: now }); return false; }
  const userData = spamMap.get(userId);
  if (now - userData.firstMessage > config.spam.timeWindow) { spamMap.set(userId, { count: 1, firstMessage: now }); return false; }
  userData.count++;
  if (userData.count >= config.spam.maxMessages) { spamMap.delete(userId); return true; }
  return false;
}

async function checkRaid(guild) {
  const guildId = guild.id;
  const now = Date.now();
  if (!raidMap.has(guildId)) { raidMap.set(guildId, { count: 1, firstJoin: now }); return false; }
  const raidData = raidMap.get(guildId);
  if (now - raidData.firstJoin > config.raid.timeWindow) { raidMap.set(guildId, { count: 1, firstJoin: now }); return false; }
  raidData.count++;
  if (raidData.count >= config.raid.maxJoins) { raidMap.delete(guildId); return true; }
  return false;
}

async function handleSpam(message, logChannel) {
  try {
    await message.delete().catch(() => {});
    const muteRole = message.guild.roles.cache.find(r => r.name === 'Muted');
    if (muteRole) {
      await message.member.roles.add(muteRole);
      setTimeout(() => message.member.roles.remove(muteRole).catch(() => {}), config.spam.muteDuration);
    }
    const warnEmbed = new EmbedBuilder()
      .setTitle('⚠️ CẢNH BÁO SPAM')
      .setDescription(`${message.author} bạn đang spam! Bạn đã bị mute **5 phút**.`)
      .setColor(0xff6600).setTimestamp();
    const warnMsg = await message.channel.send({ embeds: [warnEmbed] });
    setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle('🚫 PHÁT HIỆN SPAM')
        .addFields(
          { name: 'Thành viên', value: `${message.author} (${message.author.tag})`, inline: true },
          { name: 'Kênh', value: `${message.channel}`, inline: true },
          { name: 'Hành động', value: 'Mute 5 phút', inline: true },
          { name: 'Thời gian', value: new Date().toLocaleString('vi-VN'), inline: false }
        )
        .setColor(0xff0000).setThumbnail(message.author.displayAvatarURL());
      logChannel.send({ embeds: [logEmbed] });
    }
  } catch (err) { console.error('Lỗi handleSpam:', err); }
}

async function handleRaid(guild, member, logChannel) {
  try {
    await member.kick('Anti-Raid').catch(() => {});
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle('🚨 CẢNH BÁO RAID!')
        .setDescription('Phát hiện raid! Đã tự động kick thành viên.')
        .addFields(
          { name: 'Thành viên bị kick', value: `${member.user.tag}`, inline: true },
          { name: 'ID', value: member.id, inline: true },
          { name: 'Thời gian', value: new Date().toLocaleString('vi-VN'), inline: false }
        )
        .setColor(0xff0000);
      logChannel.send({ embeds: [logEmbed] });
    }
  } catch (err) { console.error('Lỗi handleRaid:', err); }
}

function checkSuspicious(member) {
  const accountAge = Date.now() - member.user.createdTimestamp;
  const dayInMs = 24 * 60 * 60 * 1000;
  return {
    isNew: accountAge < 7 * dayInMs,
    hasAvatar: member.user.avatar !== null,
    ageInDays: Math.floor(accountAge / dayInMs)
  };
}

module.exports = { checkSpam, checkRaid, handleSpam, handleRaid, checkSuspicious };
