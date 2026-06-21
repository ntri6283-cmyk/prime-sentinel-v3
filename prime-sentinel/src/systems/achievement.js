const { EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('./database');

const achievements = [
  { id: 'first_message',    name: 'First Step',        desc: 'Gui tin nhan dau tien',        check: u => u.messageCount >= 1 },
  { id: 'chatty',           name: 'Chatty',            desc: 'Gui 100 tin nhan',             check: u => u.messageCount >= 100 },
  { id: 'veteran_member',   name: 'Veteran Member',    desc: 'Dat Level 15',                 check: u => u.level >= 15 },
  { id: 'community_helper', name: 'Community Helper',  desc: 'Nhan 10 danh gia Helpful',     check: u => (u.repDetails?.helpful || 0) >= 10 },
  { id: 'prime_guardian',   name: 'Prime Guardian',    desc: 'Dat Level 30',                 check: u => u.level >= 30 },
  { id: 'prime_legend',     name: 'Prime Legend',      desc: 'Dat Level 50',                 check: u => u.level >= 50 },
  { id: 'trusted',          name: 'Trusted',           desc: 'Nhan 10 danh gia Trusted',     check: u => (u.repDetails?.trusted || 0) >= 10 },
  { id: 'popular',          name: 'Popular',           desc: 'Nhan tong 50 danh gia',        check: u => (u.reputation || 0) >= 50 },
  { id: 'voice_master',     name: 'Voice Master',      desc: 'Dung voice 100 phut',          check: u => (u.voiceMinutes || 0) >= 100 },
];

async function checkAchievements(userId, guild) {
  const userData = await getUser(userId);
  if (!userData.achievements) userData.achievements = [];
  const newAchievements = [];
  for (const a of achievements) {
    if (!userData.achievements.includes(a.id) && a.check(userData)) {
      userData.achievements.push(a.id);
      newAchievements.push(a);
    }
  }
  if (newAchievements.length > 0) {
    await saveUser(userId, userData);
    const ch = guild?.channels.cache.find(c => c.name === 'achievements');
    if (ch) {
      for (const a of newAchievements) {
        const embed = new EmbedBuilder().setTitle('ACHIEVEMENT UNLOCKED!')
          .setDescription(`<@${userId}> da mo khoa:\n\n**${a.name}**\n${a.desc}`)
          .setColor(0xffd700).setFooter({ text: 'Prime Sentinel • Achievement System' }).setTimestamp();
        ch.send({ embeds: [embed] });
      }
    }
  }
  return newAchievements;
}

function getAllAchievements() { return achievements; }
module.exports = { checkAchievements, getAllAchievements };
