const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('He thong gop y')
    .addSubcommand(s => s.setName('add').setDescription('Gui gop y moi')
      .addStringOption(o => o.setName('content').setDescription('Noi dung gop y').setRequired(true)))
    .addSubcommand(s => s.setName('approve').setDescription('Duyet gop y (Staff)')
      .addStringOption(o => o.setName('messageid').setDescription('ID tin nhan').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Ly do').setRequired(false)))
    .addSubcommand(s => s.setName('reject').setDescription('Tu choi gop y (Staff)')
      .addStringOption(o => o.setName('messageid').setDescription('ID tin nhan').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Ly do').setRequired(false))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const content = interaction.options.getString('content');
      const suggestChannel = interaction.guild.channels.cache.find(c => c.name === 'suggestions' || c.name === 'gop-y');
      if (!suggestChannel) return interaction.reply({ content: 'Khong tim thay kenh suggestions!', ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle('GÓP Ý MỚI')
        .setDescription(content)
        .setColor(0x7c3aed)
        .addFields(
          { name: 'Nguoi gui', value: interaction.user.toString(), inline: true },
          { name: 'Trang thai', value: '⏳ Dang xem xet', inline: true },
          { name: 'Thoi gian', value: new Date().toLocaleString('vi-VN'), inline: true },
          { name: 'Binh chon', value: '👍 0 | 👎 0', inline: false }
        )
        .setFooter({ text: 'Prime Sentinel - Suggestion System' }).setTimestamp();

      const upBtn = new ButtonBuilder().setCustomId('suggest_upvote').setLabel('Dong y (0)').setStyle(ButtonStyle.Success).setEmoji('👍');
      const downBtn = new ButtonBuilder().setCustomId('suggest_downvote').setLabel('Khong dong y (0)').setStyle(ButtonStyle.Danger).setEmoji('👎');
      const aiBtn = new ButtonBuilder().setCustomId('suggest_ai_analyze').setLabel('AI Phan tich').setStyle(ButtonStyle.Secondary).setEmoji('🤖');
      const row = new ActionRowBuilder().addComponents(upBtn, downBtn, aiBtn);

      const msg = await suggestChannel.send({ embeds: [embed], components: [row] });
      // Luu content vao message de AI analyze sau
      await msg.react('📊').catch(() => {});

      await interaction.reply({ content: `Gop y da duoc gui den ${suggestChannel}!`, ephemeral: true });
    }

    if (sub === 'approve' || sub === 'reject') {
      if (!interaction.member.permissions.has('ManageMessages')) {
        return interaction.reply({ content: 'Ban khong co quyen!', ephemeral: true });
      }
      const msgId = interaction.options.getString('messageid');
      const reason = interaction.options.getString('reason') || 'Khong co ly do';
      const suggestChannel = interaction.guild.channels.cache.find(c => c.name === 'suggestions' || c.name === 'gop-y');
      if (!suggestChannel) return interaction.reply({ content: 'Khong tim thay kenh!', ephemeral: true });

      const msg = await suggestChannel.messages.fetch(msgId).catch(() => null);
      if (!msg) return interaction.reply({ content: 'Khong tim thay tin nhan!', ephemeral: true });

      const oldEmbed = msg.embeds[0];
      if (!oldEmbed) return interaction.reply({ content: 'Tin nhan khong hop le!', ephemeral: true });

      const approved = sub === 'approve';
      const newEmbed = new EmbedBuilder()
        .setTitle(oldEmbed.title)
        .setDescription(oldEmbed.description)
        .setColor(approved ? 0x00ff88 : 0xff4444)
        .addFields(
          { name: 'Nguoi gui', value: oldEmbed.fields[0]?.value || 'N/A', inline: true },
          { name: 'Trang thai', value: approved ? '✅ Da duyet' : '❌ Bi tu choi', inline: true },
          { name: 'Thoi gian', value: oldEmbed.fields[2]?.value || 'N/A', inline: true },
          { name: 'Binh chon', value: oldEmbed.fields[3]?.value || '0 | 0', inline: false },
          { name: approved ? 'Ly do duyet' : 'Ly do tu choi', value: reason, inline: false },
          { name: 'Xu ly boi', value: interaction.user.toString(), inline: true },
        )
        .setFooter({ text: 'Prime Sentinel - Suggestion System' }).setTimestamp();

      await msg.edit({ embeds: [newEmbed], components: [] });
      await interaction.reply({ content: `Da ${approved ? 'duyet' : 'tu choi'} gop y!`, ephemeral: true });
    }
  }
};
