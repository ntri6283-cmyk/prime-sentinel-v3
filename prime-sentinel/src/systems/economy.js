const mongoose = require('mongoose');

const economySchema = new mongoose.Schema({
  userId:      { type: String, required: true, unique: true },
  coins:       { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  lastDaily:   { type: Date, default: null },
  dailyStreak: { type: Number, default: 0 },
  inventory:   { type: [String], default: [] },
});

const Economy = mongoose.models.Economy || mongoose.model('Economy', economySchema);

async function getEconomy(userId) {
  let eco = await Economy.findOne({ userId });
  if (!eco) eco = await Economy.create({ userId });
  return eco;
}

async function addCoins(userId, amount) {
  const eco = await getEconomy(userId);
  eco.coins += amount;
  eco.totalEarned += amount;
  await eco.save();
  return eco;
}

async function removeCoins(userId, amount) {
  const eco = await getEconomy(userId);
  if (eco.coins < amount) return null;
  eco.coins -= amount;
  await eco.save();
  return eco;
}

module.exports = { getEconomy, addCoins, removeCoins, Economy };
