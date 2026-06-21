async function updateServerStats(guild) {
  try {
    await guild.members.fetch();

    const totalMembers = guild.memberCount;
    const onlineMembers = guild.members.cache.filter(
      m => m.presence?.status && m.presence.status !== 'offline'
    ).size;

    // Tim category chua stats
    const statsCategory = guild.channels.cache.find(
      c => c.name === 'SERVER STATS' && c.type === 4
    );

    if (!statsCategory) return;

    // Tim hoac tao kenh "Thanh Vien"
    let memberChannel = guild.channels.cache.find(
      c => c.parentId === statsCategory.id && c.name.startsWith('👥')
    );

    if (memberChannel) {
      const newName = '👥 Thanh Vien: ' + totalMembers;
      if (memberChannel.name !== newName) {
        await memberChannel.setName(newName).catch(() => {});
      }
    }

    // Tim hoac tao kenh "Online"
    let onlineChannel = guild.channels.cache.find(
      c => c.parentId === statsCategory.id && c.name.startsWith('🟢')
    );

    if (onlineChannel) {
      const newName = '🟢 Online: ' + onlineMembers;
      if (onlineChannel.name !== newName) {
        await onlineChannel.setName(newName).catch(() => {});
      }
    }

  } catch (err) {
    console.error('Loi cap nhat server stats:', err);
  }
}

// Chay tu dong moi 10 phut (Discord rate limit cho channel rename)
function startStatsUpdater(client) {
  setInterval(() => {
    client.guilds.cache.forEach(guild => {
      updateServerStats(guild);
    });
  }, 10 * 60 * 1000); // 10 phut

  // Chay lan dau khi bot khoi dong
  setTimeout(() => {
    client.guilds.cache.forEach(guild => {
      updateServerStats(guild);
    });
  }, 5000);
}

module.exports = { updateServerStats, startStatsUpdater };
