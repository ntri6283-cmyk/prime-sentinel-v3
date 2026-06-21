const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify-setup')
    .setDescription('Gửi panel xác minh vào kênh này')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🛡️ XÁC MINH TÀI KHOẢN')
      .setDescription(
        '> Chào mừng đến với **Prime Kingdom**!\n\n' +
        '📌 Để vào server, bạn cần xác minh tài khoản.\n\n' +
        '✅ Nhấn nút **Verify Ngay** bên dưới để xác minh\n' +
        '🔒 Sau khi xác minh, bạn sẽ nhận role **@Member**'
      )
      .setColor(0x1a3a6e)
      .setThumbnail(interaction.guild.iconURL())
      .setFooter({ text: 'Prime Sentinel • Hệ thống xác minh' })
      .setTimestamp();

    const button = new ButtonBuilder()
      .setCustomId('verify_button')
      .setLabel('✅ Verify Ngay')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({
      content: '✅ Đã gửi panel verify thành công!',
      ephemeral: true
    });
  }
};
