const mongoose = require('mongoose');

const journeySchema = new mongoose.Schema({
  event: String,
  date: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  userId:       { type: String, required: true, unique: true },
  xp:           { type: Number, default: 0 },
  level:        { type: Number, default: 1 },
  reputation:   { type: Number, default: 0 },
  warnings:     { type: Number, default: 0 },
  messageCount: { type: Number, default: 0 },
  voiceMinutes: { type: Number, default: 0 },
  eventsJoined: { type: Number, default: 0 },
  dailyStreak:  { type: Number, default: 0 },
  badges:       { type: [String], default: [] },
  achievements: { type: [String], default: [] },
  journey:      { type: [journeySchema], default: [] },
  riskScore:    { type: Number, default: 0 },
  joinedAt:     { type: Date, default: Date.now },
  primeId:      { type: String },
  coins:        { type: Number, default: 0 },
  repDetails: {
    helpful:  { type: Number, default: 0 },
    friendly: { type: Number, default: 0 },
    trusted:  { type: Number, default: 0 },
    active:   { type: Number, default: 0 },
  },
  lastRep: { type: Map, of: Number, default: {} },
  moduleSettings: {
    notifications: { type: Boolean, default: true },
    levelUpMsg:    { type: Boolean, default: true },
  }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

function generatePrimeId() {
  return `PK-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;
}

async function getUser(userId) {
  let user = await User.findOne({ userId });
  if (!user) user = await User.create({ userId, primeId: generatePrimeId() });
  return user;
}

async function saveUser(userId, data) {
  await User.findOneAndUpdate({ userId }, data, { upsert: true, new: true });
}

async function addXP(userId, amount) {
  const user = await getUser(userId);
  user.xp += amount;
  const xpNeeded = user.level * 500;
  let leveledUp = false;
  if (user.xp >= xpNeeded) {
    user.xp -= xpNeeded;
    user.level += 1;
    leveledUp = true;
  }
  await user.save();
  return { user, leveledUp };
}

async function addJourney(userId, event) {
  const user = await getUser(userId);
  if (!user.journey) user.journey = [];
  user.journey.push({ event, date: new Date() });
  await user.save();
}

module.exports = { getUser, saveUser, addXP, addJourney, User };
