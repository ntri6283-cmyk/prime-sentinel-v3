const {
  SlashCommandBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder
} = require('discord.js');

const helpData = {
  verify: {
    title: 'VERIFY SYSTEM - Xac Minh Tai Khoan',
    description:
      'He thong xac minh giup quan ly thanh vien moi vao server.\n\n' +
      '**Cach su dung:**\n' +
      'Vao kenh #verify va nhan nut "Verify Ngay" de xac minh tai khoan.\n\n' +
      '**Quyen loi:**\n' +
      'Sau khi verify, ban se nhan duoc role @Member va co the truy cap day du kenh trong server.',
    color: 0x00ff88
  },
  security: {
    title: 'SECURITY SYSTEM - He Thong Bao Mat',
    description:
      'He thong bao mat tu dong phat hien spam, raid va hanh vi dang ngo.\n\n' +
      '**Lenh:**\n' +
      '`/security status` - Xem trang thai bao mat\n' +
      '`/security check @user` - Kiem tra thong tin thanh vien\n\n' +
      '**Tinh nang:**\n' +
      'Anti-spam, Anti-raid, kiem tra tuoi tai khoan tu dong.',
    color: 0xff6600
  },
  mod: {
    title: 'MODERATION SYSTEM - He Thong Quan Tri',
    description:
      'He thong quan tri cho Staff xu ly vi pham.\n\n' +
      '**Lenh (chi Staff):**\n' +
      '`/mod warn @user [ly do]` - Canh cao\n' +
      '`/mod mute @user [thoi gian]` - Tat tieng\n' +
      '`/mod unmute @user` - Bo tat tieng\n' +
      '`/mod kick @user [ly do]` - Duoi\n' +
      '`/mod ban @user [ly do]` - Cam\n' +
      '`/mod unban [userid]` - Bo cam',
    color: 0xff0000
  },
  profile: {
    title: 'PROFILE SYSTEM - Ho So Thanh Vien',
    description:
      'Xem thong tin chi tiet ve thanh vien.\n\n' +
      '**Lenh:**\n' +
      '`/profile [@user]` - Xem ho so (khong nhap @user de xem ho so cua minh)\n\n' +
      '**Hien thi:**\n' +
      'Prime ID, ngay tham gia, level, XP, reputation, achievements, roles.',
    color: 0x1a3a6e
  },
  rep: {
    title: 'REPUTATION SYSTEM - He Thong Danh Tieng',
    description:
      'Danh gia thanh vien khac dua tren hanh vi cua ho.\n\n' +
      '**Lenh:**\n' +
      '`/rep give @user [loai]` - Danh gia (Helpful, Friendly, Trusted, Active)\n' +
      '`/rep check [@user]` - Xem danh tieng\n' +
      '`/rep top` - Bang xep hang\n\n' +
      '**Luu y:**\n' +
      'Moi nguoi chi danh gia 1 lan/24h cho cung 1 thanh vien.',
    color: 0xffd700
  },
  level: {
    title: 'LEVEL SYSTEM - He Thong Cap Do',
    description:
      'Tang level bang cach chat va tham gia voice.\n\n' +
      '**Lenh:**\n' +
      '`/level rank [@user]` - Xem level\n' +
      '`/level top` - Bang xep hang\n\n' +
      '**XP:**\n' +
      'Chat: 5-15 XP/tin nhan | Voice: 10 XP/phut\n\n' +
      '**Role tu dong:**\n' +
      'Level 5: Active Member | Level 15: Veteran | Level 30: Elite Member | Level 50: Prime Legend',
    color: 0x9b59b6
  },
  achievement: {
    title: 'ACHIEVEMENT SYSTEM - He Thong Thanh Tich',
    description:
      'Mo khoa huy hieu thanh tich bang hoat dong cua ban.\n\n' +
      '**Lenh:**\n' +
      '`/achievement list [@user]` - Xem thanh tich da mo khoa\n' +
      '`/achievement all` - Xem tat ca thanh tich\n' +
      '`/achievement top` - Bang xep hang\n\n' +
      '**8 thanh tich:** First Message, Chatty, Veteran Member, Community Helper, Prime Guardian, Prime Member, Trusted, Popular.',
    color: 0xffcc00
  },
  ticket: {
    title: 'TICKET SYSTEM - He Thong Ho Tro',
    description:
      'Lien he Staff thong qua kenh rieng tu.\n\n' +
      '**Cach su dung:**\n' +
      'Vao kenh #ticket va chon loai: Ho Tro, Bao Cao Vi Pham, Hop Tac, Lien He Staff, Gop Y.\n\n' +
      '**Lenh (trong kenh ticket):**\n' +
      '`/ticket close` - Dong ticket\n' +
      '`/ticket add @user` - Them nguoi vao ticket\n' +
      '`/ticket remove @user` - Xoa nguoi khoi ticket',
    color: 0x1a3a6e
  },
  event: {
    title: 'EVENT SYSTEM - He Thong Su Kien',
    description:
      'Tao va tham gia su kien cua server.\n\n' +
      '**Lenh:**\n' +
      '`/event create [ten] [mo ta] [thoi gian]` - Tao su kien\n' +
      '`/event list` - Xem danh sach su kien\n' +
      '`/event end [eventid]` - Ket thuc su kien\n\n' +
      '**Tham gia:**\n' +
      'Nhan nut "Tham Gia Ngay" tren thong bao su kien.',
    color: 0x00ff88
  },
  giveaway: {
    title: 'GIVEAWAY SYSTEM - He Thong Quay Thuong',
    description:
      'Tao va tham gia giveaway nhan thuong.\n\n' +
      '**Lenh (Staff):**\n' +
      '`/giveaway create [prize] [duration] [winners]` - Tao giveaway\n' +
      '`/giveaway end [id]` - Ket thuc som\n' +
      '`/giveaway reroll [id]` - Quay lai\n' +
      '`/giveaway list` - Xem danh sach\n\n' +
      '**Tham gia:**\n' +
      'Nhan nut "Tham Gia" tren thong bao giveaway.',
    color: 0xffd700
  },
  suggest: {
    title: 'SUGGESTION SYSTEM - He Thong Gop Y',
    description:
      'Gui gop y de cai thien server.\n\n' +
      '**Lenh:**\n' +
      '`/suggest add [noi dung]` - Gui gop y\n' +
      '`/suggest approve [messageid]` - Duyet (Staff)\n' +
      '`/suggest reject [messageid]` - Tu choi (Staff)\n\n' +
      '**Binh chon:**\n' +
      'Nhan 👍 hoac 👎 tren gop y de binh chon.',
    color: 0x1a3a6e
  },
  report: {
    title: 'REPORT SYSTEM - He Thong Bao Cao',
    description:
      'Bao cao vi pham den Staff.\n\n' +
      '**Lenh:**\n' +
      '`/report member @user [ly do]` - Bao cao thanh vien\n' +
      '`/report scam @user [ly do]` - Bao cao lua dao\n' +
      '`/report rule @user [ly do]` - Bao cao vi pham noi quy\n' +
      '`/report staff @user [ly do]` - Bao cao Staff\n\n' +
      '**Tuy chon:**\n' +
      'Co the an danh khi bao cao thanh vien.',
    color: 0xff0000
  },
  faq: {
    title: 'FAQ SYSTEM - Cau Hoi Thuong Gap',
    description:
      'Tim cau tra loi nhanh cho cac thac mac pho bien.\n\n' +
      '**Lenh:**\n' +
      '`/faq search [tu khoa]` - Tim kiem cau hoi\n' +
      '`/faq list` - Xem tat ca FAQ\n' +
      '`/faq add [cau hoi] [tra loi]` - Them FAQ (Staff)',
    color: 0x00ff88
  },
  recruit: {
    title: 'RECRUITMENT BOARD - Bang Tuyen Dung',
    description:
      'Dang tin tuyen thanh vien cho lien minh, doi nhom hoac du an.\n\n' +
      '**Lenh:**\n' +
      '`/recruit post [type] [ten] [mo ta]` - Dang tin tuyen\n' +
      '`/recruit close [messageid]` - Dong tin\n' +
      '`/recruit list` - Xem danh sach dang mo\n\n' +
      '**Ung tuyen:**\n' +
      'Nhan nut "Ung Tuyen Ngay" se tao kenh rieng de trao doi.',
    color: 0x9b59b6
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Xem huong dan su dung bot Prime Sentinel'),

  async execute(interaction) {
    const mainEmbed = new EmbedBuilder()
      .setTitle('PRIME SENTINEL - TRUNG TAM HUONG DAN')
      .setDescription(
        'Chao mung den voi **Prime Sentinel**!\n\n' +
        'Chon mot tinh nang ben duoi de xem huong dan chi tiet:\n\n' +
        '🛡️ Verify, Security, Moderation\n' +
        '👤 Profile, Reputation, Level, Achievement\n' +
        '🎫 Ticket, Event, Giveaway\n' +
        '💡 Suggestion, Report, FAQ, Recruitment'
      )
      .setColor(0x1a3a6e)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setFooter({ text: 'Prime Sentinel - Help System | Prime Kingdom' })
      .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_select')
      .setPlaceholder('Chon tinh nang de xem huong dan...')
      .addOptions(
        new StringSelectMenuOptionBuilder().setLabel('Verify System').setDescription('Xac minh tai khoan').setValue('verify').setEmoji('✅'),
        new StringSelectMenuOptionBuilder().setLabel('Security System').setDescription('He thong bao mat').setValue('security').setEmoji('🛡️'),
        new StringSelectMenuOptionBuilder().setLabel('Moderation System').setDescription('He thong quan tri').setValue('mod').setEmoji('⚖️'),
        new StringSelectMenuOptionBuilder().setLabel('Profile System').setDescription('Ho so thanh vien').setValue('profile').setEmoji('👤'),
        new StringSelectMenuOptionBuilder().setLabel('Reputation System').setDescription('He thong danh tieng').setValue('rep').setEmoji('⭐'),
        new StringSelectMenuOptionBuilder().setLabel('Level System').setDescription('He thong cap do').setValue('level').setEmoji('📊'),
        new StringSelectMenuOptionBuilder().setLabel('Achievement System').setDescription('He thong thanh tich').setValue('achievement').setEmoji('🏆'),
        new StringSelectMenuOptionBuilder().setLabel('Ticket System').setDescription('He thong ho tro').setValue('ticket').setEmoji('🎫'),
        new StringSelectMenuOptionBuilder().setLabel('Event System').setDescription('He thong su kien').setValue('event').setEmoji('📅'),
        new StringSelectMenuOptionBuilder().setLabel('Giveaway System').setDescription('He thong quay thuong').setValue('giveaway').setEmoji('🎉'),
        new StringSelectMenuOptionBuilder().setLabel('Suggestion System').setDescription('He thong gop y').setValue('suggest').setEmoji('💡'),
        new StringSelectMenuOptionBuilder().setLabel('Report System').setDescription('He thong bao cao').setValue('report').setEmoji('🚨'),
        new StringSelectMenuOptionBuilder().setLabel('FAQ System').setDescription('Cau hoi thuong gap').setValue('faq').setEmoji('❓'),
        new StringSelectMenuOptionBuilder().setLabel('Recruitment Board').setDescription('Bang tuyen dung').setValue('recruit').setEmoji('📌')
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({ embeds: [mainEmbed], components: [row], ephemeral: true });
  },

  helpData
};
