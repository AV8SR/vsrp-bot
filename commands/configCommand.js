const { EmbedBuilder, MessageFlags, ActionRowBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const discord = require("discord.js");
const fs = require("fs");

let checkEmoji, errorEmoji, loadingEmoji, resetEmoji;

const createMainMenu = () => {
  const configEmbed = new EmbedBuilder().setTitle("Ticketing Configurator").setDescription("Use the select menu below to configure a specific component.").setFooter({ text: "This select menu will expire in 5 minutes." });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("config_select")
    .setPlaceholder("Select a component to configure")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel("Resend Embed").setDescription("Resend the ticketing embed.").setValue("resend_embed").setEmoji("📨"),
      new StringSelectMenuOptionBuilder().setLabel("Manage Administrators").setDescription("Add/remove administrators from the ticketing system.").setValue("manage_administrators").setEmoji("🔑"),
      new StringSelectMenuOptionBuilder().setLabel("Emojis").setDescription("Configure the emojis used in command responses.").setValue("emojis").setEmoji("😀"),
      new StringSelectMenuOptionBuilder().setLabel("Ticket Categories").setDescription("Configure the ticket categories where the tickets are made.").setValue("ticket_categories").setEmoji("📠"),
      new StringSelectMenuOptionBuilder().setLabel("Ticket Channel").setDescription("Configure the channel where the ticket embed is sent.").setValue("ticket_channel").setEmoji("📥"),
      new StringSelectMenuOptionBuilder().setLabel("Ticket Transcripts").setDescription("Configure the channel and format of the ticket transcripts.").setValue("ticket_transcripts").setEmoji("📑"),
      new StringSelectMenuOptionBuilder().setLabel("Ticket Roles").setDescription("Configure the people who can manage and respond to tickets (role-based).").setValue("ticket_roles").setEmoji("👥"),
      new StringSelectMenuOptionBuilder().setLabel("Ticket Statuses").setDescription("Configure the status for each ticket type.").setValue("ticket_statuses").setEmoji("🔒")
    );

  const actionRow = new ActionRowBuilder().addComponents(selectMenu);

  return { configEmbed, actionRow };
};

const createEmojiMenu = () => {
  const emojisEmbed = new EmbedBuilder()
    .setTitle("Emoji Editor")
    .setDescription("Use the buttons below to configure the emojis used in command responses.")
    .addFields({
      name: "Staged Changes",
      value: "No changes have been made yet.",
    })
    .setTimestamp();

  const confirm = new ButtonBuilder().setCustomId("emojis_confirm").setLabel("✔").setStyle(ButtonStyle.Success);

  const back = new ButtonBuilder().setCustomId("back_to_main").setLabel("⟵").setStyle(ButtonStyle.Secondary);

  const cancel = new ButtonBuilder().setCustomId("emojis_cancel").setLabel("✖").setStyle(ButtonStyle.Danger);

  const primaryActionRow = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId("emoji_select_change").setPlaceholder("Choose the emoji to change.").setMinValues(1).setMaxValues(1).addOptions(new StringSelectMenuOptionBuilder().setLabel("Success").setDescription("Change the success emoji.").setValue("success").setEmoji(checkEmoji), new StringSelectMenuOptionBuilder().setLabel("Error").setDescription("Change the error emoji.").setValue("error").setEmoji(errorEmoji), new StringSelectMenuOptionBuilder().setLabel("Loading").setDescription("Change the loading emoji.").setValue("loading").setEmoji(loadingEmoji), new StringSelectMenuOptionBuilder().setLabel("Reset").setDescription("Reset emojis to the defaults.").setValue("reset").setEmoji(resetEmoji)));

  const actionRow = new ActionRowBuilder().addComponents(back, confirm, cancel);

  return { emojisEmbed, primaryActionRow, actionRow };
};

