const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getEconomy, addCoins, removeCoins, Economy } = require('../../systems/economy');

const SHOP = [
  { id: 'xp_boost',    name: 'XP Boost 2x (1h)',    price: 1000, desc: 'Tang gap doi XP trong 1 gio' },
  { id: 'role_color',  name: 'Custom Color Role',   price: 1500, desc: 'Role mau sac tuy chinh'      },
  { id: 'nickname_vip',name: 'Nickname VIP Effect',  price: 1800, desc: 'Hieu ung ten VIP dac biet'   },
  { id: 'lottery',     name: 'Lottery Ticket',       price: 500,  desc: 'Ve so may man x5 coins'      },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('economy')
    .setDescription('He thong kinh te Prime Coins')
    .addSubcommand(s => s.setName('balance').setDescription('Xem so du hien tai'))
    .addSubcommand(s => s.setName('daily').setDescription('Nhan phan thuong hang ngay'))
    .addSubcommand(s => s.setName('shop').setDescription('Xem cua hang Prime Shop'))
    .addSubcommand(s => s.setName('top').setDescription('Bang xep hang coin'))
    .addSubcommand(s =>
      s.setName('buy').setDescription('Mua vat pham trong shop')
        .addStringOption(o => o.setName('item').setDescription('Ten vat pham').setRequired(true)
          .addChoices(...SHOP.map(i => ({ name: i.name, value: i.id }))))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'balance') {
      const eco = await getEconomy(interaction.user.id);
      const embed = new EmbedBuilder()
        .setTitle(`SO DU • ${interaction.user.username}`)
        .setColor(0xffd700)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: 'So du hien tai', value: `🪙 ${eco.coins.toLocaleString()} coins`, inline: true },
          { name: 'Tong kiem duoc', value: `🪙 ${eco.totalEarned.toLocaleString()} coins`, inline: true },
          { name: 'Daily Streak',   value: `🔥 ${eco.dailyStreak} ngay`, inline: true },
        )
        .setFooter({ text: 'Prime Sentinel • Economy System' }).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'daily') {
      const eco = await getEconomy(interaction.user.id);
      const now = new Date(), oneDay = 86400000;
      const last = eco.lastDaily ? new Date(eco.lastDaily) : null;
      if (last && now - last < oneDay) {
        const hours = Math.ceil((oneDay - (now - last)) / 3600000);
        return interaction.reply({ content: `Chua den gio! Con **${hours} gio** nua.`, ephemeral: true });
      }
      const streak = last && now - last < 2 * oneDay ? eco.dailyStreak + 1 : 1;
      const bonus = Math.min(streak * 20, 300);
      const total = 200 + bonus;
      eco.dailyStreak = streak; eco.lastDaily = now;
      eco.coins += total; eco.totalEarned += total;
      await eco.save();
      const embed = new EmbedBuilder()
        .setTitle('DAILY REWARD!')
        .setColor(0xffd700)
        .setDescription(`${interaction.user} da nhan thuong hang ngay!`)
        .addFields(
          { name: 'Co ban', value: `🪙 200 coins`, inline: true },
          { name: 'Streak Bonus', value: `🪙 +${bonus} coins`, inline: true },
          { name: 'Tong nhan', value: `🪙 ${total} coins`, inline: true },
          { name: 'Streak', value: `🔥 ${streak} ngay lien tiep`, inline: true },
          { name: 'So du moi', value: `🪙 ${eco.coins.toLocaleString()} coins`, inline: true },
        )
        .setFooter({ text: 'Prime Sentinel • Economy System' }).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'shop') {
      const list = SHOP.map(i => `**${i.name}** — 🪙 ${i.price}\n┊ \`${i.id}\` • ${i.desc}`).join('\n\n');
      const embed = new EmbedBuilder()
        .setTitle('PRIME SHOP')
        .setColor(0x7c3aed)
        .setDescription(list)
        .setFooter({ text: '/economy buy <id> de mua • Prime Sentinel' }).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'buy') {
      const id = interaction.options.getString('item');
      const item = SHOP.find(i => i.id === id);
      if (!item) return interaction.reply({ content: 'Vat pham khong ton tai!', ephemeral: true });
      const eco = await getEconomy(interaction.user.id);
      if (eco.coins < item.price) return interaction.reply({ content: `Khong du coins! Can ${item.price}, ban co ${eco.coins}.`, ephemeral: true });
      if (eco.inventory.includes(id)) return interaction.reply({ content: 'Ban da so huu vat pham nay roi!', ephemeral: true });

      // Lottery: nhan ngay 5x gia
      if (id === 'lottery') {
        const prize = item.price * 5;
        eco.coins += prize; eco.totalEarned += prize;
        await eco.save();
        const embed = new EmbedBuilder()
          .setTitle('LOTTERY JACKPOT!')
          .setColor(0xffd700)
          .setDescription(`${interaction.user} da trung so may man!\n🎰 **+${prize} coins**!`)
          .setFooter({ text: 'Prime Sentinel • Prime Shop' }).setTimestamp();
        return interaction.reply({ embeds: [embed] });
      }

      eco.coins -= item.price;
      eco.inventory.push(id);
      await eco.save();
      const embed = new EmbedBuilder()
        .setTitle('MUA THANH CONG!')
        .setColor(0x00ff88)
        .addFields(
          { name: 'Vat pham', value: item.name, inline: true },
          { name: 'Gia', value: `🪙 ${item.price}`, inline: true },
          { name: 'Con lai', value: `🪙 ${eco.coins.toLocaleString()}`, inline: true },
        )
        .setFooter({ text: 'Prime Sentinel • Prime Shop' }).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'top') {
      const top = await Economy.find().sort({ coins: -1 }).limit(10);
      if (!top.length) return interaction.reply({ content: 'Chua co du lieu!', ephemeral: true });
      const medals = ['🥇','🥈','🥉','4.','5.','6.','7.','8.','9.','10.'];
      const list = top.map((u, i) => `${medals[i]} <@${u.userId}> — 🪙 **${u.coins.toLocaleString()}** coins`).join('\n');
      const embed = new EmbedBuilder()
        .setTitle('TOP COIN LEADERBOARD')
        .setColor(0xffd700).setDescription(list)
        .setFooter({ text: 'Prime Sentinel • Economy System' }).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
  }
};
