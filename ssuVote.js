const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require("discord.js");

global.voters = new Set();
global.voteSettings = new Map(); // Add this line to initialize voteSettings

module.exports = {
  name: "rvote",
  roles: ["1352562486167076926"],
  description: "Sends a session poll with optional custom max votes (up to 12).",
  cooldown: 5,
  async execute(message, client, args) {
    voters.clear();
    const defaultVotes = 7;
    let maxVotes = defaultVotes;

    if (args.length > 0 && !isNaN(args[0])) {
      maxVotes = Math.max(1, Math.min(12, parseInt(args[0])));
    }

    const targetChannelId = "1340250308709847050";
    global.voteSettings.set(targetChannelId, { maxVotes }); // Add this line to store maxVotes

    const targetChannel = client.channels.cache.get(targetChannelId);
    if (!targetChannel) {
      return message.reply(`Channel with ID ${targetChannelId} not found.`);
    }

    const voteButton = new ButtonBuilder().setCustomId("vote").setLabel("0").setStyle(ButtonStyle.Success);

    const voterListButton = new ButtonBuilder().setCustomId("voters").setLabel("Voters").setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(voteButton, voterListButton);

    const timeNow = Math.floor(Date.now() / 1000);

    const ssuvoteEmbed = new EmbedBuilder().setColor(0xf3c443).setDescription(`# <:AV8SRC:1352864587460120627> Race Vote! <:AV8SRC:1352864587460120627>\nHello AV8SR fans, we all know you've been waiting for an epic race, vote below to get a race kickstarted! Make sure you have your pit crew ready and set for this race as well!\n\nVotes Required: **${maxVotes}**`).setImage("https://media.discordapp.net/attachments/1180956991775064069/1353852109988167833/Screenshot202025-03-2420at207.png?ex=67e32888&is=67e1d708&hm=7f9addea1a625773271162fabaa3e59c0220e51c819235efa3f65bc5d5e19f41&=&format=webp&quality=lossless&width=2400&height=384");
    const ssuvoteEmbed1 = new EmbedBuilder().setColor(0xf3c443).setImage("https://media.discordapp.net/attachments/1180956991775064069/1353852189231153253/Screenshot202025-03-2420at207.png?ex=67e3289b&is=67e1d71b&hm=6e15726361f1ad2d0214d172e7e1b204eb887f7b28d47845e9d2ec94667b4647&=&format=webp&quality=lossless&width=2412&height=576");

    try {
      await targetChannel.send({
        content: "<@&1353458784101732442> | @here",
        embeds: [ssuvoteEmbed1, ssuvoteEmbed],
        components: [row],
      });
      setTimeout(() => {
        message.delete().catch((err) => console.error("Failed to delete the trigger message:", err));
      }, 5000);
    } catch (error) {
      console.error("Error sending vote message:", error);
      message.reply("An error occurred while sending the vote message.");
    }
  },
};
