const { addXP, getUser, addJourney } = require('../systems/database');
const { addCoins, getEconomy } = require('../systems/economy');
const { incrementMission } = require('../systems/mission');

const voiceTimers = new Map();
const voiceJoinTime = new Map();

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const userId = newState.member?.id || oldState.member?.id;
    if (!userId || (newState.member || oldState.member)?.user.bot) return;

    // Vao voice
    if (!oldState.channelId && newState.channelId) {
      voiceJoinTime.set(userId, Date.now());
      const timer = setInterval(async () => {
        if (!newState.channelId) { clearInterval(timer); voiceTimers.delete(userId); return; }
        await addXP(userId, 10);
        await addCoins(userId, 5);
        await incrementMission(userId, 'voiceMin');
        // Luu voice minutes vao DB
        const userData = await getUser(userId);
        userData.voiceMinutes = (userData.voiceMinutes || 0) + 1;
        await userData.save();
      }, 60 * 1000);
      voiceTimers.set(userId, timer);
    }

    // Ra khoi voice
    if (oldState.channelId && !newState.channelId) {
      const timer = voiceTimers.get(userId);
      if (timer) { clearInterval(timer); voiceTimers.delete(userId); }

      // Kiem tra first voice journey
      const joinTime = voiceJoinTime.get(userId);
      if (joinTime) {
        const minutesSpent = Math.floor((Date.now() - joinTime) / 60000);
        voiceJoinTime.delete(userId);

        // Neu lan dau dat 30 phut voice, them vao journey
        if (minutesSpent >= 30) {
          const userData = await getUser(userId);
          const hasVoiceJourney = (userData.journey || []).some(j => j.event === 'First Voice Session');
          if (!hasVoiceJourney) {
            await addJourney(userId, 'First Voice Session');
          }
        }
      }
    }
  }
};
