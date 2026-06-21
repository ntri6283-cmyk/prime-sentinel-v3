const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getMission, DAILY_MISSIONS, WEEKLY_MISSIONS } = require('../../systems/mission');
const { addCoins } = require('../../systems/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mission')
    .setDescription('Nhiem vu cong dong Prime')
    .addSubcommand(s => s.setName('daily').setDescription('Nhiem vu hang ngay'))
    .addSubcommand(s => s.setName('weekly').setDescription('Nhiem vu hang tuan'))
    .addSubcommand(s => s.setName('claim').setDescription('Nhan thuong nhiem vu')
      .addStringOption(o => o.setName('id').setDescription('ID nhiem vu').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const mp = await getMission(interaction.user.id);

    if (sub === 'daily') {
      const lines = DAILY_MISSIONS.map(m => {
        const cur = mp.daily[m.field] || 0;
        const done = cur >= m.target;
        const claimed = mp.daily.claimed.includes(m.id);
        const bar = '█'.repeat(Math.min(Math.floor(cur / m.target * 10), 10)) + '░'.repeat(Math.max(10 - Math.floor(cur / m.target * 10), 0));
        const status = claimed ? '✅ Da nhan' : done ? '🎁 San sang nhan' : `${cur}/${m.target}`;
        return `**${m.label}**\n┊ ${bar} ┊ ${status} ┊ 🪙 ${m.reward}\n┊ ID: \`${m.id}\``;
      }).join('\n\n');
      const embed = new EmbedBuilder().setTitle('DAILY MISSIONS').setColor(0x7c3aed)
        .setDescription(lines).setFooter({ text: '/mission claim <id> de nhan thuong • Reset luc 00:00' }).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'weekly') {
      const lines = WEEKLY_MISSIONS.map(m => {
        const cur = mp.weekly[m.field] || 0;
        const done = cur >= m.target;
        const claimed = mp.weekly.claimed.includes(m.id);
        const status = claimed ? '✅ Da nhan' : done ? '🎁 San sang nhan' : `${cur}/${m.target}`;
        return `**${m.label}**\n┊ ${status} ┊ 🪙 ${m.reward}\n┊ ID: \`${m.id}\``;
      }).join('\n\n');
      const embed = new EmbedBuilder().setTitle('WEEKLY MISSIONS').setColor(0x1d4ed8)
        .setDescription(lines).setFooter({ text: '/mission claim <id> de nhan thuong • Reset moi tuan' }).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'claim') {
      const id = interaction.options.getString('id');
      const daily = DAILY_MISSIONS.find(m => m.id === id);
      const weekly = WEEKLY_MISSIONS.find(m => m.id === id);
      const mission = daily || weekly;
      if (!mission) return interaction.reply({ content: 'ID nhiem vu khong hop le!', ephemeral: true });
      const isDaily = !!daily;
      const progress = isDaily ? mp.daily : mp.weekly;
      const cur = progress[mission.field] || 0;
      if (progress.claimed.includes(id)) return interaction.reply({ content: 'Da nhan thuong roi!', ephemeral: true });
      if (cur < mission.target) return interaction.reply({ content: `Chua xong! Tien do: **${cur}/${mission.target}**`, ephemeral: true });
      progress.claimed.push(id);
      await mp.save();
      await addCoins(interaction.user.id, mission.reward);
      const embed = new EmbedBuilder().setTitle('NHAN THUONG THANH CONG!')
        .setColor(0x00ff88)
        .setDescription(`${interaction.user} hoan thanh: **${mission.label}**`)
        .addFields({ name: 'Phan thuong', value: `🪙 ${mission.reward} coins`, inline: true })
        .setFooter({ text: 'Prime Sentinel • Mission System' }).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
  }
};
