const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  modules: {
    economy:     { type: Boolean, default: true },
    missions:    { type: Boolean, default: true },
    aiCenter:    { type: Boolean, default: true },
    recruitment: { type: Boolean, default: true },
    voiceSystem: { type: Boolean, default: true },
    security2:   { type: Boolean, default: true },
    levelSystem: { type: Boolean, default: true },
    ticketSystem:{ type: Boolean, default: true },
  }
});

const ModuleConfig = mongoose.models.ModuleConfig || mongoose.model('ModuleConfig', moduleSchema);

async function getModules(guildId) {
  let config = await ModuleConfig.findOne({ guildId });
  if (!config) config = await ModuleConfig.create({ guildId });
  return config;
}

const MODULE_INFO = {
  economy:      { name: 'Economy System',   icon: '🪙', desc: 'Coins, Shop, Daily' },
  missions:     { name: 'Mission System',   icon: '🎯', desc: 'Daily/Weekly missions' },
  aiCenter:     { name: 'AI Center',        icon: '🤖', desc: 'AI features' },
  recruitment:  { name: 'Recruitment',      icon: '📋', desc: 'Tuyen thanh vien' },
  voiceSystem:  { name: 'Voice System',     icon: '🎙️', desc: 'Voice XP + Coins' },
  security2:    { name: 'Security 2.0',     icon: '🛡️', desc: 'Risk Score, Scan' },
  levelSystem:  { name: 'Level System',     icon: '⭐', desc: 'XP va Level' },
  ticketSystem: { name: 'Ticket System',    icon: '🎫', desc: 'Ho tro Ticket' },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('module')
    .setDescription('Quan ly cac module cua bot')
    .addSubcommand(s => s.setName('list').setDescription('Xem danh sach module'))
    .addSubcommand(s => s.setName('toggle').setDescription('Bat/tat module')
      .addStringOption(o => o.setName('name').setDescription('Ten module').setRequired(true)
        .addChoices(...Object.keys(MODULE_INFO).map(k => ({ name: MODULE_INFO[k].name, value: k }))))
      .addBooleanOption(o => o.setName('enabled').setDescription('Bat (true) hoac tat (false)').setRequired(true))),

  async execute(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: 'Chi Admin moi co the quan ly module!', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const config = await getModules(interaction.guild.id);

    if (sub === 'list') {
      const lines = Object.entries(MODULE_INFO).map(([key, info]) => {
        const enabled = config.modules[key] !== false;
        return `${enabled ? '🟢' : '🔴'} ${info.icon} **${info.name}** — ${info.desc}`;
      }).join('\n');

      const embed = new EmbedBuilder()
        .setTitle('⚙️ MODULE SYSTEM')
        .setColor(0x7c3aed)
        .setDescription(lines)
        .setFooter({ text: 'Dung /module toggle <ten> <true/false> de bat/tat' }).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'toggle') {
      const name = interaction.options.getString('name');
      const enabled = interaction.options.getBoolean('enabled');
      const info = MODULE_INFO[name];
      if (!info) return interaction.reply({ content: 'Module khong ton tai!', ephemeral: true });

      config.modules[name] = enabled;
      config.markModified('modules');
      await config.save();

      const embed = new EmbedBuilder()
        .setTitle('⚙️ MODULE UPDATED')
        .setColor(enabled ? 0x00ff88 : 0xff4444)
        .setDescription(`${info.icon} **${info.name}** da duoc **${enabled ? '🟢 BAT' : '🔴 TAT'}**`)
        .setFooter({ text: 'Prime Sentinel • Module System' }).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  }
};
