"use strict";
const Discord = require("discord.js");
const utils = require("./utils.js");

exports.nextLaunchEmbeds = async () => {
    return utils.getRecentLaunch().then(launches => {
        let embed = new Discord.RichEmbed().setTitle(launches.name);
        if (launches.missions[0]) {
            if (launches.missions[0].description.length > 100) {
                embed.setDescription(
                    launches.missions[0].description.substring(0, 100) +
                    "...[read more](https://launchlibrary.net/) "
                );
            } else {
                embed.setDescription(launches.missions[0].description);
            }
        } else {
            embed.setDescription("_no description available_");
        }
        embed
            .setThumbnail(launches.rocket.imageURL)
            .addField("**Launch Time**", launches.windowstart)
            .addField("**Time left**", utils.getTimeLeftString(launches))
            .addField("**Location**", launches.location.name)
            .addField("**Organisation**", launches.lsp.name)
            .addField("**Country Code**", launches.lsp.countryCode);
        if (launches.vidURLs[0]) {
            embed.addField(
                "**Links**",
                "Source: http://www.launchlibrary.net/ \n Company-wiki: " +
                launches.lsp.wikiURL +
                "\n" +
                "Video links: " +
                launches.vidURLs[0]
            );
        } else {
            embed.addField(
                "**Links**",
                "Source: http://www.launchlibrary.net/ \n Company-wiki: " +
                launches.lsp.wikiURL +
                "\n" +
                "Video links: Not available"
            );
        }
        return new Promise(res => res(embed));
    });
};
exports.nextLaunchEmbedsQuick = launches => {
    let embed = new Discord.RichEmbed().setTitle(launches.name);
    if (launches.missions[0]) {
        if (launches.missions[0].description.length > 100) {
            embed.setDescription(
                launches.missions[0].description.substring(0, 100) +
                "...[read more](https://launchlibrary.net/) "
            );
        } else {
            embed.setDescription(launches.missions[0].description);
        }
    } else {
        embed.setDescription("_no description available_");
    }
    embed
        .setThumbnail(launches.rocket.imageURL)
        .addField("**Launch Time**", launches.windowstart)
        .addField("**Time left**", utils.getTimeLeftString(launches))
        .addField("**Location**", launches.location.name)
        .addField("**Organisation**", launches.lsp.name)
        .addField("**Country Code**", launches.lsp.countryCode);
    if (launches.vidURLs[0]) {
        embed.addField(
            "**Links**",
            "Source: http://www.launchlibrary.net/ \n Company-wiki: " +
            launches.lsp.wikiURL +
            "\n" +
            "Video links: " +
            launches.vidURLs[0]
        );
    } else {
        embed.addField(
            "**Links**",
            "Source: http://www.launchlibrary.net/ \n Company-wiki: " +
            launches.lsp.wikiURL +
            "\n" +
            "Video links: Not available"
        );
    }
    return embed;
};
exports.helpEmbeds = (bot, role) => {
    let roleId;
    if (typeof role === "undefined") {
        roleId = "None";
    } else {
        roleId = role.role_id;
    }
    return new Discord.RichEmbed()
        .setTitle("COMMANDS AND INFO")
        .addField(
            "**;launch-list <number>**",
            "Shows a list of <number> upcoming launches, if no number is specified then 10 recent launches are returned. **<number> should be equal to or smaller than 10**"
        )
        .addField("**;next-launch**", "Returns a single but most near launch")
        .addField(
            "**;event-role**",
            "Shows the role that is registered for pinging when a launch is near"
        )
        .addField(
            "**;!ping <rolename>**",
            "Pings the event role. Mention the **ROLE NAME** at <rolename>. Do not ping it"
        )
        .addField(
            "**;!set-pinger-role <@rolename>**",
            "A role that can do ;!ping rolename manually to ping the event-role manually in case of any other events. Only the users who have this role can use this command, admins without this role cannot use this command."
        )
        .addField(
            "**;!register <@rolename> <#channel-name>**",
            "Use this to register a role that should be pinged when a launch is near. \n e.g `;!register @events-alert #general`. Be sure to ping the role here."
        )
        .addField("**PINGER ROLE**", roleId)
        .addField("**SERVING**", `${bot.guilds.size} Guilds`)
        .addField("**JOIN THE LIFTOFF SERVER**", "https://discord.gg/w9J8suk");
};
exports.eventRoleInfoEmbeds = info => {
    return new Discord.RichEmbed()
        .setTitle("Roles to ping when launches are near")
        .setDescription(
            `Role:  ${info.roleId} \n Event Channel: ${info.channelId}`
        );
};
exports.launchListEmbeds = data => {
    let embed = new Discord.RichEmbed();
    data.launches.forEach(launches => {
        let vid =
            typeof launches.vidURLs[0] === "undefined" ?
            "Not available" :
            launches.vidURLs[0];

        let timeLeftString = utils.getTimeLeftString(launches);
        embed.addField(
            launches.name,
            "**Launch Time**: " +
            launches.windowstart +
            "; " +
            timeLeftString +
            "\n **Organisation**: " +
            launches.lsp.name +
            "\n **Location**: " +
            launches.location.name +
            " \n **Country**: " +
            launches.lsp.countryCode +
            "\n **Live**: " +
            vid
        );
    });
    embed.setTitle("Launch data");
    return embed;
};
exports.badSyntaxRolePingEmbeds = () =>
    new Discord.RichEmbed()
    .setTitle("Event role and channel")
    .setDescription(
        "Bad synatx, the correct synatx is : `;!ping <role-name>.` Don't mention the role"
    );

exports.roleNonExistentEmbeds = () =>
    new Discord.RichEmbed()
    .setTitle("Event role and channel")
    .setDescription("Role doesn't exists :/");

exports.badSyntaxRegisterRole = () =>
    new Discord.RichEmbed()
    .setTitle("Event role and channel")
    .setDescription(
        "Bad synatx, the correct synatx is : `;!register <rolename> <channel-name>`"
    );

exports.registerRoleExists = role =>
    new Discord.RichEmbed()
    .setTitle("Event role and channel")
    .setDescription("This role already exists for channel " + role[1]);

exports.changingChannelEmbeds = () =>
    new Discord.RichEmbed()
    .setTitle("Event role and channel")
    .setDescription("Changing channels");

exports.changingRolesEmbeds = () =>
    new Discord.RichEmbed()
    .setTitle("Event role and channel")
    .setDescription("Changing roles");
exports.changingRolesAndChannelEmbeds = () =>
    new Discord.RichEmbed()
    .setTitle("Event role and channel")
    .setDescription("Changing roles and channel");