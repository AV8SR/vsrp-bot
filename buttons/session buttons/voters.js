const { EmbedBuilder } = require("discord.js");

module.exports = {
  customID: "voters",
  execute: async function (interaction) {
    const embed = new EmbedBuilder().setColor(0x2b2d31).addFields({
      name: "Here are the current voters;",
      value:
        voters.size > 0
          ? Array.from(voters)
              .map((id) => `<@${id}>`)
              .join(", ")
          : "There are no voters yet!",
    });

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
