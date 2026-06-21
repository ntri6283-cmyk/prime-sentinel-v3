const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { askGroq, summarizeMember, suggestEvents, generateInsights, suggestRole } = require('../../systems/ai');
const { User } = require('../../systems/database');
const { Economy } = require('../../systems/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('AI Center - Prime Intelligence')
    .addSubcommand(s => s.setName('advisor').setDescription('Prime Advisor phan tich server'))
    .addSubcommand(s => s.setName('health').setDescription('Danh gia suc khoe cong dong'))
    .addSubcommand(s => s.setName('announce').setDescription('AI tao thong bao dep')
      .addStringOption(o => o.setName('topic').setDescription('Chu de thong bao').setRequired(true)))
    .addSubcommand(s => s.setName('ask').setDescription('Hoi Prime AI bat cu dieu gi')
      .addStringOption(o => o.setName('question').setDescription('Cau hoi cua ban').setRequired(true)))
    .addSubcommand(s => s.setName('insights').setDescription('Bao cao phan tich cong dong hom nay'))
    .addSubcommand(s => s.setName('member').setDescription('AI tom tat ho so thanh vien')
      .addUserOption(o => o.setName('user').setDescription('Thanh vien can xem').setRequired(false)))
    .addSubcommand(s => s.setName('events').setDescription('AI de xuat su kien phu hop hom nay'))
    .addSubcommand(s => s.setName('autorole').setDescription('AI goi y va cap role cho thanh vien')
      .addUserOption(o => o.setName('user').setDescription('Thanh vien').setRequired(true))),

  async execute(interaction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;

    if (sub === 'advisor') {
      const memberCount = guild.memberCount;
      const onlineCount = guild.members.cache.filter(m => m.presence?.status === 'online').size;
      const userCount = await User.countDocuments();
      const response = await askGroq(`Ban la Prime Advisor - AI quan tri cong dong Discord.
Server: ${guild.name} | Thanh vien: ${memberCount} | Online: ${onlineCount} | Co du lieu: ${userCount}
Phan tich va dua ra 3 de xuat cu the. Tieng Viet khong dau. Gioi han 250 tu.`);
      const embed = new EmbedBuilder().setTitle('🤖 PRIME ADVISOR').setColor(0x7c3aed)
        .setDescription(response)
        .addFields(
          { name: 'Thanh vien', value: String(memberCount), inline: true },
          { name: 'Online', value: String(onlineCount), inline: true },
          { name: 'Co du lieu', value: String(userCount), inline: true },
        )
        .setFooter({ text: 'Prime Sentinel AI • Powered by Groq' }).setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'health') {
      const memberCount = guild.memberCount;
      const userCount = await User.countDocuments();
      const topUser = await User.findOne().sort({ level: -1 });
      const totalCoins = await Economy.aggregate([{ $group: { _id: null, total: { $sum: '$coins' } } }]);
      const response = await askGroq(`Ban la Community Health AI.
Server: ${guild.name} | Thanh vien: ${memberCount} | Co du lieu: ${userCount} | Level cao nhat: ${topUser?.level || 0} | Tong coins: ${totalCoins[0]?.total || 0}
Tinh diem suc khoe 0-100 va giai thich. Tieng Viet khong dau. Gioi han 200 tu.`);
      const score = Math.max(40, Math.min(98, Math.floor(50 + (userCount / Math.max(memberCount, 1)) * 50)));
      const color = score >= 80 ? 0x00ff88 : score >= 60 ? 0xffd700 : 0xff4444;
      const embed = new EmbedBuilder().setTitle('💚 COMMUNITY HEALTH').setColor(color)
        .addFields(
          { name: 'Diem suc khoe', value: `**${score}/100**`, inline: true },
          { name: 'Trang thai', value: score >= 80 ? '🟢 Excellent' : score >= 60 ? '🟡 Good' : '🔴 Needs Attention', inline: true },
        )
        .setDescription(response)
        .setFooter({ text: 'Prime Sentinel AI • Powered by Groq' }).setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'announce') {
      const topic = interaction.options.getString('topic');
      const response = await askGroq(`Viet thong bao dep cho server Discord Prime Kingdom - gaming hoang gia.
Chu de: "${topic}"
Tieng Viet khong dau, 100-150 tu, co emoji phu hop. Chi tra noi dung thong bao.`);
      const embed = new EmbedBuilder().setTitle('📢 AI ANNOUNCEMENT').setColor(0x1d4ed8)
        .setDescription(response)
        .setFooter({ text: `Tao boi AI • ${interaction.user.username} • Prime Sentinel` }).setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'ask') {
      const question = interaction.options.getString('question');
      const response = await askGroq(`Ban la Prime AI - tro ly thong minh cua server Discord Prime Kingdom.
Tra loi ngan gon, than thien, chinh xac. Tieng Viet khong dau. Gioi han 200 tu.
Cau hoi: ${question}`);
      const embed = new EmbedBuilder().setTitle('🧠 PRIME AI').setColor(0x7c3aed)
        .addFields({ name: 'Cau hoi', value: question })
        .setDescription(response)
        .setFooter({ text: 'Prime Sentinel AI • Powered by Groq' }).setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'insights') {
      const memberCount = guild.memberCount;
      const onlineCount = guild.members.cache.filter(m => m.presence?.status === 'online').size;
      const userCount = await User.countDocuments();
      const topUsers = await User.find().sort({ messageCount: -1 }).limit(3);
      const totalCoins = await Economy.aggregate([{ $group: { _id: null, total: { $sum: '$coins' } } }]);
      const response = await generateInsights({
        newMembers: Math.floor(memberCount * 0.02),
        totalMessages: topUsers.reduce((a, u) => a + (u.messageCount || 0), 0),
        avgOnline: onlineCount
      });
      const topList = topUsers.length
        ? topUsers.map((u, i) => `${i + 1}. <@${u.userId}> — ${u.messageCount || 0} tin nhan`).join('\n')
        : 'Chua co du lieu';
      const embed = new EmbedBuilder().setTitle('📊 AI COMMUNITY INSIGHTS').setColor(0x1d4ed8)
        .setDescription(response)
        .addFields(
          { name: 'Thanh vien', value: String(memberCount), inline: true },
          { name: 'Online', value: String(onlineCount), inline: true },
          { name: 'Tong Coins', value: String(totalCoins[0]?.total || 0), inline: true },
          { name: 'Top Active', value: topList, inline: false },
        )
        .setFooter({ text: 'Prime Sentinel AI • Powered by Groq' }).setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'member') {
      const target = interaction.options.getUser('user') || interaction.user;
      const userData = await User.findOne({ userId: target.id });
      const ecoData = await Economy.findOne({ userId: target.id });
      if (!userData) return interaction.editReply({ content: `${target.username} chua co du lieu trong he thong!` });
      const memberInfo = guild.members.cache.get(target.id);
      const joinedAt = memberInfo?.joinedAt?.toLocaleDateString('vi-VN') || 'Khong ro';
      const summary = await summarizeMember({
        username: target.username, joinedAt,
        messageCount: userData.messageCount || 0,
        level: userData.level || 1,
        reputation: userData.reputation || 0,
        coins: ecoData?.coins || 0,
        achievements: userData.achievements?.length || 0
      });
      const embed = new EmbedBuilder().setTitle(`👤 AI MEMBER SUMMARY • ${target.username}`).setColor(0x7c3aed)
        .setThumbnail(target.displayAvatarURL())
        .setDescription(summary)
        .addFields(
          { name: 'Level', value: String(userData.level || 1), inline: true },
          { name: 'Tin nhan', value: String(userData.messageCount || 0), inline: true },
          { name: 'Reputation', value: String(userData.reputation || 0), inline: true },
          { name: 'Prime Coins', value: `🪙 ${ecoData?.coins || 0}`, inline: true },
          { name: 'Achievements', value: String(userData.achievements?.length || 0), inline: true },
          { name: 'Tham gia', value: joinedAt, inline: true },
        )
        .setFooter({ text: 'Prime Sentinel AI • Powered by Groq' }).setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'events') {
      const days = ['Chu Nhat', 'Thu Hai', 'Thu Ba', 'Thu Tu', 'Thu Nam', 'Thu Sau', 'Thu Bay'];
      const dayOfWeek = days[new Date().getDay()];
      const topUsers = await User.find().sort({ messageCount: -1 }).limit(3);
      const recentActivity = topUsers.map(u => u.messageCount || 0).join(', ') + ' tin nhan';
      const response = await suggestEvents(guild.memberCount, dayOfWeek, recentActivity);
      const embed = new EmbedBuilder().setTitle('🎯 AI EVENT PLANNER').setColor(0xffd700)
        .setDescription(response)
        .addFields(
          { name: 'Hom nay', value: dayOfWeek, inline: true },
          { name: 'Thanh vien', value: String(guild.memberCount), inline: true },
        )
        .setFooter({ text: 'Prime Sentinel AI • Powered by Groq' }).setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'autorole') {
      const target = interaction.options.getUser('user');
      const userData = await User.findOne({ userId: target.id });
      if (!userData) return interaction.editReply({ content: `${target.username} chua co du lieu!` });
      const result = await suggestRole(userData.messageCount || 0, userData.level || 1, 'general, chat');
      const embed = new EmbedBuilder().setTitle('🎭 AI SMART AUTO-ROLE').setColor(0x00ff88)
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: 'Thanh vien', value: target.toString(), inline: true },
          { name: 'Role de xuat', value: result.role, inline: true },
          { name: 'Do tin cay', value: `${result.confidence}%`, inline: true },
          { name: 'Ly do', value: result.reason, inline: false },
        )
        .setFooter({ text: 'Prime Sentinel AI • Powered by Groq' }).setTimestamp();
      const role = guild.roles.cache.find(r => r.name === result.role);
      if (role && result.confidence >= 70) {
        const member = guild.members.cache.get(target.id);
        if (member && !member.roles.cache.has(role.id)) {
          await member.roles.add(role).catch(() => {});
          embed.setDescription(`✅ Da tu dong cap role **${result.role}** cho ${target}!`);
        } else {
          embed.setDescription(`ℹ️ ${target} da co role **${result.role}** roi.`);
        }
      } else {
        embed.setDescription(`💡 De xuat role **${result.role}** (do tin cay chua du 70% de tu dong cap).`);
      }
      return interaction.editReply({ embeds: [embed] });
    }
  }
};
