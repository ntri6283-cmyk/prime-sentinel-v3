const { checkSpam, handleSpam } = require('../systems/security');
const { checkAutoMod, getViolationMessage } = require('../systems/automod');
const { addXP, getUser, saveUser } = require('../systems/database');
const { checkAchievements } = require('../systems/achievement');
const { addCoins } = require('../systems/economy');
const { incrementMission } = require('../systems/mission');
const { analyzeToxicity } = require('../systems/ai');
const { EmbedBuilder } = require('discord.js');

const levelRoles = [
  { level: 5, name: 'Active Member' },
  { level: 15, name: 'Veteran' },
  { level: 30, name: 'Elite Member' },
  { level: 50, name: 'Prime Legend' },
];

let msgCounter = 0;

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const logChannel = message.guild.channels.cache.find(c => c.name === 'security-log');

    const isSpam = await checkSpam(message);
    if (isSpam) { await handleSpam(message, logChannel); return; }

    const autoModResult = await checkAutoMod(message);
    if (autoModResult.violated) {
      if (autoModResult.action === 'delete_warn') await message.delete().catch(() => {});
      const warnMsg = await message.channel.send({ content: message.author.toString() + ' ' + getViolationMessage(autoModResult) });
      setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
      if (logChannel) {
        const embed = new EmbedBuilder().setTitle('AUTO MODERATION')
          .addFields(
            { name: 'Thanh vien', value: message.author.toString(), inline: true },
            { name: 'Kenh', value: message.channel.toString(), inline: true },
            { name: 'Vi pham', value: autoModResult.type, inline: true },
            { name: 'Noi dung', value: message.content.slice(0, 500) }
          )
          .setColor(0xff6600).setFooter({ text: 'Prime Sentinel - Auto Moderation' }).setTimestamp();
        logChannel.send({ embeds: [embed] });
      }
      if (autoModResult.action === 'delete_warn') return;
    }

    // AI Toxicity - phan tich 1/10 tin nhan dai hon 20 ky tu
    msgCounter++;
    if (msgCounter % 10 === 0 && message.content.length > 20) {
      analyzeToxicity(message.content).then(async result => {
        if (result.score >= 70 && result.action !== 'safe' && logChannel) {
          if (result.action === 'delete') await message.delete().catch(() => {});
          const embed = new EmbedBuilder().setTitle('🤖 AI TOXICITY DETECTED').setColor(result.score >= 85 ? 0xff0000 : 0xff6600)
            .addFields(
              { name: 'Thanh vien', value: message.author.toString(), inline: true },
              { name: 'Diem doc hai', value: `${result.score}/100`, inline: true },
              { name: 'Loai', value: result.type, inline: true },
              { name: 'Hanh dong', value: result.action, inline: true },
              { name: 'Ly do', value: result.reason, inline: false },
              { name: 'Noi dung', value: message.content.slice(0, 300), inline: false },
            )
            .setFooter({ text: 'Prime Sentinel AI Toxicity Detector' }).setTimestamp();
          logChannel.send({ embeds: [embed] });
        }
      }).catch(() => {});
    }

    // Cap nhat data
    const userData = await getUser(message.author.id);
    userData.messageCount = (userData.messageCount || 0) + 1;
    await saveUser(message.author.id, userData);
    await incrementMission(message.author.id, 'messages');
    await addCoins(message.author.id, Math.floor(Math.random() * 6) + 3);

    const { user, leveledUp } = await addXP(message.author.id, Math.floor(Math.random() * 10) + 5);
    if (leveledUp) {
      const newRole = levelRoles.find(r => r.level === user.level);
      if (newRole) {
        const role = message.guild.roles.cache.find(r => r.name === newRole.name);
        if (role) await message.member.roles.add(role).catch(() => {});
      }
      const ch = message.guild.channels.cache.find(c => c.name === 'level-up') || message.channel;
      const embed = new EmbedBuilder().setTitle('⬆️ LEVEL UP!')
        .setDescription(`Chuc mung ${message.author}! Ban dat **Level ${user.level}**! +150 XP bonus!`)
        .setColor(0xffd700).setThumbnail(message.author.displayAvatarURL())
        .addFields(
          { name: 'Level moi', value: String(user.level), inline: true },
          { name: 'XP hien tai', value: String(user.xp), inline: true }
        )
        .setFooter({ text: 'Prime Sentinel - Level System' }).setTimestamp();
      ch.send({ embeds: [embed] });
      user.xp += 150; await user.save();
    }

    await checkAchievements(message.author.id, message.guild);
  }
};
