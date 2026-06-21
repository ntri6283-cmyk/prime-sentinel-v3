const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {

    // ── SLASH COMMANDS ──
    if (interaction.isChatInputCommand()) {
      const commandsPath = path.join(__dirname, '../commands');
      for (const folder of fs.readdirSync(commandsPath)) {
        for (const file of fs.readdirSync(path.join(commandsPath, folder)).filter(f => f.endsWith('.js'))) {
          const command = require(path.join(commandsPath, folder, file));
          if (!command.data || !command.execute) continue;
          if (command.data.name === interaction.commandName) {
            try {
              await command.execute(interaction);
            } catch (err) {
              console.error('Loi lenh', interaction.commandName, err);
              const msg = { content: 'Co loi xay ra!', ephemeral: true };
              if (interaction.deferred || interaction.replied) await interaction.editReply(msg).catch(() => {});
              else await interaction.reply(msg).catch(() => {});
            }
            return;
          }
        }
      }
    }

    // ── VERIFY ──
    if (interaction.isButton() && interaction.customId === 'verify_button') {
      const { guild, member } = interaction;
      const role = guild.roles.cache.find(r => r.name === 'Member');
      if (!role) return interaction.reply({ content: 'Khong tim thay role Member!', ephemeral: true });
      if (member.roles.cache.has(role.id)) return interaction.reply({ content: 'Ban da duoc xac minh roi!', ephemeral: true });
      try {
        await member.roles.add(role);
        await interaction.reply({ content: `Xac minh thanh cong! Chao mung ${member.displayName} den voi Prime Kingdom!`, ephemeral: true });
        const logCh = guild.channels.cache.find(c => c.name === 'verify-log');
        if (logCh) {
          logCh.send({ embeds: [new EmbedBuilder().setTitle('Xac minh thanh cong')
            .addFields(
              { name: 'Thanh vien', value: member.toString(), inline: true },
              { name: 'ID', value: member.id, inline: true },
              { name: 'Thoi gian', value: new Date().toLocaleString('vi-VN'), inline: true }
            ).setColor(0x00ff88).setThumbnail(member.user.displayAvatarURL())] });
        }
      } catch (err) { await interaction.reply({ content: 'Loi khi cap role!', ephemeral: true }); }
    }

    // ── TICKET SELECT ──
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
      const type = interaction.values[0];
      const { guild, member } = interaction;
      const typeNames = { support: 'Ho-Tro', report: 'Bao-Cao', collab: 'Hop-Tac', staff: 'Lien-He-Staff', suggestion: 'Gop-Y' };
      const typeColors = { support: 0x00ff88, report: 0xff0000, collab: 0xffd700, staff: 0x1a3a6e, suggestion: 0xff6600 };
      const channelName = `ticket-${typeNames[type]}-${member.user.username.toLowerCase()}`;
      const existing = guild.channels.cache.find(c => c.name === channelName);
      if (existing) return interaction.reply({ content: `Ban da co ticket roi! ${existing}`, ephemeral: true });
      const staffRole = guild.roles.cache.find(r => r.name === 'Staff');
      const ticketCh = await guild.channels.create({
        name: channelName, type: ChannelType.GuildText,
        parent: guild.channels.cache.find(c => c.name === 'tickets')?.id,
        permissionOverwrites: [
          { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
          { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          ...(staffRole ? [{ id: staffRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] : [])
        ]
      });
      const closeBtn = new ButtonBuilder().setCustomId('ticket_close').setLabel('Dong Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒');
      await ticketCh.send({
        content: `${member}${staffRole ? ` | ${staffRole}` : ''}`,
        embeds: [new EmbedBuilder().setTitle(`TICKET: ${typeNames[type].toUpperCase()}`)
          .setDescription(`Xin chao ${member}!\nStaff se ho tro ban som nhat co the.\n\nHay mo ta van de de AI ho tro phan loai.`)
          .setColor(typeColors[type])
          .addFields(
            { name: 'Nguoi tao', value: member.toString(), inline: true },
            { name: 'Loai', value: typeNames[type], inline: true },
            { name: 'Thoi gian', value: new Date().toLocaleString('vi-VN'), inline: true }
          ).setFooter({ text: 'Prime Sentinel - Ticket System • AI Assistant san sang' }).setTimestamp()],
        components: [new ActionRowBuilder().addComponents(closeBtn)]
      });

      // AI Ticket Assistant: lang nghe tin nhan dau tien
      const collector = ticketCh.createMessageCollector({ filter: m => m.author.id === member.id && !m.author.bot, max: 1, time: 120000 });
      collector.on('collect', async msg => {
        try {
          const { analyzeTicket } = require('../systems/ai');
          const analysis = await analyzeTicket(msg.content, member.user.username);
          await ticketCh.send({ embeds: [new EmbedBuilder().setTitle('🤖 AI TICKET ASSISTANT').setColor(0x7c3aed)
            .addFields(
              { name: 'Phan loai', value: analysis.category, inline: true },
              { name: 'Uu tien', value: analysis.priority, inline: true },
              { name: 'Tom tat', value: analysis.summary, inline: false },
              { name: 'De xuat xu ly', value: analysis.suggestion, inline: false },
            ).setFooter({ text: 'Prime Sentinel AI • Phan tich tu dong' }).setTimestamp()] });
        } catch (err) { console.error('AI Ticket error:', err); }
      });

      await interaction.reply({ content: `Ticket da duoc tao! ${ticketCh}`, ephemeral: true });
    }

    // ── DONG TICKET ──
    if (interaction.isButton() && interaction.customId === 'ticket_close') {
      const channel = interaction.channel;
      await interaction.reply({ content: 'Ticket se duoc dong sau 5 giay...' });
      const messages = await channel.messages.fetch({ limit: 100 });
      const transcript = messages.reverse().map(m => `[${new Date(m.createdTimestamp).toLocaleString('vi-VN')}] ${m.author.tag}: ${m.content}`).join('\n');
      const logCh = interaction.guild.channels.cache.find(c => c.name === 'ticket-log');
      if (logCh && transcript) {
        logCh.send({ embeds: [new EmbedBuilder().setTitle(`TICKET CLOSED: ${channel.name}`)
          .setDescription('```' + transcript.slice(0, 3900) + '```').setColor(0xff6600)
          .addFields(
            { name: 'Dong boi', value: interaction.user.toString(), inline: true },
            { name: 'Thoi gian', value: new Date().toLocaleString('vi-VN'), inline: true }
          ).setTimestamp()] });
      }
      setTimeout(() => channel.delete().catch(() => {}), 5000);
    }

    // ── EVENT JOIN/LEAVE ──
    if (interaction.isButton() && interaction.customId.startsWith('event_join_')) {
      const eventId = interaction.customId.replace('event_join_', '');
      const { events } = require('../commands/event/event');
      const event = events.get(eventId);
      if (!event) return interaction.reply({ content: 'Su kien nay da ket thuc!', ephemeral: true });
      if (event.participants.includes(interaction.user.id)) return interaction.reply({ content: 'Ban da dang ky roi!', ephemeral: true });
      if (event.participants.length >= event.maxPlayers) return interaction.reply({ content: 'Su kien da day!', ephemeral: true });
      event.participants.push(interaction.user.id);
      await interaction.reply({ content: `Ban da dang ky **${event.name}**! So nguoi: ${event.participants.length}/${event.maxPlayers}`, ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId.startsWith('event_leave_')) {
      const eventId = interaction.customId.replace('event_leave_', '');
      const { events } = require('../commands/event/event');
      const event = events.get(eventId);
      if (!event) return interaction.reply({ content: 'Su kien nay da ket thuc!', ephemeral: true });
      event.participants = event.participants.filter(id => id !== interaction.user.id);
      await interaction.reply({ content: `Ban da huy dang ky **${event.name}**!`, ephemeral: true });
    }

    // ── GIVEAWAY JOIN ──
    if (interaction.isButton() && interaction.customId.startsWith('giveaway_join_')) {
      const giveawayId = interaction.customId.replace('giveaway_join_', '');
      const { giveaways } = require('../commands/giveaway/giveaway');
      const giveaway = giveaways.get(giveawayId);
      if (!giveaway || giveaway.ended) return interaction.reply({ content: 'Giveaway nay da ket thuc!', ephemeral: true });
      if (giveaway.participants.includes(interaction.user.id)) {
        giveaway.participants = giveaway.participants.filter(id => id !== interaction.user.id);
        return interaction.reply({ content: `Ban da huy tham gia **${giveaway.prize}**!`, ephemeral: true });
      }
      if (giveaway.minLevel > 0) {
        const { getUser } = require('../systems/database');
        const userData = await getUser(interaction.user.id);
        if (userData.level < giveaway.minLevel) return interaction.reply({ content: `Ban can Level **${giveaway.minLevel}**! Hien tai: **${userData.level}**`, ephemeral: true });
      }
      giveaway.participants.push(interaction.user.id);
      await interaction.reply({ content: `Ban da tham gia **${giveaway.prize}**! So nguoi: ${giveaway.participants.length}. Chuc may man!`, ephemeral: true });
    }

    // ── SUGGESTION VOTE ──
    if (interaction.isButton() && (interaction.customId === 'suggest_upvote' || interaction.customId === 'suggest_downvote')) {
      const msg = interaction.message;
      const embed = msg.embeds[0];
      if (!embed) return;
      const voteField = embed.fields.find(f => f.name === 'Binh chon');
      let up = 0, down = 0;
      if (voteField) { const m = voteField.value.match(/👍 (\d+) \| 👎 (\d+)/); if (m) { up = parseInt(m[1]); down = parseInt(m[2]); } }
      if (interaction.customId === 'suggest_upvote') up++; else down++;
      const newEmbed = new EmbedBuilder().setTitle(embed.title).setDescription(embed.description).setColor(embed.color)
        .addFields(
          { name: 'Nguoi gui', value: embed.fields[0]?.value || 'N/A', inline: true },
          { name: 'Trang thai', value: embed.fields[1]?.value || 'Dang xem xet', inline: true },
          { name: 'Thoi gian', value: embed.fields[2]?.value || 'N/A', inline: true },
          { name: 'Binh chon', value: `👍 ${up} | 👎 ${down}`, inline: false }
        ).setFooter({ text: embed.footer?.text || 'Prime Sentinel - Suggestion System' }).setTimestamp();
      await msg.edit({ embeds: [newEmbed], components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('suggest_upvote').setLabel(`Dong y (${up})`).setStyle(ButtonStyle.Success).setEmoji('👍'),
        new ButtonBuilder().setCustomId('suggest_downvote').setLabel(`Khong dong y (${down})`).setStyle(ButtonStyle.Danger).setEmoji('👎')
      )] });
      await interaction.reply({ content: interaction.customId === 'suggest_upvote' ? 'Ban da binh chon dong y!' : 'Ban da binh chon khong dong y!', ephemeral: true });
    }

    // ── RECRUIT ──
    if (interaction.isButton() && interaction.customId.startsWith('recruit_apply_')) {
      const hostId = interaction.customId.replace('recruit_apply_', '');
      const { guild, member } = interaction;
      const staffRole = guild.roles.cache.find(r => r.name === 'Staff');
      const channelName = `apply-${member.user.username.toLowerCase()}`;
      const existing = guild.channels.cache.find(c => c.name === channelName);
      if (existing) return interaction.reply({ content: `Ban da co don ung tuyen roi! ${existing}`, ephemeral: true });
      const applyChannel = await guild.channels.create({
        name: channelName, type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
          { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          { id: hostId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          ...(staffRole ? [{ id: staffRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }] : [])
        ]
      });
      await applyChannel.send({ embeds: [new EmbedBuilder().setTitle('DON UNG TUYEN')
        .setDescription(`${member} da ung tuyen!\n\nHay gioi thieu ban than va ly do muon tham gia!`)
        .setColor(0x00ff88).setTimestamp()] });
      await interaction.reply({ content: `Don ung tuyen da duoc tao! ${applyChannel}`, ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId.startsWith('recruit_info_')) {
      const hostId = interaction.customId.replace('recruit_info_', '');
      await interaction.reply({ content: `De biet them, lien he <@${hostId}>!`, ephemeral: true });
    }


    // ── AI ANALYZE SUGGESTION ──
    if (interaction.isButton() && interaction.customId === 'suggest_ai_analyze') {
      await interaction.deferReply({ ephemeral: false });
      const embed = interaction.message.embeds[0];
      const content = embed?.description || '';
      try {
        const { analyzeSuggestion } = require('../systems/ai');
        const analysis = await analyzeSuggestion(content);
        const aiEmbed = new EmbedBuilder().setTitle('🤖 AI SUGGESTION ANALYZER').setColor(0x7c3aed)
          .addFields(
            { name: 'Phan loai', value: analysis.category, inline: true },
            { name: 'Uu tien', value: analysis.priority, inline: true },
            { name: 'Muc do anh huong', value: analysis.impact + '/100', inline: true },
            { name: 'Tinh kha thi', value: analysis.feasibility + '/100', inline: true },
            { name: '🤖 Danh gia AI', value: analysis.summary, inline: false },
          )
          .setFooter({ text: 'Prime Sentinel AI • Suggestion Analyzer' }).setTimestamp();
        await interaction.editReply({ embeds: [aiEmbed] });
      } catch (err) {
        await interaction.editReply({ content: 'Loi phan tich AI!' });
      }
    }

    // ── HELP SELECT ──
    if (interaction.isStringSelectMenu() && interaction.customId === 'help_select') {
      const { helpData } = require('../commands/help/help');
      const data = helpData[interaction.values[0]];
      if (!data) return interaction.update({ content: 'Khong tim thay!', embeds: [], components: [] });
      await interaction.update({ embeds: [new EmbedBuilder().setTitle(data.title).setDescription(data.description)
        .setColor(data.color).setFooter({ text: 'Prime Sentinel - Help System' }).setTimestamp()],
        components: interaction.message.components });
    }
  }
};
