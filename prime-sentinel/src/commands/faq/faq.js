const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');

const faqList = [
  {
    id: 1,
    question: 'Lam sao de verify tai khoan?',
    answer: 'Vao kenh #verify va nhan nut "Verify Ngay" de xac minh tai khoan.',
    category: 'verify',
    tags: ['verify', 'xac minh', 'member']
  },
  {
    id: 2,
    question: 'Lam sao de len level?',
    answer: 'Chat trong server de nhan XP. Moi tin nhan nhan 5-15 XP ngau nhien. Len level tu dong khi dat du XP!',
    category: 'level',
    tags: ['level', 'xp', 'tang cap']
  },
  {
    id: 3,
    question: 'Lam sao de mo ticket ho tro?',
    answer: 'Vao kenh #ticket va chon loai ticket phu hop. Bot se tu dong tao kenh rieng cho ban.',
    category: 'ticket',
    tags: ['ticket', 'ho tro', 'support']
  },
  {
    id: 4,
    question: 'Role Member duoc nhan nhu the nao?',
    answer: 'Sau khi verify tai khoan thanh cong, ban se tu dong nhan role @Member.',
    category: 'role',
    tags: ['role', 'member', 'verify']
  },
  {
    id: 5,
    question: 'Lam sao de tham gia event?',
    answer: 'Xem thong bao tai kenh #events va nhan nut "Tham Gia Ngay" de dang ky.',
    category: 'event',
    tags: ['event', 'su kien', 'tham gia']
  },
  {
    id: 6,
    question: 'Lam sao de bao cao thanh vien vi pham?',
    answer: 'Dung lenh /report member @user [ly do] de bao cao. Staff se xu ly som nhat.',
    category: 'report',
    tags: ['report', 'bao cao', 'vi pham']
  },
  {
    id: 7,
    question: 'Bot Prime Sentinel co nhung chuc nang gi?',
    answer: 'Prime Sentinel co: Verify, Security, Moderation, Level, Profile, Reputation, Achievement, Ticket, Event, Giveaway, Report va nhieu hon nua!',
    category: 'bot',
    tags: ['bot', 'chuc nang', 'prime sentinel']
  },
  {
    id: 8,
    question: 'Lam sao de danh gia thanh vien?',
    answer: 'Dung lenh /rep give @user [loai] de danh gia. Co 4 loai: Helpful, Friendly, Trusted, Active.',
    category: 'reputation',
    tags: ['rep', 'danh gia', 'reputation']
  },
  {
    id: 9,
    question: 'Achievement la gi va lam sao de mo khoa?',
    answer: 'Achievement la huy hieu thanh tich. Mo khoa bang cach: chat nhieu, len level cao, nhan nhieu danh gia.',
    category: 'achievement',
    tags: ['achievement', 'huy hieu', 'thanh tich']
  },
  {
    id: 10,
    question: 'Lam sao de tham gia Giveaway?',
    answer: 'Khi co giveaway, nhan nut "Tham Gia" tren thong bao. Bot se tu dong quay so nguoi thang.',
    category: 'giveaway',
    tags: ['giveaway', 'quay thuong', 'tham gia']
  }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('faq')
    .setDescription('He thong cau hoi thuong gap')
    .addSubcommand(sub =>
      sub.setName('search')
        .setDescription('Tim kiem cau hoi thuong gap')
        .addStringOption(opt =>
          opt.setName('keyword')
            .setDescription('Tu khoa tim kiem')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Xem tat ca cau hoi thuong gap')
    )
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Them cau hoi moi (chi Staff)')
        .addStringOption(opt =>
          opt.setName('question')
            .setDescription('Cau hoi')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('answer')
            .setDescription('Cau tra loi')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('category')
            .setDescription('Danh muc')
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── SEARCH ──
    if (sub === 'search') {
      const keyword = interaction.options.getString('keyword').toLowerCase();

      const results = faqList.filter(faq =>
        faq.question.toLowerCase().includes(keyword) ||
        faq.answer.toLowerCase().includes(keyword) ||
        faq.tags.some(tag => tag.includes(keyword)) ||
        faq.category.includes(keyword)
      );

      if (results.length === 0) {
        return interaction.reply({
          content: 'Khong tim thay FAQ voi tu khoa "' + keyword + '"!\nThu /faq list de xem tat ca hoac lien he Staff.',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('KET QUA FAQ: "' + keyword + '"')
        .setColor(0x1a3a6e)
        .setFooter({ text: 'Prime Sentinel - FAQ System | Tim thay ' + results.length + ' ket qua' })
        .setTimestamp();

      results.slice(0, 5).forEach(faq => {
        embed.addFields({
          name: faq.id + '. ' + faq.question,
          value: faq.answer,
          inline: false
        });
      });

      if (results.length > 5) {
        embed.addFields({
          name: 'Va con ' + (results.length - 5) + ' ket qua khac...',
          value: 'Hay thu tu khoa cu the hon!',
          inline: false
        });
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── LIST ──
    if (sub === 'list') {
      const categories = [...new Set(faqList.map(f => f.category))];

      const embed = new EmbedBuilder()
        .setTitle('DANH SACH FAQ - CAU HOI THUONG GAP')
        .setDescription('Dung /faq search [tu khoa] de tim kiem nhanh hon!')
        .setColor(0x1a3a6e)
        .setFooter({ text: 'Prime Sentinel - FAQ System | Tong: ' + faqList.length + ' cau hoi' })
        .setTimestamp();

      categories.forEach(category => {
        const items = faqList.filter(f => f.category === category);
        const value = items.map(f => f.id + '. ' + f.question).join('\n');
        embed.addFields({
          name: category.toUpperCase(),
          value: value,
          inline: false
        });
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── ADD ──
    if (sub === 'add') {
      // Kiem tra quyen Staff
      const staffRole = interaction.guild.roles.cache.find(r => r.name === 'Staff');
      const isStaff = staffRole
        ? interaction.member.roles.cache.has(staffRole.id)
        : interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);

      if (!isStaff) {
        return interaction.reply({
          content: 'Chi Staff moi co the them FAQ!',
          ephemeral: true
        });
      }

      const question = interaction.options.getString('question');
      const answer = interaction.options.getString('answer');
      const category = interaction.options.getString('category') || 'general';

      const newId = faqList.length + 1;
      faqList.push({
        id: newId,
        question,
        answer,
        category,
        tags: [category]
      });

      const embed = new EmbedBuilder()
        .setTitle('DA THEM FAQ MOI!')
        .setColor(0x00ff88)
        .addFields(
          { name: 'ID', value: String(newId), inline: true },
          { name: 'Danh muc', value: category, inline: true },
          { name: 'Cau hoi', value: question, inline: false },
          { name: 'Tra loi', value: answer, inline: false }
        )
        .setFooter({ text: 'Prime Sentinel - FAQ System' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};