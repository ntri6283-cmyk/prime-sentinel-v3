const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [
  { name: 'verify-setup', description: 'Gui panel xac minh vao kenh nay (chi Admin)' },
  { name: 'serverstats', description: 'Xem thong ke chi tiet ve server' },
  { name: 'help', description: 'Xem huong dan su dung bot Prime Sentinel' },
  { name: 'checkin', description: 'Diem danh hang ngay nhan phan thuong' },
  { name: 'security', description: 'Quan ly he thong bao mat', options: [
    { name: 'status', description: 'Xem trang thai bao mat', type: 1 },
    { name: 'check', description: 'Kiem tra thanh vien', type: 1, options: [{ name: 'user', type: 6, required: true, description: 'Thanh vien' }] }
  ]},
  { name: 'mod', description: 'He thong quan tri', options: [
    { name: 'warn', description: 'Canh cao', type: 1, options: [{ name: 'user', type: 6, required: true, description: 'Thanh vien' }, { name: 'reason', type: 3, required: true, description: 'Ly do' }] },
    { name: 'mute', description: 'Tat tieng', type: 1, options: [{ name: 'user', type: 6, required: true, description: 'Thanh vien' }, { name: 'reason', type: 3, required: false, description: 'Ly do' }, { name: 'duration', type: 4, required: false, description: 'Thoi gian phut' }] },
    { name: 'unmute', description: 'Bo tat tieng', type: 1, options: [{ name: 'user', type: 6, required: true, description: 'Thanh vien' }] },
    { name: 'kick', description: 'Duoi thanh vien', type: 1, options: [{ name: 'user', type: 6, required: true, description: 'Thanh vien' }, { name: 'reason', type: 3, required: false, description: 'Ly do' }] },
    { name: 'ban', description: 'Cam thanh vien', type: 1, options: [{ name: 'user', type: 6, required: true, description: 'Thanh vien' }, { name: 'reason', type: 3, required: false, description: 'Ly do' }] },
    { name: 'unban', description: 'Bo cam', type: 1, options: [{ name: 'userid', type: 3, required: true, description: 'ID thanh vien' }] }
  ]},
  { name: 'profile', description: 'Xem ho so thanh vien', options: [{ name: 'user', type: 6, required: false, description: 'Thanh vien' }] },
  { name: 'rep', description: 'He thong danh tieng', options: [
    { name: 'give', description: 'Danh gia thanh vien', type: 1, options: [{ name: 'user', type: 6, required: true, description: 'Thanh vien' }, { name: 'type', type: 3, required: true, description: 'Loai', choices: [{ name: 'Helpful', value: 'helpful' }, { name: 'Friendly', value: 'friendly' }, { name: 'Trusted', value: 'trusted' }, { name: 'Active', value: 'active' }] }] },
    { name: 'check', description: 'Xem danh tieng', type: 1, options: [{ name: 'user', type: 6, required: false, description: 'Thanh vien' }] },
    { name: 'top', description: 'Bang xep hang danh tieng', type: 1 }
  ]},
  { name: 'level', description: 'He thong level', options: [
    { name: 'rank', description: 'Xem level', type: 1, options: [{ name: 'user', type: 6, required: false, description: 'Thanh vien' }] },
    { name: 'top', description: 'Bang xep hang level', type: 1 }
  ]},
  { name: 'achievement', description: 'He thong thanh tich', options: [
    { name: 'list', description: 'Xem achievement', type: 1, options: [{ name: 'user', type: 6, required: false, description: 'Thanh vien' }] },
    { name: 'all', description: 'Xem tat ca achievement', type: 1 },
    { name: 'top', description: 'Bang xep hang achievement', type: 1 }
  ]},
  { name: 'ticket', description: 'He thong ticket', options: [
    { name: 'setup', description: 'Tao panel ticket', type: 1 },
    { name: 'close', description: 'Dong ticket', type: 1 },
    { name: 'add', description: 'Them thanh vien', type: 1, options: [{ name: 'user', type: 6, required: true, description: 'Thanh vien' }] },
    { name: 'remove', description: 'Xoa thanh vien', type: 1, options: [{ name: 'user', type: 6, required: true, description: 'Thanh vien' }] }
  ]},
  { name: 'event', description: 'He thong su kien', options: [
    { name: 'create', description: 'Tao su kien', type: 1, options: [{ name: 'name', type: 3, required: true, description: 'Ten' }, { name: 'description', type: 3, required: true, description: 'Mo ta' }, { name: 'time', type: 3, required: true, description: 'Thoi gian' }, { name: 'maxplayers', type: 4, required: false, description: 'So nguoi' }, { name: 'location', type: 3, required: false, description: 'Dia diem' }] },
    { name: 'list', description: 'Danh sach su kien', type: 1 },
    { name: 'end', description: 'Ket thuc su kien', type: 1, options: [{ name: 'eventid', type: 3, required: true, description: 'ID su kien' }] }
  ]},
  { name: 'giveaway', description: 'He thong giveaway', options: [
    { name: 'create', description: 'Tao giveaway', type: 1, options: [{ name: 'prize', type: 3, required: true, description: 'Phan thuong' }, { name: 'duration', type: 4, required: true, description: 'Thoi gian phut' }, { name: 'winners', type: 4, required: false, description: 'So nguoi thang' }, { name: 'minlevel', type: 4, required: false, description: 'Level toi thieu' }] },
    { name: 'end', description: 'Ket thuc som', type: 1, options: [{ name: 'giveawayid', type: 3, required: true, description: 'ID' }] },
    { name: 'reroll', description: 'Quay lai', type: 1, options: [{ name: 'giveawayid', type: 3, required: true, description: 'ID' }] },
    { name: 'list', description: 'Danh sach giveaway', type: 1 }
  ]},
  { name: 'suggest', description: 'He thong gop y', options: [
    { name: 'add', description: 'Gui gop y', type: 1, options: [{ name: 'content', type: 3, required: true, description: 'Noi dung' }] },
    { name: 'approve', description: 'Duyet gop y', type: 1, options: [{ name: 'messageid', type: 3, required: true, description: 'ID' }, { name: 'reason', type: 3, required: false, description: 'Ly do' }] },
    { name: 'reject', description: 'Tu choi gop y', type: 1, options: [{ name: 'messageid', type: 3, required: true, description: 'ID' }, { name: 'reason', type: 3, required: false, description: 'Ly do' }] }
  ]},
  { name: 'report', description: 'He thong bao cao', options: [
    { name: 'member', description: 'Bao cao thanh vien', type: 1, options: [{ name: 'user', type: 6, required: true, description: 'Thanh vien' }, { name: 'reason', type: 3, required: true, description: 'Ly do' }, { name: 'evidence', type: 3, required: false, description: 'Bang chung' }, { name: 'anonymous', type: 5, required: false, description: 'An danh?' }] },
    { name: 'scam', description: 'Bao cao lua dao', type: 1, options: [{ name: 'user', type: 6, required: true, description: 'Thanh vien' }, { name: 'reason', type: 3, required: true, description: 'Mo ta' }, { name: 'evidence', type: 3, required: false, description: 'Bang chung' }] },
    { name: 'rule', description: 'Bao cao vi pham', type: 1, options: [{ name: 'user', type: 6, required: true, description: 'Thanh vien' }, { name: 'reason', type: 3, required: true, description: 'Noi quy vi pham' }, { name: 'evidence', type: 3, required: false, description: 'Bang chung' }] },
    { name: 'staff', description: 'Bao cao Staff', type: 1, options: [{ name: 'user', type: 6, required: true, description: 'Staff' }, { name: 'reason', type: 3, required: true, description: 'Ly do' }, { name: 'evidence', type: 3, required: false, description: 'Bang chung' }] }
  ]},
  { name: 'faq', description: 'Cau hoi thuong gap', options: [
    { name: 'search', description: 'Tim kiem FAQ', type: 1, options: [{ name: 'keyword', type: 3, required: true, description: 'Tu khoa' }] },
    { name: 'list', description: 'Xem tat ca FAQ', type: 1 },
    { name: 'add', description: 'Them FAQ', type: 1, options: [{ name: 'question', type: 3, required: true, description: 'Cau hoi' }, { name: 'answer', type: 3, required: true, description: 'Tra loi' }, { name: 'category', type: 3, required: false, description: 'Danh muc' }] }
  ]},
  { name: 'recruit', description: 'He thong tuyen thanh vien', options: [
    { name: 'post', description: 'Dang tin tuyen', type: 1, options: [{ name: 'type', type: 3, required: true, description: 'Loai', choices: [{ name: 'Alliance', value: 'alliance' }, { name: 'Team', value: 'team' }, { name: 'Project', value: 'project' }] }, { name: 'name', type: 3, required: true, description: 'Ten' }, { name: 'description', type: 3, required: true, description: 'Mo ta' }, { name: 'requirements', type: 3, required: false, description: 'Yeu cau' }, { name: 'deadline', type: 3, required: false, description: 'Han dang ky' }, { name: 'slots', type: 4, required: false, description: 'So vi tri' }] },
    { name: 'close', description: 'Dong tin tuyen', type: 1, options: [{ name: 'messageid', type: 3, required: true, description: 'ID' }] },
    { name: 'list', description: 'Danh sach tin tuyen', type: 1 }
  ]},
  { name: 'poll', description: 'He thong binh chon', options: [
    { name: 'create', description: 'Tao binh chon', type: 1, options: [{ name: 'question', type: 3, required: true, description: 'Cau hoi' }, { name: 'options', type: 3, required: true, description: 'Lua chon cach nhau boi |' }, { name: 'duration', type: 4, required: false, description: 'Thoi gian phut' }] },
    { name: 'end', description: 'Ket thuc binh chon', type: 1, options: [{ name: 'pollid', type: 3, required: true, description: 'ID' }] },
    { name: 'quick', description: 'Binh chon Co/Khong nhanh', type: 1, options: [{ name: 'question', type: 3, required: true, description: 'Cau hoi' }] }
  ]},
  { name: 'economy', description: 'He thong kinh te Prime Coins', options: [
    { name: 'balance', description: 'Xem so du', type: 1 },
    { name: 'daily', description: 'Nhan thuong hang ngay', type: 1 },
    { name: 'shop', description: 'Xem cua hang', type: 1 },
    { name: 'top', description: 'Bang xep hang coin', type: 1 },
    { name: 'buy', description: 'Mua vat pham', type: 1, options: [{ name: 'item', type: 3, required: true, description: 'Vat pham', choices: [{ name: 'XP Boost 2x', value: 'xp_boost' }, { name: 'Custom Color Role', value: 'role_color' }, { name: 'Nickname VIP', value: 'nickname_vip' }, { name: 'Lottery Ticket', value: 'lottery' }] }] }
  ]},
  { name: 'mission', description: 'Nhiem vu cong dong Prime', options: [
    { name: 'daily', description: 'Nhiem vu hang ngay', type: 1 },
    { name: 'weekly', description: 'Nhiem vu hang tuan', type: 1 },
    { name: 'claim', description: 'Nhan thuong nhiem vu', type: 1, options: [{ name: 'id', type: 3, required: true, description: 'ID nhiem vu (msg20/voice30/react10...)' }] }
  ]},

  { name: 'journey', description: 'Xem hanh trinh thanh vien', options: [
    { name: 'view', description: 'Xem hanh trinh', type: 1, options: [{ name: 'user', type: 6, required: false, description: 'Thanh vien' }] },
    { name: 'update', description: 'Cap nhat hanh trinh cua ban', type: 1 }
  ]},
  { name: 'security2', description: 'Security 2.0 - Bao mat nang cao', options: [
    { name: 'risk', description: 'Kiem tra risk score', type: 1, options: [{ name: 'user', type: 6, required: true, description: 'Thanh vien' }] },
    { name: 'timeline', description: 'Lich su bao mat', type: 1 },
    { name: 'scan', description: 'Quet tat ca thanh vien', type: 1 }
  ]},
  { name: 'primeid', description: 'He thong Prime ID', options: [
    { name: 'view', description: 'Xem Prime ID', type: 1, options: [{ name: 'user', type: 6, required: false, description: 'Thanh vien' }] },
    { name: 'link', description: 'Xem cac server da lien ket', type: 1 }
  ]},
  { name: 'module', description: 'Quan ly module bot (Admin)', options: [
    { name: 'list', description: 'Danh sach module', type: 1 },
    { name: 'toggle', description: 'Bat/tat module', type: 1, options: [
      { name: 'name', type: 3, required: true, description: 'Ten module', choices: [
        { name: 'Economy System', value: 'economy' },
        { name: 'Mission System', value: 'missions' },
        { name: 'AI Center', value: 'aiCenter' },
        { name: 'Recruitment', value: 'recruitment' },
        { name: 'Voice System', value: 'voiceSystem' },
        { name: 'Security 2.0', value: 'security2' },
        { name: 'Level System', value: 'levelSystem' },
        { name: 'Ticket System', value: 'ticketSystem' }
      ]},
      { name: 'enabled', type: 5, required: true, description: 'Bat (true) hoac tat (false)' }
    ]}
  ]},
  { name: 'ai', description: 'AI Center - Prime Intelligence', options: [
    { name: 'advisor', description: 'Prime Advisor phan tich server', type: 1 },
    { name: 'health', description: 'Danh gia suc khoe cong dong', type: 1 },
    { name: 'announce', description: 'AI tao thong bao dep', type: 1, options: [{ name: 'topic', type: 3, required: true, description: 'Chu de thong bao' }] },
    { name: 'ask', description: 'Hoi Prime AI bat cu dieu gi', type: 1, options: [{ name: 'question', type: 3, required: true, description: 'Cau hoi' }] },
    { name: 'insights', description: 'Bao cao phan tich cong dong', type: 1 },
    { name: 'member', description: 'AI tom tat ho so thanh vien', type: 1, options: [{ name: 'user', type: 6, required: false, description: 'Thanh vien' }] },
    { name: 'events', description: 'AI de xuat su kien hom nay', type: 1 },
    { name: 'autorole', description: 'AI goi y va cap role', type: 1, options: [{ name: 'user', type: 6, required: true, description: 'Thanh vien' }] }
  ]}
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Dang dang ky lenh...');
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
    console.log('Dang ky lenh thanh cong!');
  } catch (error) {
    console.error('Loi:', error);
  }
})();

// Append new commands - se duoc merge vao mang commands chinh
