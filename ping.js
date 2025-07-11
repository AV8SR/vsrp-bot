module.exports = {
  name: "ping",
  description: "Ping!",
  cooldown: 5,
  async execute(message, client, args) {
    const sent = await message.reply({ content: "Fetching Discord Information", fetchReply: true });
    const roundTripLatency = sent.createdTimestamp - message.createdTimestamp;
    const apiLatency = client.ws.ping;

    sent.edit({ content: `Discord API Latency: **${apiLatency}**ms\nRound-Trip Latency: **${roundTripLatency}**ms` });
  },
};