const handleMainMenu = async (interaction, message, collector = null) => {
  const { configEmbed, actionRow } = createMainMenu();
  if (collector) {
    await collector.update({ embeds: [configEmbed], components: [actionRow], content: "" });
  } else {
    await interaction.editReply({ embeds: [configEmbed], components: [actionRow], content: "" });
  }

  try {
    while (true) {
      const collector = await message.awaitMessageComponent({
        filter: (i) => i.user.id === interaction.user.id,
        time: 300_000,
      });
      if (collector.values[0] === "emojis") {
        await handleEmojiMenu(interaction, message, collector);
        break;
      } else if (collector.values[0] === "resend_embed") {
        const jsondata = JSON.parse(fs.readFileSync("./tickets.json", "utf8"));
        const bannerEmbed = new discord.EmbedBuilder().setColor("Grey").setImage("https://i.imgur.com/MTDRpyV.png");

        const embed = new discord.EmbedBuilder().setTitle("Support Center").setDescription("Use the select menu to choose the appropriate type of ticket to enter. Some information to guide you can be found below.").addFields({ name: "<:kaesupport:1373578230535028756> General Support", value: "- General inquiries\n- Rule clarifications\n- Race descriptions\n- Suggestions" }, { name: "<:kaeinternal:1373578216379383829> Internal Affairs", value: "- Staff complaints\n- Member complaints\n- Appealing infractions" }, { name: "<:kaedirective:1373578245236064276> Directive", value: "- Internal Affairs+ complaints\n- Internal Affairs+ appeals\n- Claiming prizes\n- Partnership Request" }).setColor("Grey").setFooter({ text: "Support Center" }).setImage("https://i.imgur.com/Zz9x9jl.png");

        const ticketTypeSelect = new discord.StringSelectMenuBuilder().setCustomId("ticket_type_select").setPlaceholder("Select a ticket type.").setMinValues(1).setMaxValues(1).addOptions(new discord.StringSelectMenuOptionBuilder().setLabel("General Support").setDescription("General inquiries.").setValue("ticket-support").setEmoji("<:kaesupport:1373578230535028756>"), new discord.StringSelectMenuOptionBuilder().setLabel("Internal Affairs").setDescription("Staff complaints.").setValue("ticket-internalAffairs").setEmoji("<:kaeinternal:1373578216379383829>"), new discord.StringSelectMenuOptionBuilder().setLabel("Directive").setDescription("Contacting the directive team.").setValue("ticket-directive").setEmoji("<:kaedirective:1373578245236064276>"));

        const actionRow = new discord.ActionRowBuilder().addComponents(ticketTypeSelect);

        let ticketChannel = jsondata.ticketChannel;
        ticketChannel = interaction.guild.channels.cache.get(ticketChannel);
        await ticketChannel.send({ embeds: [bannerEmbed, embed], components: [actionRow] });
        await interaction.followUp({ content: `${checkEmoji} Successfully resent the ticketing embed.`, components: [], embeds: [], flags: MessageFlags.Ephemeral });
        await handleMainMenu(interaction, message, collector);
      } else if (collector.values[0] === "manage_administrators") {
        const jsondata = JSON.parse(fs.readFileSync("./tickets.json", "utf8"));
        const currAdmins = jsondata.administrators;
        const newAdminList = [];
        const newAdminEmbed = new EmbedBuilder()
          .setTitle("Manage Administrators")
          .setDescription("Use the buttons below to manage the administrators for the ticketing system.\n\nAdministrators are people who can use the `/config` command (the guild owner is automatically an administrator and cannot be removed).")
          .addFields({ name: "Current Administrators", value: currAdmins.length > 0 ? currAdmins.map((admin) => `<@&${admin}>`).join("\n") : "No administrators found." })
          .setTimestamp();

        const confirm = new ButtonBuilder().setCustomId("manage_administrators_confirm").setLabel("✔").setStyle(ButtonStyle.Success);

        const back = new ButtonBuilder().setCustomId("back_to_main").setLabel("⟵").setStyle(ButtonStyle.Secondary);

        const cancel = new ButtonBuilder().setCustomId("manage_administrators_cancel").setLabel("✖").setStyle(ButtonStyle.Danger);

        const actionRow = new ActionRowBuilder().addComponents(back, confirm, cancel);

        const adminSelect = new discord.UserSelectMenuBuilder().setCustomId("manage_administrators_select").setPlaceholder("Edit the list of administrators.").setMinValues(0).setDefaultUsers(currAdmins).setMaxValues(10);

        const adminActionRow = new ActionRowBuilder().addComponents(adminSelect);

        await collector.update({ embeds: [newAdminEmbed], components: [adminActionRow, actionRow], content: "" });

        while (true) {
          const newCollector = await message.awaitMessageComponent({
            filter: (i) => i.user.id === interaction.user.id,
            time: 300_000,
          });

          if (newCollector.customId === "manage_administrators_confirm") {
            jsondata.administrators = newAdminList;
            fs.writeFileSync("./tickets.json", JSON.stringify(jsondata, null, 2));
            await interaction.followUp({ content: `${checkEmoji} Successfully updated the list of administrators.`, components: [], embeds: [], flags: MessageFlags.Ephemeral });
            await handleMainMenu(interaction, message, newCollector);
            break;
          } else if (newCollector.customId === "manage_administrators_cancel") {
            await interaction.followUp({ content: `${checkEmoji} Administrator management cancelled.`, components: [], embeds: [], flags: MessageFlags.Ephemeral });
            await handleMainMenu(interaction, message, newCollector);
            break;
          } else if (newCollector.customId === "back_to_main") {
            await handleMainMenu(interaction, message, newCollector);
            break;
          } else if (newCollector.customId === "manage_administrators_select") {
            newAdminList.push(...newCollector.values);
            await newCollector.update({ embeds: [newAdminEmbed], components: [adminActionRow, actionRow], content: "" });
          }
        }
      } else if (collector.values[0] === "ticket_categories") {
        const jsondata = JSON.parse(fs.readFileSync("./tickets.json", "utf8"));
        const categoryChanges = [];
        const currCategory = jsondata.ticketCategory;
        const newCategoryEmbed = new EmbedBuilder()
          .setTitle("Ticket Categories")
          .setDescription(`Use the buttons below to configure the ticket categories.\n\nThe current category is: ${currCategory === "Unset" ? "**unset**" : `<#${currCategory}>`}`)
          .addFields({ name: "What is the category for?", value: "This is where the ticket channels are placed in your server." }, { name: "Staged Changes", value: "No changes have been made yet." })
          .setTimestamp();

        const confirm = new ButtonBuilder().setCustomId("ticket_categories_confirm").setLabel("✔").setStyle(ButtonStyle.Success);

        const back = new ButtonBuilder().setCustomId("back_to_main").setLabel("⟵").setStyle(ButtonStyle.Secondary);

        const cancel = new ButtonBuilder().setCustomId("ticket_categories_cancel").setLabel("✖").setStyle(ButtonStyle.Danger);

        const actionRow = new ActionRowBuilder().addComponents(back, confirm, cancel);

        const categorySelect = new discord.ChannelSelectMenuBuilder().setCustomId("ticket_categories_select").setPlaceholder("Select a category to configure.").setMinValues(1).setMaxValues(1).setChannelTypes(discord.ChannelType.GuildCategory);

        const categoryActionRow = new ActionRowBuilder().addComponents(categorySelect);

        await collector.update({ embeds: [newCategoryEmbed], components: [categoryActionRow, actionRow], content: "" });

        while (true) {
          const newCollector = await message.awaitMessageComponent({
            filter: (i) => i.user.id === interaction.user.id,
            time: 300_000,
          });

          if (newCollector.customId === "ticket_categories_confirm") {
            if (categoryChanges.length < 1) {
              return await newCollector.update({ content: `${errorEmoji} No category changes were found.`, components: [], embeds: [] });
            }

            for (const categoryChange of categoryChanges) {
              jsondata[categoryChange.key] = categoryChange.value;
            }

            fs.writeFileSync("./tickets.json", JSON.stringify(jsondata, null, 2));
            await interaction.followUp({ content: `${checkEmoji} Successfully updated the ticket categories.`, components: [], embeds: [], flags: MessageFlags.Ephemeral });
            await handleMainMenu(interaction, message, newCollector);
            break;
          } else if (newCollector.customId === "ticket_categories_cancel") {
            await interaction.followUp({ content: `${checkEmoji} Ticket categories update cancelled.`, components: [], embeds: [], flags: MessageFlags.Ephemeral });
            await handleMainMenu(interaction, message, newCollector);
            break;
          } else if (newCollector.customId === "back_to_main") {
            await handleMainMenu(interaction, message, newCollector);
            break;
          } else if (newCollector.customId === "ticket_categories_select") {
            const categorySelect = newCollector.values[0];
            categoryChanges.push({
              key: "ticketCategory",
              value: categorySelect,
            });

            if (newCategoryEmbed.data.fields[1].value === "No changes have been made yet.") {
              newCategoryEmbed.data.fields[1].value = `<#${currCategory}> ⟶ <#${categorySelect}>`;
            } else {
              newCategoryEmbed.data.fields[1].value += `\n<#${categoryChanges[categoryChanges.length - 2].value}> ⟶ <#${categorySelect}>`;
            }
            await newCollector.update({ embeds: [newCategoryEmbed], components: [categoryActionRow, actionRow], content: "" });
          }
        }
      } else if (collector.values[0] === "ticket_channel") {
        const jsondata = JSON.parse(fs.readFileSync("./tickets.json", "utf8"));
        const channelChanges = [];
        const currChannel = jsondata.ticketChannel;
        const newChannelEmbed = new EmbedBuilder()
          .setTitle("Ticket Channel")
          .setDescription(`Use the buttons below to configure the ticket channel.\n\nThe current channel is: ${currChannel === "Unset" ? "**unset**" : `<#${currChannel}>`}`)
          .addFields({ name: "What is the channel for?", value: "This is where the ticket embed is sent." }, { name: "Staged Changes", value: "No changes have been made yet." })
          .setTimestamp();

        const confirm = new ButtonBuilder().setCustomId("ticket_channel_confirm").setLabel("✔").setStyle(ButtonStyle.Success);

        const back = new ButtonBuilder().setCustomId("back_to_main").setLabel("⟵").setStyle(ButtonStyle.Secondary);

        const cancel = new ButtonBuilder().setCustomId("ticket_channel_cancel").setLabel("✖").setStyle(ButtonStyle.Danger);

        const actionRow = new ActionRowBuilder().addComponents(back, confirm, cancel);

        const channelSelect = new discord.ChannelSelectMenuBuilder().setCustomId("ticket_channel_select").setPlaceholder("Select a channel to configure.").setChannelTypes(discord.ChannelType.GuildText);
        const channelActionRow = new ActionRowBuilder().addComponents(channelSelect);

        await collector.update({ embeds: [newChannelEmbed], components: [channelActionRow, actionRow], content: "" });

        while (true) {
          const newCollector = await message.awaitMessageComponent({
            filter: (i) => i.user.id === interaction.user.id,
            time: 300_000,
          });

          if (newCollector.customId === "ticket_channel_confirm") {
            if (channelChanges.length < 1) {
              return await newCollector.update({ content: `${errorEmoji} No channel changes were found.`, components: [], embeds: [] });
            }

            for (const channelChange of channelChanges) {
              jsondata[channelChange.key] = channelChange.value;
            }

            fs.writeFileSync("./tickets.json", JSON.stringify(jsondata, null, 2));
            await interaction.followUp({ content: `${checkEmoji} Successfully updated the ticket channel.`, components: [], embeds: [], flags: MessageFlags.Ephemeral });
            await handleMainMenu(interaction, message, newCollector);
            break;
          } else if (newCollector.customId === "ticket_channel_cancel") {
            await interaction.followUp({ content: `${checkEmoji} Ticket channel update cancelled.`, components: [], embeds: [], flags: MessageFlags.Ephemeral });
            await handleMainMenu(interaction, message, newCollector);
            break;
          } else if (newCollector.customId === "back_to_main") {
            await handleMainMenu(interaction, message, newCollector);
            break;
          } else if (newCollector.customId === "ticket_channel_select") {
            const channelSelect = newCollector.values[0];
            channelChanges.push({
              key: "ticketChannel",
              value: channelSelect,
            });

            if (newChannelEmbed.data.fields[1].value === "No changes have been made yet.") {
              newChannelEmbed.data.fields[1].value = `<#${currChannel}> ⟶ <#${channelSelect}>`;
            } else {
              newChannelEmbed.data.fields[1].value += `\n<#${channelChanges[channelChanges.length - 2].value}> ⟶ <#${channelSelect}>`;
            }
            await newCollector.update({ embeds: [newChannelEmbed], components: [channelActionRow, actionRow], content: "" });
          }
        }
      } else if (collector.values[0] === "ticket_transcripts") {
        const jsondata = JSON.parse(fs.readFileSync("./tickets.json", "utf8"));
        const transcriptChanges = [];
        const currTranscriptType = jsondata.transcriptType;
        const newTranscriptTypeEmbed = new EmbedBuilder()
          .setTitle("Ticket Transcripts")
          .setDescription(`Use the buttons below to configure how the transcripts are made.\n\nThe current transcript type is: ${currTranscriptType === "Unset" ? "**unset**" : currTranscriptType}`)
          .addFields({ name: "What is the transcript type for?", value: "This is the type of transcript that is sent to the channel. See FAQ for more information." }, { name: "Staged Changes", value: "No changes have been made yet." })
          .setTimestamp();

        const confirm = new ButtonBuilder().setCustomId("ticket_transcripts_confirm").setLabel("✔").setStyle(ButtonStyle.Success);

        const back = new ButtonBuilder().setCustomId("back_to_main").setLabel("⟵").setStyle(ButtonStyle.Secondary);

        const cancel = new ButtonBuilder().setCustomId("ticket_transcripts_cancel").setLabel("✖").setStyle(ButtonStyle.Danger);

        const actionRow = new ActionRowBuilder().addComponents(back, confirm, cancel);

        const transcriptTypeSelect = new StringSelectMenuBuilder().setCustomId("ticket_transcripts_select").setPlaceholder("Select a transcript type.").setMinValues(1).setMaxValues(1).addOptions(new StringSelectMenuOptionBuilder().setLabel("Text File").setDescription("A text file will be sent to the channel.").setValue("text_file").setEmoji("📄"), new StringSelectMenuOptionBuilder().setLabel("Website").setDescription("HTML code for a website will be uploaded to github and available to visit at a URL.").setValue("website").setEmoji("🌐"), new StringSelectMenuOptionBuilder().setLabel("None").setDescription("No transcripts will be made.").setValue("none").setEmoji("❌"));

        const transcriptTypeActionRow = new ActionRowBuilder().addComponents(transcriptTypeSelect);

        await collector.update({ embeds: [newTranscriptTypeEmbed], components: [transcriptTypeActionRow, actionRow], content: "" });

        while (true) {
          const newCollector = await message.awaitMessageComponent({
            filter: (i) => i.user.id === interaction.user.id,
            time: 300_000,
          });

          if (newCollector.customId === "ticket_transcripts_confirm") {
            if (transcriptChanges.length < 1) {
              return await newCollector.update({ content: `${errorEmoji} No transcript type changes were found.`, components: [], embeds: [] });
            }

            for (const transcriptChange of transcriptChanges) {
              jsondata[transcriptChange.key] = transcriptChange.value;
            }

            fs.writeFileSync("./tickets.json", JSON.stringify(jsondata, null, 2));
            await interaction.followUp({ content: `${checkEmoji} Successfully updated the transcript type.`, components: [], embeds: [], flags: MessageFlags.Ephemeral });
            await handleMainMenu(interaction, message, newCollector);
            break;
          } else if (newCollector.customId === "ticket_transcripts_cancel") {
            await interaction.followUp({ content: `${checkEmoji} Ticket transcript type update cancelled.`, components: [], embeds: [], flags: MessageFlags.Ephemeral });
            await handleMainMenu(interaction, message, newCollector);
            break;
          } else if (newCollector.customId === "back_to_main") {
            await handleMainMenu(interaction, message, newCollector);
            break;
          } else if (newCollector.customId === "ticket_transcripts_select") {
            if (newCollector.values[0] === "website") {
              await interaction.followUp({ content: `${errorEmoji} This option is currently unavailable.`, components: [], embeds: [], flags: MessageFlags.Ephemeral });
              await handleMainMenu(interaction, message, newCollector);
              break;
            }
            const transcriptTypeSelect = newCollector.values[0];
            transcriptChanges.push({
              key: "transcriptType",
              value: transcriptTypeSelect,
            });

            if (newTranscriptTypeEmbed.data.fields[1].value === "No changes have been made yet.") {
              newTranscriptTypeEmbed.data.fields[1].value = `${currTranscriptType} ⟶ ${transcriptTypeSelect}`;
            } else {
              newTranscriptTypeEmbed.data.fields[1].value += `\n${currTranscriptType} ⟶ ${transcriptTypeSelect}`;
            }
            await newCollector.update({ embeds: [newTranscriptTypeEmbed], components: [transcriptTypeActionRow, actionRow], content: "" });
          }
        }
      } else if (collector.values[0] === "ticket_roles") {
        const jsondata = JSON.parse(fs.readFileSync("./tickets.json", "utf8"));
        const roleChanges = {
          support: {
            added: [],
            removed: [],
          },
          internalAffairs: {
            added: [],
            removed: [],
          },
          directive: {
            added: [],
            removed: [],
          },
        };
        const currRoles = jsondata.ticketRoles;
        const newRolesEmbed = new EmbedBuilder()
          .setTitle("Ticket Roles")
          .setDescription(`Use the buttons below to configure the ticket roles.\n\nThe current roles are:\n- Support: ${jsondata.responseRoles.support.length > 0 ? jsondata.responseRoles.support.map((role) => `<@&${role}>`).join(", ") : "no roles found"}.\n- Internal Affairs: ${jsondata.responseRoles.internalAffairs.length > 0 ? jsondata.responseRoles.internalAffairs.map((role) => `<@&${role}>`).join(", ") : "no roles found"}.\n- Directive: ${jsondata.responseRoles.directive.length > 0 ? jsondata.responseRoles.directive.map((role) => `<@&${role}>`).join(", ") : "no roles found"}.`)
          .addFields({ name: "What are these roles for?", value: "This are the roles that will be able to see and respond to the ticket." }, { name: "Staged Changes", value: "No changes have been made yet." });

        const selectRoleGroup = new discord.StringSelectMenuBuilder().setCustomId("ticket_roles_select").setPlaceholder("Select the role group to configure.").setMinValues(1).setMaxValues(1).addOptions(new discord.StringSelectMenuOptionBuilder().setLabel("Support").setDescription("Roles to respond to support tickets.").setValue("support").setEmoji("<:kaesupport:1373578230535028756>"), new discord.StringSelectMenuOptionBuilder().setLabel("Internal Affairs").setDescription("Roles to respond to internal affairs tickets.").setValue("internalAffairs").setEmoji("<:kaeinternal:1373578216379383829>"), new discord.StringSelectMenuOptionBuilder().setLabel("Directive").setDescription("Roles to respond to directive tickets.").setValue("directive").setEmoji("<:kaedirective:1373578245236064276>"));

        const back = new ButtonBuilder().setCustomId("back_to_main").setLabel("⟵").setStyle(ButtonStyle.Secondary);

        const selectRoleActionRow = new ActionRowBuilder().addComponents(selectRoleGroup);

        const actionRow = new ActionRowBuilder().addComponents(back);

        await collector.update({ embeds: [newRolesEmbed], components: [selectRoleActionRow, actionRow], content: "" });

        while (true) {
          const groupTypeCollector = await message.awaitMessageComponent({
            filter: (i) => i.user.id === interaction.user.id,
            time: 300_000,
          });

          if (groupTypeCollector.customId === "ticket_roles_select") {
            listOfCurrRoles = jsondata.responseRoles[groupTypeCollector.values[0]];
            const addRolesSelect = new discord.RoleSelectMenuBuilder()
              .setCustomId("ticket_roles_add")
              .setPlaceholder("Select the roles to add.")
              .setMinValues(1)
              .setMaxValues(interaction.guild.roles.cache.size - 1);

            let removeRolesSelect;

            if (listOfCurrRoles && listOfCurrRoles.length > 0) {
              removeRolesSelect = new discord.RoleSelectMenuBuilder().setCustomId("ticket_roles_remove").setPlaceholder("Select the roles to remove.").setMinValues(1).setMaxValues(listOfCurrRoles.length);
            } else {
              removeRolesSelect = new discord.RoleSelectMenuBuilder().setCustomId("ticket_roles_remove").setPlaceholder("No roles available.").setMinValues(1).setMaxValues(1).setDisabled(true);
            }

            const back = new ButtonBuilder().setCustomId("back_to_main").setLabel("⟵").setStyle(ButtonStyle.Secondary);

            const confirm = new ButtonBuilder().setCustomId("confirm_role_changes").setLabel("✔").setStyle(ButtonStyle.Success);

            const cancel = new ButtonBuilder().setCustomId("cancel_role_changes").setLabel("✖").setStyle(ButtonStyle.Danger);

            const addSelectRow = new ActionRowBuilder().addComponents(addRolesSelect);

            const removeSelectRow = new ActionRowBuilder().addComponents(removeRolesSelect);

            const actionRow = new ActionRowBuilder().addComponents(back, confirm, cancel);

            await groupTypeCollector.update({ embeds: [newRolesEmbed], components: [addSelectRow, removeSelectRow, actionRow], content: "" });

            while (true) {
              const newCollector = await message.awaitMessageComponent({
                filter: (i) => i.user.id === interaction.user.id,
                time: 300_000,
              });

              if (newCollector.customId === "ticket_roles_add") {
                newCollector.values.map((role) => roleChanges[groupTypeCollector.values[0]]["added"].push(role));
                newRolesEmbed.data.fields[1].value = `Added ${newCollector.values.map((role) => `<@&${role}>`).join(", ")} to the ${groupTypeCollector.values[0]} role group.`;
                await newCollector.update({ embeds: [newRolesEmbed], components: [addSelectRow, removeSelectRow, actionRow], content: "" });
              } else if (newCollector.customId === "ticket_roles_remove") {
                newCollector.values.map((role) => roleChanges[groupTypeCollector.values[0]].removed.push(role));
                newRolesEmbed.data.fields[1].value = `Removed ${newCollector.values.map((role) => `<@&${role}>`).join(", ")} from the ${groupTypeCollector.values[0]} role group.`;
                await newCollector.update({ embeds: [newRolesEmbed], components: [addSelectRow, removeSelectRow, actionRow], content: "" });
              } else if (newCollector.customId === "back_to_main") {
                await handleMainMenu(interaction, message, newCollector);
                break;
              } else if (newCollector.customId === "confirm_role_changes") {
                let rolesAlreadyInList = [];
                let rolesNotInList = [];
                let allEmpty = true;
                if (roleChanges[groupTypeCollector.values[0]].added.length > 0 || roleChanges[groupTypeCollector.values[0]].removed.length > 0) {
                  allEmpty = false;
                }
                if (allEmpty) {
                  if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: `${errorEmoji} No role changes found.`, flags: MessageFlags.Ephemeral });
                  } else {
                    await interaction.reply({ content: `${errorEmoji} No role changes found.` });
                  }
                  await handleMainMenu(interaction, message, newCollector);
                  break;
                } else {
                  if (roleChanges[groupTypeCollector.values[0]].added.length > 0) {
                    jsondata.responseRoles[groupTypeCollector.values[0]].push(...roleChanges[groupTypeCollector.values[0]].added);
                  }
                  if (roleChanges[groupTypeCollector.values[0]].removed.length > 0) {
                    rolesAlreadyInList = jsondata.responseRoles[groupTypeCollector.values[0]].filter((role) => roleChanges[groupTypeCollector.values[0]].removed.includes(role));
                    rolesNotInList = roleChanges[groupTypeCollector.values[0]].removed.filter((role) => !jsondata.responseRoles[groupTypeCollector.values[0]].includes(role));
                    if (interaction.deferred || interaction.replied) {
                      await interaction.followUp({ content: `${errorEmoji} The following roles were not found in the ${groupTypeCollector.values[0]} role group: ${rolesNotInList.map((role) => `<@&${role}>`).join(", ")}.`, flags: MessageFlags.Ephemeral });
                    } else {
                      await interaction.reply({ content: `${errorEmoji} The following roles were not found in the ${groupTypeCollector.values[0]} role group: ${rolesNotInList.map((role) => `<@&${role}>`).join(", ")}.` });
                    }
                    jsondata.responseRoles[groupTypeCollector.values[0]] = jsondata.responseRoles[groupTypeCollector.values[0]].filter((role) => !rolesAlreadyInList.includes(role));
                  }
                }

                fs.writeFileSync("./tickets.json", JSON.stringify(jsondata, null, 2));
                if (interaction.deferred || interaction.replied) {
                  await interaction.followUp({ content: `${checkEmoji} Successfully updated the role groups.\n\nChanges: \n- Roles added: ${roleChanges[groupTypeCollector.values[0]].added.length > 0 ? roleChanges[groupTypeCollector.values[0]].added.map((role) => `<@&${role}>`).join(", ") : "none changed."}\n- Roles removed: ${rolesAlreadyInList.length > 0 ? rolesAlreadyInList.map((role) => `<@&${role}>`).join(", ") : "none changed."}`, flags: MessageFlags.Ephemeral });
                } else {
                  await interaction.reply({ content: `${checkEmoji} Successfully updated the role groups.\n\nChanges: \n- Roles added: ${roleChanges[groupTypeCollector.values[0]].added.length > 0 ? roleChanges[groupTypeCollector.values[0]].added.map((role) => `<@&${role}>`).join(", ") : "none changed."}\n- Roles removed: ${rolesAlreadyInList.length > 0 ? rolesAlreadyInList.map((role) => `<@&${role}>`).join(", ") : "none changed."}` });
                }
                await handleMainMenu(interaction, message, newCollector);
                break;
              } else if (newCollector.customId === "cancel_role_changes") {
                if (interaction.replied || interaction.deferred) {
                  await interaction.followUp({ content: `${checkEmoji} Role changes cancelled.`, flags: MessageFlags.Ephemeral });
                } else {
                  await interaction.reply({ content: `${checkEmoji} Role changes cancelled.` });
                }
                await handleMainMenu(interaction, message, newCollector);
                break;
              }
            }
          } else if (groupTypeCollector.customId === "back_to_main") {
            await handleMainMenu(interaction, message, groupTypeCollector);
            break;
          }
        }
      } else if (collector.values[0] === "ticket_statuses") {
        const jsondata = JSON.parse(fs.readFileSync("./tickets.json", "utf8"));
        const statusChanges = [];
        const currStatuses = jsondata.ticketStatuses;
        const newStatusEmbed = new EmbedBuilder()
          .setTitle("Ticket Statuses")
          .setDescription(`Use the select menu below to toggle the ticket statuses.\n\nThe current statuses are:\n- Support: ${currStatuses.support ? "Enabled" : "Disabled"}.\n- Internal Affairs: ${currStatuses.internalAffairs ? "Enabled" : "Disabled"}.\n- Directive: ${currStatuses.directive ? "Enabled" : "Disabled"}.`)
          .addFields({ name: "What are these statuses for?", value: "This will be able to prevent and allow users to create tickets of a certain type." }, { name: "Staged Changes", value: "No changes have been made yet." });

        const selectStatusGroup = new discord.StringSelectMenuBuilder().setCustomId("ticket_statuses_select").setPlaceholder("Select the status group to configure.").setMinValues(1).setMaxValues(1).addOptions(new discord.StringSelectMenuOptionBuilder().setLabel("Support").setDescription("Toggle the support ticket status.").setValue("support").setEmoji("<:kaesupport:1373578230535028756>"), new discord.StringSelectMenuOptionBuilder().setLabel("Internal Affairs").setDescription("Toggle the internal affairs ticket status.").setValue("internalAffairs").setEmoji("<:kaeinternal:1373578216379383829>"), new discord.StringSelectMenuOptionBuilder().setLabel("Directive").setDescription("Toggle the directive ticket status.").setValue("directive").setEmoji("<:kaedirective:1373578245236064276>"));

        const back = new ButtonBuilder().setCustomId("back_to_main").setLabel("⟵").setStyle(ButtonStyle.Secondary);

        const confirm = new ButtonBuilder().setCustomId("confirm_status_changes").setLabel("✔").setStyle(ButtonStyle.Success);

        const cancel = new ButtonBuilder().setCustomId("cancel_status_changes").setLabel("✖").setStyle(ButtonStyle.Danger);

        const actionRow = new ActionRowBuilder().addComponents(back, confirm, cancel);

        const statusSelectRow = new ActionRowBuilder().addComponents(selectStatusGroup);

        await collector.update({ embeds: [newStatusEmbed], components: [statusSelectRow, actionRow], content: "" });

        while (true) {
          const newCollector = await message.awaitMessageComponent({
            filter: (i) => i.user.id === interaction.user.id,
            time: 300_000,
          });

          if (newCollector.customId === "ticket_statuses_select") {
            if (Object.keys(statusChanges).includes(newCollector.values[0])) {
              await interaction.followUp({ content: `${errorEmoji} This status is already being changed - cancel and redo if you don't want it changed.`, flags: MessageFlags.Ephemeral });
            } else {
              statusChanges[newCollector.values[0]] = !currStatuses[newCollector.values[0]];
              if (newStatusEmbed.data.fields[1].value === "No changes have been made yet.") {
                newStatusEmbed.data.fields[1].value = "";
              }
              newStatusEmbed.data.fields[1].value += `\n- ${newCollector.values[0]}: ${statusChanges[newCollector.values[0]] ? "Enabled" : "Disabled"}.`;
              await newCollector.update({ embeds: [newStatusEmbed], components: [statusSelectRow, actionRow], content: "" });
            }
          } else if (newCollector.customId === "back_to_main") {
            await handleMainMenu(interaction, message, newCollector);
            break;
          } else if (newCollector.customId === "confirm_status_changes") {
            if (statusChanges.support === undefined && statusChanges.internalAffairs === undefined && statusChanges.directive === undefined) {
              await interaction.followUp({ content: `${errorEmoji} No status changes were found.`, flags: MessageFlags.Ephemeral });
              await handleMainMenu(interaction, message, newCollector);
              break;
            } else {
              for (const change of Object.keys(statusChanges)) {
                jsondata.ticketStatuses[change] = statusChanges[change];
              }

              fs.writeFileSync("./tickets.json", JSON.stringify(jsondata, null, 2));
              await interaction.followUp({ content: `${checkEmoji} Successfully updated the ticket statuses.`, flags: MessageFlags.Ephemeral });
              await handleMainMenu(interaction, message, newCollector);
              break;
            }
          } else if (newCollector.customId === "cancel_status_changes") {
            await interaction.followUp({ content: `${checkEmoji} Status changes cancelled.`, flags: MessageFlags.Ephemeral });
            await handleMainMenu(interaction, message, newCollector);
            break;
          }
        }
      } else {
        await interaction.editReply({
          content: `${errorEmoji} Invalid option selected. Please try again.`,
          components: [],
          embeds: [],
        });
      }
    }
  } catch (error) {
    console.log(error);
    if (error.message.includes("time")) {
      return await interaction.editReply({
        content: `${errorEmoji} The interaction timed out.`,
        components: [],
        embeds: [],
      });
    }

    await interaction.editReply({
      content: `${errorEmoji} ${error}.`,
      components: [],
      embeds: [],
    });
  }
};

