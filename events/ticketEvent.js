const discord = require("discord.js");
const fs = require("fs");

module.exports = {
  name: "interactionCreate",
  once: false,
  async execute(interaction, client) {
    if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;

    const jsondata = JSON.parse(fs.readFileSync("./tickets.json", "utf8"));

    const errorEmoji = jsondata.emojis.customs.error || jsondata.emojis.defaults.errorEmoji;
    const checkEmoji = jsondata.emojis.customs.success || jsondata.emojis.defaults.checkEmoji;
    const loadingEmoji = jsondata.emojis.customs.loading || jsondata.emojis.defaults.loadingEmoji;

    const openingTicket = interaction.customId.startsWith("ticket-") ? true : interaction.values ? (interaction.values[0].startsWith("ticket-") ? true : false) : false;
    if (openingTicket) {
      if (jsondata.ticketChannel === undefined || jsondata.ticketCategory === undefined) {
        await interaction.reply({ content: `${errorEmoji} The ticketing system is not setup - contact an owner or administrator to set it up.`, components: [], embeds: [], flags: discord.MessageFlags.Ephemeral });
        return;
      }
      const ticketType = interaction.customId.startsWith("ticket-") ? interaction.customId.split("-")[1] : interaction.values[0].split("-")[1];
      if (!jsondata["ticketStatuses"][ticketType]) {
        await interaction.reply({ content: `${errorEmoji} This ticket option is currently unavailable.`, components: [], embeds: [], flags: discord.MessageFlags.Ephemeral });
        return;
      }
      for (const ticket of jsondata["openTickets"]) {
        if (ticket.ticketAuthor === interaction.user.id) {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: `${errorEmoji} You already have an open ticket ( <#${ticket.ticketId}> ).`, components: [], embeds: [], flags: discord.MessageFlags.Ephemeral });
          } else {
            await interaction.reply({ content: `${errorEmoji} You already have an open ticket ( <#${ticket.ticketId}> ).`, components: [], embeds: [], flags: discord.MessageFlags.Ephemeral });
          }
          return;
        }
      }
      const ticketTypes = {
        support: ["General Support", "gs"],
        internalAffairs: ["Internal Affairs", "ia"],
        directive: ["Directive", "d"],
      };

      const reasonModal = new discord.ModalBuilder().setCustomId("ticket_reason").setTitle("Ticket Reason");

      const reasonInput = new discord.TextInputBuilder().setCustomId("reason_input").setLabel("Reason:").setPlaceholder("Enter the reason for the ticket.").setStyle(discord.TextInputStyle.Paragraph);

      reasonModal.addComponents(new discord.ActionRowBuilder().addComponents(reasonInput));

      await interaction.showModal(reasonModal);

      try {
        console.log(jsondata["responseRoles"]);
        console.log(ticketType);
        console.log(jsondata["responseRoles"][ticketType]);
        const ticketRoles = jsondata["responseRoles"][ticketType];
        const modalResponse = await interaction.awaitModalSubmit({ time: 300_000 });
        const reasonInputValue = modalResponse.fields.getTextInputValue("reason_input");
        await modalResponse.deferUpdate();
        const loadingMessage = await interaction.followUp({ content: `${loadingEmoji} Creating ticket...`, components: [], embeds: [], flags: discord.MessageFlags.Ephemeral });

        const ticketEmbed = new discord.EmbedBuilder()
          .setColor("Grey")
          .setAuthor({ name: `${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
          .setTitle(`${ticketTypes[ticketType][0]} Ticket`)
          .setDescription(`Please do not ping support members, they have already been notified.\n\n**Reason:** \`\`\`${reasonInputValue}\`\`\``);

        const close = new discord.ButtonBuilder().setCustomId("close_ticket").setLabel("Close Ticket").setStyle(discord.ButtonStyle.Danger);

        const actionRow = new discord.ActionRowBuilder().addComponents(close);

        const ticketChannel = await interaction.guild.channels.create({
          name: `${ticketTypes[ticketType][1]}-${interaction.user.username}`,
          type: discord.ChannelType.GuildText,
          parent: jsondata.ticketCategory,
          permissionOverwrites: [
            {
              id: interaction.user.id,
              allow: [discord.PermissionFlagsBits.ViewChannel, discord.PermissionFlagsBits.SendMessages, discord.PermissionFlagsBits.ReadMessageHistory],
            },
            {
              id: interaction.guild.id,
              deny: [discord.PermissionFlagsBits.ViewChannel],
            },
            ...ticketRoles.map((role) => ({
              id: role,
              allow: [discord.PermissionFlagsBits.ViewChannel, discord.PermissionFlagsBits.SendMessages, discord.PermissionFlagsBits.ReadMessageHistory],
            })),
          ],
        });

        const ticketMessage = await ticketChannel.send({
          content: `<@${interaction.user.id}> ${ticketRoles.map((role) => `<@&${role}>`).join(" ")}`,
          embeds: [ticketEmbed],
          components: [actionRow],
        });
        await ticketMessage.pin();

        jsondata["openTickets"].push({
          ticketId: ticketChannel.id,
          ticketType: ticketType,
          ticketMessage: ticketMessage.id,
          ticketAuthor: interaction.user.id,
        });
        fs.writeFileSync("./tickets.json", JSON.stringify(jsondata, null, 2));

        await interaction.followUp({ content: `${checkEmoji} Successfully created ticket: <#${ticketChannel.id}>.`, components: [], embeds: [], flags: discord.MessageFlags.Ephemeral });
      } catch (modalError) {
        if (modalError.message.includes("time")) {
          await interaction.followUp({ content: `${errorEmoji} Modal timed out.`, components: [], embeds: [], flags: discord.MessageFlags.Ephemeral });
        } else {
          console.log(modalError);
        }
      }
    } else if (interaction.customId.startsWith("close_ticket")) {
      const ticket = jsondata["openTickets"].find((ticket) => ticket.ticketId === interaction.channel.id);
      if (ticket) {
        await interaction.deferReply({ ephemeral: true });
        interaction.deferred || interaction.replied ? await interaction.followUp({ content: `${loadingEmoji} Closing ticket...` }) : await interaction.reply({ content: `${loadingEmoji} Closing ticket...` });
        if (jsondata["transcriptType"] === "text_file") {
          let transcript = "";
          let lastId;
          let allMessages = [];

          while (true) {
            const options = { limit: 100 };
            if (lastId) {
              options.before = lastId;
            }

            const messages = await interaction.channel.messages.fetch(options);
            if (messages.size === 0) break;

            allMessages = allMessages.concat(Array.from(messages.values()));
            lastId = messages.last().id;
          }

          allMessages.reverse().forEach((message) => {
            transcript += `\n${message.author.username} (${message.author.id}): ${message.content}`;
          });

          const transcriptBuffer = Buffer.from(transcript, "utf-8");
          const transcriptAttachment = new discord.AttachmentBuilder(transcriptBuffer, { name: "ticket-transcript.txt" });

          await interaction.user.send({
            content: "Ticket closed - here is the transcript:",
            files: [transcriptAttachment],
          });
          const originalOpener = await client.users.fetch(ticket.ticketAuthor);
          if (originalOpener.id !== interaction.user.id) {
            await originalOpener.send({
              content: "Your ticket has been closed - here is the transcript:",
              files: [transcriptAttachment],
            });
          }
        } else {
          const originalOpener = await client.users.fetch(ticket.ticketAuthor);
          if (originalOpener.id !== interaction.user.id) {
            await originalOpener.send({ content: `Your ticket has been closed, the server has chosen to not store transcripts for tickets.\n-# This an issue? Ask an administrator to enable them in /config.` });
          } else {
            await interaction.user.send({ content: `Your ticket has been closed, the server has chosen to not store transcripts for tickets.\n-# This an issue? Ask an administrator to enable them in /config.` });
            await originalOpener.send({ content: `Your ticket has been closed, the server has chosen to not store transcripts for tickets.\n-# This an issue? Ask an administrator to enable them in /config.` });
          }
        }

        jsondata["openTickets"] = jsondata["openTickets"].filter((ticket) => ticket.ticketId !== interaction.channel.id);
        fs.writeFileSync("./tickets.json", JSON.stringify(jsondata, null, 2));
        await interaction.channel.delete();
      }
    }
  },
};
