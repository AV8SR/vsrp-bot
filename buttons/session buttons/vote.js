const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  customID: "vote",
  execute: async function (interaction) {
    const reply = interaction.message;
    const channelId = interaction.channelId;
    const settings = global.voteSettings.get(channelId);
    const maxVotes = settings ? settings.maxVotes : 10; // Default to 10 if not set

    let voteCount = voters.size;

    if (voters.has(interaction.user.id)) {
      voters.delete(interaction.user.id);
      voteCount--;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("vote")
          .setLabel(`${voteCount}`)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("voters")
          .setLabel("Voters")
          .setStyle(ButtonStyle.Secondary)
      );

      await reply.edit({ components: [row] });

      const unvotedEmbed = new EmbedBuilder()
        .setColor("2b2d31")
        .setDescription(
          `**I have unregistered your vote!** We now have \`${voteCount}\` vote(s).`
        );

      await interaction.reply({ embeds: [unvotedEmbed], ephemeral: true });
    } else {
      voters.add(interaction.user.id);
      voteCount++;

      let row;
      if (voteCount === maxVotes) {
        const updatedSPollEmbed = new EmbedBuilder()
          .setColor("2b2d31")
          .setDescription(
            `The race vote has reached the required \`${maxVotes}\` vote(s)! The race will start soon.`
          );

        await reply.channel.send({
          embeds: [updatedSPollEmbed],
        });

        row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("vote")
            .setLabel(`${voteCount}`)
            .setDisabled(true)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("voters")
            .setLabel("Voters")
            .setStyle(ButtonStyle.Secondary)
        );
      } else {
        row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("vote")
            .setLabel(`${voteCount}`)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("voters")
            .setLabel("Voters")
            .setStyle(ButtonStyle.Secondary)
        );
      }

      await reply.edit({ components: [row] });

      const votedEmbed = new EmbedBuilder()
        .setColor("2b2d31")
        .setDescription(
          `**I have registered your vote!** We are now at \`${voteCount}\` vote(s).`
        );

      await interaction.reply({ embeds: [votedEmbed], ephemeral: true });
    }
  },
};