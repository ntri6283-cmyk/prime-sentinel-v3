const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getEconomy, addCoins } = require('../../systems/economy');
const { addXP } = require('../../systems/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkin')
    .setDescription('Diem danh hang ngay nhan phan thuong'),

  async execute(interaction) {
    const eco = await getEconomy(interaction.user.id);
    const now = new Date(), oneDay = 86400000;
    const last = eco.lastDaily ? new Date(eco.lastDaily) : null;
    if (last && now - last < oneDay) {
      const hours = Math.ceil((oneDay - (now - last)) / 3600000);
      return interaction.reply({ content: `Ban da diem danh hom nay roi! Con **${hours} gio** nua.`, ephemeral: true });
    }
    const streak = last && now - last < 2 * oneDay ? eco.dailyStreak + 1 : 1;
    const coins = 100 + Math.min(streak * 10, 200);
    const xp = 50 + streak * 5;
    eco.dailyStreak = streak; eco.lastDaily = now;
    eco.coins += coins; eco.totalEarned += coins;
    await eco.save();
    await addXP(interaction.user.id, xp);
    const embed = new EmbedBuilder()
      .setTitle('DIEM DANH THANH CONG!')
      .setColor(0xffd700)
      .setDescription(`${interaction.user} da diem danh ngay hom nay!`)
      .addFields(
        { name: 'Coins nhan duoc', value: `🪙 ${coins} coins`, inline: true },
        { name: 'XP nhan duoc',   value: `⭐ ${xp} XP`, inline: true },
        { name: 'Streak',         value: `🔥 ${streak} ngay`, inline: true },
      )
      .setFooter({ text: 'Prime Sentinel • Check-in System' }).setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
};
