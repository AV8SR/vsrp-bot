const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const nbx = require('noblox.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('erlc-status')
        .setDescription('Check the status of ELRC'),
    async execute(interaction) {
        await interaction.deferReply();

        async function fetchData() {
            let server = null,
                queueCount = 0,
                staffCount = 0,
                ownerName = "Unknown";

            try {
                // Fetch server data
                const serverResponse = await axios.get("https://api.policeroleplay.community/v1/server", { headers: { "Server-Key": interaction.client.config.ERLC_API } });
                server = serverResponse.data;
                ownerName = await nbx.getUsernameFromId(server.OwnerId);
            } catch (error) {
                console.error("Error fetching server data:", error);
                throw new Error("Failed to fetch server data.");
            }

            try {
                // Fetch queue data
                const queueResponse = await axios.get("https://api.policeroleplay.community/v1/server/queue", { headers: { "Server-Key": interaction.client.config.ERLC_API } });
                const queueData = queueResponse.data;
                queueCount = new Set(queueData.map(p => p.RobloxId)).size;
            } catch (error) {
                console.error("Error fetching queue data:", error);
            }

            try {
                // Fetch players data
                const playersResponse = await axios.get("https://api.policeroleplay.community/v1/server/players", { headers: { "Server-Key": interaction.client.config.ERLC_API } });
                const players = playersResponse.data;

                // Count staff members
                const staffPermissions = ["Server Administrator", "Server Owner", "Server Moderator", "Server Co-Owner"];
                staffCount = players.filter(player => staffPermissions.includes(player.Permission)).length;
            } catch (error) {
                console.error("Error fetching players data:", error);
            }

            return { server, queueCount, staffCount, ownerName };
        }

        try {
            const data = await fetchData();

            // Fetch co-owner usernames and create hyperlinks
            const coOwnerNames = await Promise.all(data.server.CoOwnerIds.map(async (id) => {
                const username = await nbx.getUsernameFromId(id);
                return `[${username}](https://www.roblox.com/users/${id}/profile)`;
            }));
            const coOwnersString = coOwnerNames.join(', ') || 'None';

            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('ERLC Status')
                .setColor(0x2b2d31)
                .addFields(
                    { name: 'Server Information', value: 
                        `> **Server Name:** ${data.server.Name}\n` +
                        `> **Current Players:** ${data.server.CurrentPlayers}/${data.server.MaxPlayers}\n` +
                        `> **Queue:** ${data.queueCount} players\n` +
                        `> **Staff In Game:** ${data.staffCount}`
                    },
                    { name: 'Ownership Team', value: 
                        `> **Owner:** [${data.ownerName}](https://www.roblox.com/users/${data.server.OwnerId}/profile)\n` +
                        `> **Co-Owner(s):** ${coOwnersString}`
                    },
                    { name: 'Server Settings', value: 
                        `> **Account Verification:** ${data.server.AccVerifiedReq}\n` +
                        `> **Team Balance:** ${data.server.TeamBalance ? 'Enabled' : 'Disabled'}`
                    }
                )
                .setTimestamp();

            // Create a link button
            const linkButton = new ButtonBuilder()
                .setLabel('Quick join')
                .setURL(`https://policeroleplay.community/join?code=${data.server?.JoinKey || 'N/A'}`)
                .setStyle(ButtonStyle.Link);

            // Create an action row with the button
            const row = new ActionRowBuilder()
                .addComponents(linkButton);

            // Send the reply with both the embed and the button
            await interaction.editReply({ 
                embeds: [embed],
                components: [row]
            });
        } catch (error) {
            console.error("Error fetching ELRC status:", error);
            await interaction.editReply("An error occurred while fetching the ELRC status. Please try again later.");
        }
    },
};
