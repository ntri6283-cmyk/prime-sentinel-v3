const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function callGroq(prompt, maxTokens = 800) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return 'GROQ_API_KEY chua duoc cau hinh trong file .env';

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7
    })
  });

  const data = await res.json();
  if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content.trim();
  if (data?.error) return `Loi AI: ${data.error.message}`;
  return 'Khong the ket noi AI luc nay.';
}

async function askGroq(prompt) { return callGroq(prompt); }

async function analyzeToxicity(content) {
  const prompt = `Phan tich muc do doc hai cua tin nhan Discord (0=an toan, 100=rat doc hai).
Tin nhan: "${content}"
Tra ve JSON: {"score":<0-100>,"type":"<spam/toxic/harassment/safe>","action":"<warn/delete/safe>","reason":"<ly do tieng Viet khong dau>"}
Chi tra JSON.`;
  const raw = await callGroq(prompt, 200);
  try { return JSON.parse(raw.replace(/```json|```/g, '').trim()); }
  catch { return { score: 0, type: 'safe', action: 'safe', reason: 'Khong phan tich duoc' }; }
}

async function analyzeTicket(content, username) {
  const prompt = `Phan tich ticket Discord:
Nguoi gui: ${username}
Noi dung: "${content}"
Tra ve JSON: {"category":"<Ho Tro/Bao Cao/Hop Tac/Khieu Nai/Khac>","priority":"<Cao/Trung Binh/Thap>","summary":"<tom tat 1 cau>","suggestion":"<de xuat xu ly>"}
Chi tra JSON.`;
  const raw = await callGroq(prompt, 300);
  try { return JSON.parse(raw.replace(/```json|```/g, '').trim()); }
  catch { return { category: 'Khac', priority: 'Trung Binh', summary: content.slice(0, 100), suggestion: 'Staff kiem tra thu cong' }; }
}

async function analyzeSuggestion(content) {
  const prompt = `Phan tich gop y cho server Discord gaming Prime Kingdom.
Gop y: "${content}"
Tra ve JSON: {"category":"<Gameplay/Cong Dong/Bot/Su Kien/Khac>","priority":"<Cao/Trung Binh/Thap>","impact":<0-100>,"feasibility":<0-100>,"summary":"<danh gia ngan gon tieng Viet khong dau>"}
Chi tra JSON.`;
  const raw = await callGroq(prompt, 300);
  try { return JSON.parse(raw.replace(/```json|```/g, '').trim()); }
  catch { return { category: 'Khac', priority: 'Trung Binh', impact: 50, feasibility: 50, summary: 'Can xem xet them' }; }
}

async function suggestRole(messageCount, level, topChannels) {
  const prompt = `Goi y role cho thanh vien Discord Prime Kingdom.
Tin nhan: ${messageCount} | Level: ${level} | Kenh: ${topChannels}
Tra ve JSON: {"role":"<Gamer/Builder/Event Enthusiast/Community Helper/Content Creator/Strategist>","confidence":<0-100>,"reason":"<ly do tieng Viet khong dau>"}
Chi tra JSON.`;
  const raw = await callGroq(prompt, 200);
  try { return JSON.parse(raw.replace(/```json|```/g, '').trim()); }
  catch { return { role: 'Member', confidence: 50, reason: 'Chua du du lieu' }; }
}

async function summarizeMember(data) {
  return callGroq(`Tom tat ho so thanh vien Discord Prime Kingdom.
Ten: ${data.username} | Tham gia: ${data.joinedAt} | Tin nhan: ${data.messageCount} | Level: ${data.level} | Rep: ${data.reputation} | Coins: ${data.coins} | Achievements: ${data.achievements}
Viet 3-4 bullet points ngan gon tieng Viet khong dau.`, 300);
}

async function suggestEvents(memberCount, dayOfWeek, recentActivity) {
  return callGroq(`De xuat 3 su kien cho server Discord gaming Prime Kingdom.
Thanh vien: ${memberCount} | Hom nay: ${dayOfWeek} | Hoat dong: ${recentActivity}
Moi su kien: ten, mo ta ngan, thoi gian goi y, phan thuong goi y. Tieng Viet khong dau.`, 400);
}

async function generateInsights(stats) {
  return callGroq(`Tao bao cao phan tich cong dong Discord Prime Kingdom.
Thanh vien moi: ${stats.newMembers} | Tin nhan: ${stats.totalMessages} | Online TB: ${stats.avgOnline}
Viet 5-6 dong phan tich xu huong va 2 de xuat cai thien. Tieng Viet khong dau.`, 400);
}

module.exports = { askGroq, analyzeToxicity, analyzeTicket, analyzeSuggestion, suggestRole, summarizeMember, suggestEvents, generateInsights };