const handleEmojiMenu = async (interaction, message, collector) => {
  const { emojisEmbed, primaryActionRow, actionRow } = createEmojiMenu();
  const jsondata = JSON.parse(fs.readFileSync("./tickets.json", "utf8"));
  const emojiChanges = [];
  const emojiMatching = {
    success: jsondata.emojis.customs.success || jsondata.emojis.defaults.checkEmoji,
    error: jsondata.emojis.customs.error || jsondata.emojis.defaults.errorEmoji,
    loading: jsondata.emojis.customs.loading || jsondata.emojis.defaults.loadingEmoji,
    reset: jsondata.emojis.defaults.resetEmoji,
  };
  await collector.update({ embeds: [emojisEmbed], components: [primaryActionRow, actionRow], content: "" });

  try {
    while (true) {
      const newCollector = await message.awaitMessageComponent({
        filter: (i) => i.user.id === interaction.user.id,
        time: 300_000,
      });

      if (newCollector.customId === "emojis_confirm") {
        if (emojiChanges.length < 1) {
          return await newCollector.update({ content: `${errorEmoji} No emoji changes were found.`, components: [], embeds: [] });
        }
        for (const emojiChange of emojiChanges) {
          jsondata.emojis.customs[emojiChange.key] = emojiChange.value;
        }

        fs.writeFileSync("./tickets.json", JSON.stringify(jsondata, null, 2));
        await interaction.followUp({ content: `${checkEmoji} Successfully updated the emojis.\n-# You will need to rerun the command for the changes to take effect.`, components: [], embeds: [], flags: MessageFlags.Ephemeral });
        await handleMainMenu(interaction, message, newCollector);
        break;
      } else if (newCollector.customId === "emojis_cancel") {
        await interaction.followUp({ content: `${checkEmoji} Emojis update cancelled.`, components: [], embeds: [], flags: MessageFlags.Ephemeral });
        await handleMainMenu(interaction, message, newCollector);
        break;
      } else if (newCollector.customId === "back_to_main") {
        await handleMainMenu(interaction, message, newCollector);
        break;
      } else if (newCollector.customId === "emoji_select_change") {
        if (newCollector.values[0] === "reset") {
          jsondata.emojis.customs = {};
          fs.writeFileSync("./tickets.json", JSON.stringify(jsondata, null, 2));

          return await newCollector.update({ content: `${checkEmoji} Emojis reset to defaults.`, components: [], embeds: [] });
        }
        const emojiChangeChoice = newCollector.values[0];
        const modal = new discord.ModalBuilder().setCustomId("emoji_change").setTitle(`${emojiChangeChoice} Emoji Change`);

        const emojiInput = new discord.TextInputBuilder().setCustomId("emoji_input").setLabel("New emoji:").setPlaceholder("Symbol or discord emoji (e.g. <:emoji:12345>)").setStyle(discord.TextInputStyle.Short);

        modal.addComponents(new ActionRowBuilder().addComponents(emojiInput));

        await newCollector.showModal(modal);

        try {
          const modalResponse = await newCollector.awaitModalSubmit({ time: 300_000 });
          const emojiInputValue = modalResponse.fields.getTextInputValue("emoji_input");

          emojiChanges.push({
            key: emojiChangeChoice,
            value: emojiInputValue,
          });

          if (emojisEmbed.data.fields[0].value === "No changes have been made yet.") {
            emojisEmbed.data.fields[0].value = "";
          }
          emojisEmbed.data.fields[0].value += `\n${emojiMatching[emojiChangeChoice]} ⟶ ${emojiInputValue}`;
          await modalResponse.update({
            components: [primaryActionRow, actionRow],
            embeds: [emojisEmbed],
          });
        } catch (modalError) {
          if (modalError.message.includes("time")) {
            await newCollector.update({
              content: `${errorEmoji} Modal timed out. Please try again.`,
              components: [primaryActionRow, actionRow],
              embeds: [emojisEmbed],
            });
          } else {
            console.log(modalError);
            await newCollector.update({
              content: `${errorEmoji} An error occurred while processing the emoji change.`,
              components: [primaryActionRow, actionRow],
              embeds: [emojisEmbed],
            });
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
    if (error.message.includes("time")) {
      return await interaction.editReply({
        content: `${errorEmoji} The interaction timed out.`,
        components: [],
        embeds: [],
      });
    }

    await interaction.editReply({
      content: `${errorEmoji} ${error}.`,
      components: [],
      embeds: [],
    });
  }
};

module.exports = {
  data: new SlashCommandBuilder().setName("config").setDescription("Configure the ticketing system."),

  async execute(interaction) {
    const jsondata = JSON.parse(fs.readFileSync("./tickets.json", "utf8"));

    checkEmoji = jsondata.emojis.customs.success || jsondata.emojis.defaults.checkEmoji;
    errorEmoji = jsondata.emojis.customs.error || jsondata.emojis.defaults.errorEmoji;
    loadingEmoji = jsondata.emojis.customs.loading || jsondata.emojis.defaults.loadingEmoji;
    resetEmoji = jsondata.emojis.defaults.resetEmoji;

    const administrators = jsondata.administrators;

    if (!administrators.includes(interaction.member.id) && interaction.guild.ownerId !== interaction.member.id) {
      return await interaction.reply({
        content: `${errorEmoji} You do not have permission to use this command.\n-# By default, the server owner has permission and can use this command to add administrators.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.reply({ content: `${loadingEmoji} Loading...`, flags: MessageFlags.Ephemeral });
    const message = await interaction.fetchReply();
    await handleMainMenu(interaction, message);
  },

  config: {
    type: "private",
  },
};
