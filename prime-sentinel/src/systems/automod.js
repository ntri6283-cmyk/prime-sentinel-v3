// Danh sach tu cam (co the mo rong)
const bannedWords = [
  'fuck', 'shit', 'bitch', 'asshole', 'dm', 'cunt',
  'dit', 'lon', 'cak', 'vcl', 'vch', 'dmm', 'cmm'
];

// Danh sach domain duoc phep (whitelist)
const allowedDomains = [
  'tenor.com', 'giphy.com', 'youtube.com', 'youtu.be',
  'tiktok.com', 'twitter.com', 'x.com', 'instagram.com',
  'discord.com', 'discordapp.com'
];

function checkBannedWords(content) {
  const lower = content.toLowerCase();
  for (const word of bannedWords) {
    const regex = new RegExp('\\b' + word + '\\b', 'i');
    if (regex.test(lower)) {
      return { violated: true, type: 'banned_word', word };
    }
  }
  return { violated: false };
}

function checkDiscordInvite(content) {
  const inviteRegex = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-zA-Z0-9]+/i;
  if (inviteRegex.test(content)) {
    return { violated: true, type: 'discord_invite' };
  }
  return { violated: false };
}

function checkSuspiciousLink(content) {
  const urlRegex = /https?:\/\/([^\s\/]+)/gi;
  const matches = [...content.matchAll(urlRegex)];

  for (const match of matches) {
    const domain = match[1].toLowerCase().replace('www.', '');
    const isAllowed = allowedDomains.some(allowed => domain.includes(allowed));
    if (!isAllowed) {
      return { violated: true, type: 'suspicious_link', domain };
    }
  }
  return { violated: false };
}

function checkExcessiveCaps(content) {
  if (content.length < 10) return { violated: false };

  const letters = content.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 5) return { violated: false };

  const capsCount = (content.match(/[A-Z]/g) || []).length;
  const ratio = capsCount / letters.length;

  if (ratio > 0.7) {
    return { violated: true, type: 'excessive_caps' };
  }
  return { violated: false };
}

function checkExcessiveMentions(content) {
  const mentionCount = (content.match(/<@!?\d+>/g) || []).length;
  if (mentionCount >= 5) {
    return { violated: true, type: 'mass_mention', count: mentionCount };
  }
  return { violated: false };
}

function checkRepeatedChars(content) {
  // Phat hien ky tu lap lai qua nhieu (aaaaaaa, !!!!!!!)
  const repeatedRegex = /(.)\1{6,}/;
  if (repeatedRegex.test(content)) {
    return { violated: true, type: 'repeated_chars' };
  }
  return { violated: false };
}

// Ham chinh kiem tra toan bo
async function checkAutoMod(message) {
  const content = message.content;

  // Bo qua tin nhan ngan
  if (!content || content.length < 2) {
    return { violated: false };
  }

  // Kiem tra theo thu tu uu tien
  let result = checkBannedWords(content);
  if (result.violated) return { ...result, action: 'delete_warn' };

  result = checkDiscordInvite(content);
  if (result.violated) return { ...result, action: 'delete_warn' };

  result = checkSuspiciousLink(content);
  if (result.violated) return { ...result, action: 'delete_warn' };

  result = checkExcessiveMentions(content);
  if (result.violated) return { ...result, action: 'delete_warn' };

  result = checkExcessiveCaps(content);
  if (result.violated) return { ...result, action: 'warn' };

  result = checkRepeatedChars(content);
  if (result.violated) return { ...result, action: 'warn' };

  return { violated: false };
}

// Thong bao chi tiet cho moi loai vi pham
function getViolationMessage(result) {
  const messages = {
    banned_word: 'Tin nhan chua tu ngu khong phu hop!',
    discord_invite: 'Khong duoc gui link moi server khac!',
    suspicious_link: 'Link nay khong duoc phep! Chi cho phep link tu cac trang da duoc whitelist.',
    mass_mention: 'Khong duoc tag qua nhieu nguoi cung luc!',
    excessive_caps: 'Vui long khong viet hoa toan bo tin nhan!',
    repeated_chars: 'Vui long khong spam ky tu lien tuc!'
  };
  return messages[result.type] || 'Tin nhan vi pham quy dinh server!';
}

module.exports = {
  checkAutoMod,
  getViolationMessage,
  bannedWords,
  allowedDomains
};
