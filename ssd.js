const { EmbedBuilder } = require("@discordjs/builders");

module.exports = {
  roles: ["1352562486167076926"],
  cooldown: 5,
  name: "rsd",
  description: "Send the server shutdown message!",
  async execute(message, client, args) {
    await message.delete();

    // Specify the channel ID where the message should be sent
    const targetChannelId = "1340250308709847050"; // Replace with the actual channel ID
    const targetChannel = client.channels.cache.get(targetChannelId);

    if (!targetChannel) {
      console.error(`Channel with ID ${targetChannelId} not found.`);
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const ssdEmbed = new EmbedBuilder()
      .setColor(0xa52116)
      .setImage(
        "https://media.discordapp.net/attachments/1180956991775064069/1353863676284899471/Screenshot202025-03-2420at2011.png?ex=67e3334d&is=67e1e1cd&hm=12a3c89d9fcdedddf1cd7805fae9b33020f1291104396ebf16e0b94edadd3bf3&=&format=webp&quality=lossless&width=2372&height=324"
      )
      .setDescription(
        `# <:AV8SRC:1352864587460120627> Race Shutdown <:AV8SRC:1352864587460120627> \nOur in game racing server has been shutdown. Do not join our server until we start the next race/event, if you do end up join the server you will face moderation.\n\n-# Please read over our rules in our [Dashboard](https://discord.com/channels/1313797433561714708/1332094848248844289)\n\nShutdown since <t:${timestamp}:R>.`
      );

      const ssdEmbed1 = new EmbedBuilder()
      .setColor(0xa52116)
      .setImage(
        "https://media.discordapp.net/attachments/1180956991775064069/1353863638301282365/Screenshot202025-03-2420at2011.png?ex=67e33344&is=67e1e1c4&hm=9300f341558a4e4f73e35bd05eaa47c58436d17bf857d047d88ebd8c66c745b0&=&format=webp&quality=lossless&width=2376&height=544"
      );
    try {
      await targetChannel.send({
        content: "<@&1353197163798200330>",
        embeds: [ssdEmbed1, ssdEmbed],
      });
    } catch (error) {
      console.error(`Failed to send the shutdown message: ${error}`);
    }
  },
};
