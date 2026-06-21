const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, User } = require('../../systems/database');
const { askGroq } = require('../../systems/ai');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('security2')
    .setDescription('Security 2.0 - Bao mat nang cao')
    .addSubcommand(s => s.setName('risk').setDescription('Kiem tra risk score thanh vien')
      .addUserOption(o => o.setName('user').setDescription('Thanh vien').setRequired(true)))
    .addSubcommand(s => s.setName('timeline').setDescription('Xem lich su bao mat server'))
    .addSubcommand(s => s.setName('scan').setDescription('Quet tat ca thanh vien rui ro')),

  async execute(interaction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();

    if (sub === 'risk') {
      const target = interaction.options.getUser('user');
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
      if (!member) return interaction.editReply({ content: 'Khong tim thay thanh vien!' });

      const userData = await getUser(target.id);
      const accountAge = Math.floor((Date.now() - target.createdTimestamp) / (1000 * 60 * 60 * 24));

      // Tinh risk score
      let risk = 0;
      if (accountAge < 7)   risk += 30;
      else if (accountAge < 30) risk += 15;
      if ((userData.warnings || 0) > 0) risk += userData.warnings * 15;
      if ((userData.messageCount || 0) < 5) risk += 20;
      if (member.roles.cache.size <= 1) risk += 10;
      risk = Math.min(risk, 100);

      // Luu risk score vao DB
      userData.riskScore = risk;
      await userData.save();

      const prompt = `Phan tich rui ro thanh vien Discord:
Ten: ${target.username} | Tuoi TK: ${accountAge} ngay | Canh cao: ${userData.warnings} | Tin nhan: ${userData.messageCount || 0} | Risk Score: ${risk}/100
Danh gia ngan gon bang tieng Viet khong dau (3-4 dong).`;
      const analysis = await askGroq(prompt);

      const color = risk <= 20 ? 0x00ff88 : risk <= 50 ? 0xffd700 : 0xff4444;
      const riskLabel = risk <= 20 ? '🟢 Thap' : risk <= 50 ? '🟡 Trung binh' : '🔴 Cao';

      const embed = new EmbedBuilder()
        .setTitle('🛡️ MEMBER RISK ANALYSIS')
        .setColor(color)
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: 'Thanh vien', value: target.toString(), inline: true },
          { name: 'Risk Score', value: `**${risk}/100**`, inline: true },
          { name: 'Muc do rui ro', value: riskLabel, inline: true },
          { name: 'Tuoi tai khoan', value: `${accountAge} ngay`, inline: true },
          { name: 'Canh cao', value: String(userData.warnings || 0), inline: true },
          { name: 'Tin nhan', value: String(userData.messageCount || 0), inline: true },
          { name: '🤖 AI Analysis', value: analysis, inline: false },
        )
        .setFooter({ text: 'Prime Sentinel Security 2.0' }).setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'timeline') {
      const logChannel = interaction.guild.channels.cache.find(c => c.name === 'security-log');
      const embed = new EmbedBuilder()
        .setTitle('🔒 SECURITY TIMELINE')
        .setColor(0x1a3a6e)
        .setDescription(logChannel
          ? `Su kien bao mat duoc ghi tai ${logChannel}\n\nXem channel do de theo doi lich su bao mat theo thoi gian thuc.`
          : 'Chua co channel security-log. Tao channel ten `security-log` de bot tu dong ghi su kien bao mat.')
        .addFields(
          { name: 'Tong canh bao', value: String(await User.countDocuments({ warnings: { $gt: 0 } })), inline: true },
          { name: 'Thanh vien rui ro cao', value: String(await User.countDocuments({ riskScore: { $gte: 70 } })), inline: true },
          { name: 'Tong thanh vien', value: String(interaction.guild.memberCount), inline: true },
        )
        .setFooter({ text: 'Prime Sentinel Security 2.0' }).setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'scan') {
      const members = await interaction.guild.members.fetch();
      let highRisk = 0, medRisk = 0;

      for (const [, member] of members) {
        if (member.user.bot) continue;
        const accountAge = Math.floor((Date.now() - member.user.createdTimestamp) / 86400000);
        const userData = await getUser(member.id);
        let risk = 0;
        if (accountAge < 7) risk += 30;
        else if (accountAge < 30) risk += 15;
        if ((userData.warnings || 0) > 0) risk += userData.warnings * 15;
        if ((userData.messageCount || 0) < 5) risk += 20;
        if (member.roles.cache.size <= 1) risk += 10;
        risk = Math.min(risk, 100);
        userData.riskScore = risk;
        await userData.save();
        if (risk >= 70) highRisk++;
        else if (risk >= 40) medRisk++;
      }

      const embed = new EmbedBuilder()
        .setTitle('🔍 SECURITY SCAN COMPLETE')
        .setColor(0x7c3aed)
        .addFields(
          { name: 'Tong da quet', value: String(members.size), inline: true },
          { name: '🔴 Rui ro cao', value: String(highRisk), inline: true },
          { name: '🟡 Rui ro TB', value: String(medRisk), inline: true },
        )
        .setDescription('Da cap nhat risk score cho tat ca thanh vien. Dung `/security2 risk @user` de xem chi tiet.')
        .setFooter({ text: 'Prime Sentinel Security 2.0' }).setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }
  }
};
