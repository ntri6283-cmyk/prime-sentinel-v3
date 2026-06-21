const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  date:   { type: String, default: '' },
  daily: {
    messages:  { type: Number, default: 0 },
    voiceMin:  { type: Number, default: 0 },
    reactions: { type: Number, default: 0 },
    claimed:   { type: [String], default: [] },
  },
  weekly: {
    week:    { type: String, default: '' },
    helped:  { type: Number, default: 0 },
    posts:   { type: Number, default: 0 },
    claimed: { type: [String], default: [] },
  },
});

const Mission = mongoose.models.Mission || mongoose.model('Mission', missionSchema);

const DAILY_MISSIONS = [
  { id: 'msg20',   label: 'Gui 20 tin nhan',   field: 'messages',  target: 20, reward: 250 },
  { id: 'voice30', label: 'Vao voice 30 phut',  field: 'voiceMin',  target: 30, reward: 250 },
  { id: 'react10', label: 'React 10 tin nhan',  field: 'reactions', target: 10, reward: 150 },
];

const WEEKLY_MISSIONS = [
  { id: 'help3', label: 'Giup 3 thanh vien moi', field: 'helped', target: 3, reward: 500 },
  { id: 'post2', label: 'Tao 2 bai post',        field: 'posts',  target: 2, reward: 400 },
];

function todayStr() { return new Date().toISOString().slice(0, 10); }
function weekStr() {
  const d = new Date(), jan1 = new Date(d.getFullYear(), 0, 1);
  return `${d.getFullYear()}-W${Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)}`;
}

async function getMission(userId) {
  let mp = await Mission.findOne({ userId });
  if (!mp) mp = await Mission.create({ userId });
  const today = todayStr();
  if (mp.date !== today) {
    mp.date = today;
    mp.daily = { messages: 0, voiceMin: 0, reactions: 0, claimed: [] };
    await mp.save();
  }
  const week = weekStr();
  if (mp.weekly.week !== week) {
    mp.weekly = { week, helped: 0, posts: 0, claimed: [] };
    await mp.save();
  }
  return mp;
}

async function incrementMission(userId, field, amount = 1) {
  const mp = await getMission(userId);
  if (field in mp.daily) mp.daily[field] = (mp.daily[field] || 0) + amount;
  else if (field in mp.weekly) mp.weekly[field] = (mp.weekly[field] || 0) + amount;
  await mp.save();
  return mp;
}

module.exports = { getMission, incrementMission, DAILY_MISSIONS, WEEKLY_MISSIONS };
