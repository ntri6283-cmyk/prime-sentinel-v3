const { checkSpam, handleSpam } = require('../systems/security');
const { checkAutoMod, getViolationMessage } = require('../systems/automod');
const { addXP, getUser, saveUser } = require('../systems/database');
const { checkAchievements } = require('../systems/achievement');
const { EmbedBuilder } = require('discord.js');

const levelRoles = [
  { level: 5,  name: 'Active Member' },
  { level: 15, name: 'Veteran' },
  { level: 30, name: 'Elite Member' },
  { level: 50, name: 'Prime Legend' }
];

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const logChannel = message.guild.channels.cache.find(c => c.name === 'security-log');

    // Kiem tra spam
    const isSpam = await checkSpam(message);
    if (isSpam) {
      await handleSpam(message, logChannel);
      return;
    }

    // ── AUTO MODERATION ──
    const autoModResult = await checkAutoMod(message);
    if (autoModResult.violated) {
      if (autoModResult.action === 'delete_warn') {
        await message.delete().catch(() => {});
      }

      const warnMsg = await message.channel.send({
        content: message.author.toString() + ' ' + getViolationMessage(autoModResult)
      });
      setTimeout(() => warnMsg.delete().catch(() => {}), 5000);

      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('AUTO MODERATION')
          .addFields(
            { name: 'Thanh vien', value: message.author.toString(), inline: true },
            { name: 'Kenh', value: message.channel.toString(), inline: true },
            { name: 'Loai vi pham', value: autoModResult.type, inline: true },
            { name: 'Noi dung', value: message.content.slice(0, 500), inline: false }
          )
          .setColor(0xff6600)
          .setFooter({ text: 'Prime Sentinel - Auto Moderation' })
          .setTimestamp();
        logChannel.send({ embeds: [embed] });
      }

      if (autoModResult.action === 'delete_warn') return;
    }

    // Cap nhat message count
    const userData = getUser(message.author.id);
    userData.messageCount = (userData.messageCount || 0) + 1;
    saveUser(message.author.id, userData);

    // Cong XP ngau nhien 5-15
    const xpGain = Math.floor(Math.random() * 10) + 5;
    const { user, leveledUp } = addXP(message.author.id, xpGain);

    // Xu ly khi len level
    if (leveledUp) {
      const newRole = levelRoles.find(r => r.level === user.level);
      if (newRole) {
        const role = message.guild.roles.cache.find(r => r.name === newRole.name);
        if (role) await message.member.roles.add(role).catch(() => {});
      }

      const levelChannel = message.guild.channels.cache.find(
        c => c.name === 'level-up'
      ) || message.channel;

      const embed = new EmbedBuilder()
        .setTitle('LEVEL UP!')
        .setDescription(
          'Chuc mung ' + message.author + '!\n' +
          'Ban da dat **Level ' + user.level + '**!\n' +
          '+150 XP bonus!'
        )
        .setColor(0xffd700)
        .setThumbnail(message.author.displayAvatarURL())
        .addFields(
          { name: 'Level moi', value: String(user.level), inline: true },
          { name: 'XP hien tai', value: String(user.xp), inline: true }
        )
        .setFooter({ text: 'Prime Sentinel - Level System' })
        .setTimestamp();

      levelChannel.send({ embeds: [embed] });

      user.xp += 150;
      saveUser(message.author.id, user);
    }

    // Kiem tra achievement
    await checkAchievements(message.author.id, message.guild);
  }
};
