const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const axios = require("axios");
const nbx = require("noblox.js");

module.exports = {
  roles: ["1352562486167076926"],
  cooldown: 5,
  name: "rb",
  description: "Send a server mc message - Uses ERLC API",
  async execute(message, client, args) {
    await message.delete();

    // Specify the channel ID where the message should be sent
    const targetChannelId = "1340250308709847050"; // Replace with the actual channel ID
    const targetChannel = client.channels.cache.get(targetChannelId);

    if (!targetChannel) {
      console.error(`Channel with ID ${targetChannelId} not found.`);
      return;
    }

    try {
      const response = await axios.get("https://api.policeroleplay.community/v1/server", {
        headers: {
          "Server-Key": client.config.ERLC_API,
        },
      });
      const server = response.data;

      await new Promise((resolve) => setTimeout(resolve, 6 * 1000));

      const response2 = await axios.get("https://api.policeroleplay.community/v1/server/players", {
        headers: {
          "Server-Key": client.config.ERLC_API,
        },
      });

      const ownerName = await nbx.getUsernameFromId(server.OwnerId);
      const boostEmbed = new EmbedBuilder().setColor(0xed8aa7).setImage("https://media.discordapp.net/attachments/1180956991775064069/1353864008708526180/Screenshot202025-03-2420at2011.png?ex=67e3339d&is=67e1e21d&hm=006cae8ce07e5013cb77786b9be1e0ab45def407971dc2e99b360df006356af1&=&format=webp&quality=lossless&width=2372&height=340").setDescription(`# <:AV8SRC:1352864587460120627>  Race Low! <:AV8SRC:1352864587460120627>\nOur in game race is too low to do anything, come help us make a race reality here in Australian V8 Supercars Racing!`);

      const boostEmbed1 = new EmbedBuilder().setColor(0xed8aa7).setImage("https://media.discordapp.net/attachments/1180956991775064069/1353863975695290529/Screenshot202025-03-2420at2011.png?ex=67e33395&is=67e1e215&hm=d14154126a48568a7e22e847ac65211bf14c3ee650d6d0661f05eb5388fa9e0c&=&format=webp&quality=lossless&width=2396&height=508");

      const linkButton = new ButtonBuilder().setLabel("Quick join").setURL(`https://policeroleplay.community/join?code=${server.JoinKey}`).setStyle(ButtonStyle.Link);

      const row = new ActionRowBuilder().addComponents(linkButton);

      await targetChannel.send({
        embeds: [boostEmbed1, boostEmbed],
        components: [row],
        content: "<@&1353458784101732442> | @here",
      });
    } catch (error) {
      console.error("Error fetching server data:", error);
    }
  },
};
