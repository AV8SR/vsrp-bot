const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const axios = require("axios");
const nbx = require("noblox.js");

// Create a simple in-memory cooldown map
const cooldowns = new Map();

module.exports = {
  name: "rsu",
  roles: ["1352562486167076926"],
  description: "Start a server session!",
  async execute(message, client, args) {
    const now = Date.now();
    const cooldownAmount = 5000; // 5 seconds

    // Check if the user is on cooldown
    if (cooldowns.has(message.author.id)) {
      const expirationTime = cooldowns.get(message.author.id) + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000; // Convert to seconds
        return message.reply(`You need to wait ${timeLeft.toFixed(1)} seconds before using this command again.`);
      }
    }

    // Set the cooldown for the user
    cooldowns.set(message.author.id, now);

    await message.delete();

    const targetChannelId = "1340250308709847050";
    const targetChannel = client.channels.cache.get(targetChannelId);

    if (!targetChannel) {
      console.error(`Channel with ID ${targetChannelId} not found.`);
      return;
    }

    async function fetchData() {
      let server = null,
        queueCount = 0,
        staffCount = 0,
        ownerName = "Unknown";

      try {
        // Fetch server data
        const serverResponse = await axios.get("https://api.policeroleplay.community/v1/server", { headers: { "Server-Key": client.config.ERLC_API } });
        server = serverResponse.data;
        ownerName = await nbx.getUsernameFromId(server.OwnerId);
      } catch (error) {
        console.error("Error fetching server data:", error);
        message.channel.send("Error fetching server data. Please check the bot's console for more information.");
      }

      try {
        // Fetch queue data
        const queueResponse = await axios.get("https://api.policeroleplay.community/v1/server/queue", { headers: { "Server-Key": client.config.ERLC_API } });
        const queueData = queueResponse.data;
        queueCount = new Set(queueData.map((p) => p.RobloxId)).size;
      } catch (error) {
        console.error("Error fetching queue data:", error);
        message.channel.send("Error fetching queue data. The bot may not have the correct permissions. Queue information will not be displayed.");
      }

      try {
        // Fetch players data
        const playersResponse = await axios.get("https://api.policeroleplay.community/v1/server/players", { headers: { "Server-Key": client.config.ERLC_API } });
        const players = playersResponse.data;

        // Count staff members
        const staffPermissions = ["Server Administrator", "Server Owner", "Server Moderator", "Server Co-Owner"];
        staffCount = players.filter((player) => staffPermissions.includes(player.Permission)).length;
      } catch (error) {
        console.error("Error fetching players data:", error);
        message.channel.send("Error fetching players data. The bot may not have the correct permissions. Staff information will not be displayed.");
      }

      return { server, queueCount, staffCount, ownerName };
    }

    async function createEmbed(data, lastUpdate) {
      const lastUpdateUnix = Math.floor(lastUpdate.getTime() / 1000);
      return new EmbedBuilder()
        .setDescription(
          `# <:AV8SRC:1352864587460120627> Race Start Up! <:AV8SRC:1352864587460120627> \n` + `Our in game racing server is official up for business! Depending on the number of contestants and people who join the server depends on if we do a race or an event!\n\n` + `# <:calendar:1348180555375575110> Current Session Info:\n` + `<:DarkBlueArrow:1344899871823499384> **Server Owner:** ${data.ownerName}\n` + `<:DarkBlueArrow:1344899871823499384> **Join Code:** ${data.server ? data.server.JoinKey : "N/A"}\n` + `<:DarkBlueArrow:1344899871823499384> **Server Name:** ${data.server ? data.server.Name : "N/A"}\n` + `<:DarkBlueArrow:1344899871823499384> **Players:** ${data.server ? `${data.server.CurrentPlayers}/${data.server.MaxPlayers}` : "N/A"}\n` + `<:DarkBlueArrow:1344899871823499384> **Queue:** ${data.queueCount}\n` + `<:DarkBlueArrow:1344899871823499384> **Staff In Game:** ${data.staffCount}\n` + `<:DarkBlueArrow:1344899871823499384> **Status Updated:** <t:${lastUpdateUnix}:R>`
        )
        .setImage("https://media.discordapp.net/attachments/1180956991775064069/1353861365798011021/Screenshot202025-03-2420at2011.png?ex=67e33127&is=67e1dfa7&hm=1bcf70c01d20f3ac0ea577d6c3877c8e29bb946d256ed88a91bd9a7361031094&=&format=webp&quality=lossless&width=2384&height=348")
        .setColor(0x9bc557);
    }

    try {
      const initialData = await fetchData();
      const initialEmbed = await createEmbed(initialData, new Date());

      // Create a second embed
      const additionalEmbed = new EmbedBuilder().setColor(0x9bc557).setImage(`https://media.discordapp.net/attachments/1180956991775064069/1353861298978553856/Screenshot202025-03-2420at2011.png?ex=67e33117&is=67e1df97&hm=e150fc968443c5f22f5dd5dae2421c15351a737afcc4b287ee676eef03cff112&=&format=webp&quality=lossless&width=2388&height=544`);

      const linkButton = new ButtonBuilder()
        .setLabel("Quick Join")
        .setURL(`https://policeroleplay.community/join?code=${initialData.server?.JoinKey || "N/A"}`)
        .setStyle(ButtonStyle.Link);

      const row = new ActionRowBuilder().addComponents(linkButton);

      const voterMentions = Array.from(global.voters)
        .map((id) => `<@${id}>`)
        .join(",");

      const sentMessage = await targetChannel.send({
        embeds: [additionalEmbed, initialEmbed], // Additional embed first, then initial embed
        components: [row],
        content: `<@&1353458784101732442> | @here | ${voterMentions}`,
      });

      global.voters.clear();

      let lastUpdate = new Date();

      // Function to update the embeds
      async function updateEmbed() {
        try {
          const updatedData = await fetchData();
          lastUpdate = new Date();
          const updatedInitialEmbed = await createEmbed(updatedData, lastUpdate);

          // Update the second embed if needed
          const updatedAdditionalEmbed = new EmbedBuilder().setColor(0x9bc557).setImage(`https://media.discordapp.net/attachments/1180956991775064069/1353861298978553856/Screenshot202025-03-2420at2011.png?ex=67e33117&is=67e1df97&hm=e150fc968443c5f22f5dd5dae2421c15351a737afcc4b287ee676eef03cff112&=&format=webp&quality=lossless&width=2388&height=544`);

          await sentMessage.edit({ embeds: [updatedAdditionalEmbed, updatedInitialEmbed] });
        } catch (error) {
          console.error("Error updating embeds:", error);
          message.channel.send("Failed to update the embeds. Check the console for details.");
        }
      }

      // Set interval to update every 3 minutes
      const updateInterval = setInterval(updateEmbed, 3 * 60 * 1000);

      // Optional: Stop updating after 1 hour
      setTimeout(() => {
        clearInterval(updateInterval);
      }, 60 * 60 * 1000);
    } catch (error) {
      console.error("Error in rsu command:", error);
      message.channel.send("An error occurred while setting up the server session.");
    }
  },
};
