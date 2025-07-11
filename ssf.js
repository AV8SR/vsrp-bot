const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const axios = require("axios");
const nbx = require("noblox.js");

module.exports = {
  roles: ["1352562486167076926"],
  cooldown: 5,
  name: "rf",
  description: "Send a server mc message - Uses ERLC API",
  async execute(message, client, args) {
    await message.delete();

    const targetChannelId = "1340250308709847050";
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
      const timestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds
      const fullEmbed = new EmbedBuilder().setColor(0x71b3f8).setImage("https://media.discordapp.net/attachments/1180956991775064069/1353865739345330288/Screenshot202025-03-2420at2011.png?ex=67e33539&is=67e1e3b9&hm=41664668f6492ec86853d2ebae7b4db575db7834f1962aa8b806c2f5d7407695&=&format=webp&quality=lossless&width=2364&height=392").setDescription(`# <:AV8SRC:1352864587460120627> Race Full! <:AV8SRC:1352864587460120627> \nThanks for getting the race full! This causes some epic and insane racing experiences, you can still join the server and wait in the queue, just be aware it could be too late by the time you join!\n\nThanks from the AV8SR SHR+ team! <:AV8SRC:1352864587460120627>\n\nFull since <t:${timestamp}:R>.`);

      const fullEmbed1 = new EmbedBuilder().setColor(0x71b3f8).setImage("https://media.discordapp.net/attachments/1180956991775064069/1353865711281508475/Screenshot202025-03-2420at2011.png?ex=67e33533&is=67e1e3b3&hm=f6bfabc51e4c9908c567a7fde14c5e070b83a2c30e2853e5ad985f75de107cfc&=&format=webp&quality=lossless&width=2396&height=528");

      const linkButton = new ButtonBuilder().setLabel("Quick join").setURL(`https://policeroleplay.community/join?code=${server.JoinKey}`).setStyle(ButtonStyle.Link);

      const row = new ActionRowBuilder().addComponents(linkButton);

      await targetChannel.send({
        embeds: [fullEmbed1, fullEmbed],
        components: [row],
      });
    } catch (error) {
      console.error("Error fetching server data:", error);
    }
  },
};
