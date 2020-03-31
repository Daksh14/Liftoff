"use strict";
/**
 *  Liftoff!. This bot tells about new launches and updates them in your discord server
 *  It checks for recent launches and pings you if any launch is near.
 *  The bot was intially created because of some issues with the OKOTO bot for our
 *  Aerospace Eng. server. Server invite-link: https://discord.gg/dt4zf6g
 * Bot invite link: https://discord.gg/w9J8suk
 */
const Discord = require("discord.js");
const bot = new Discord.Client();
const auth = "Njc2MTcxMjE0OTY4MDYxOTUy.Xn6FAw.sonTrzP5qwzUaF4QPOcmsT5GZmE";
const botFunctions = require("./botFunctions.js");
const utils = require("./utils.js");
const http = require("http");
const embeds = require("./embeds.js");
const express = require("express");
const app = express();
app.get("/", (_, response) => {
    response.sendStatus(200);
});

const pingInterval = 10000;

const literations = [];
setInterval(() => {
    utils.getRecentLaunch().then(launches => {
        const timeleft = utils.fromNow(launches.windowstart);
        console.log(timeleft);
        if (timeleft === "in 15 minutes") {
            bot.guilds.forEach(server => {
                if (
                    !literations.filter(
                        e =>
                        e.server === server.id &&
                        e.launch === launches.name &&
                        e.time === launches.windowstart &&
                        e.timeleft === timeleft
                    ).length > 0
                ) {
                    botFunctions.checkIfEventChannelExists(server.id).then(res => {
                        let roleInstance = bot.guilds
                            .get(server.id)
                            .roles.find(
                                roleE => roleE.id === utils.filterRole(res.row.role_id)
                            );
                        botFunctions.pingRole(roleInstance).then(() => {
                            roleInstance
                                .setMentionable(true, "Role needs to be pinged")
                                .then(state => {
                                    bot.channels
                                        .get(utils.filterRole(res.row.channel_id))
                                        .send(embeds.nextLaunchEmbedsQuick(launches));

                                    return state;
                                })
                                .then(state =>
                                    bot.channels
                                    .get(utils.filterRole(res.row.channel_id))
                                    .send(`<@&${state.id}> Launch incoming`)
                                )
                                .then(() => {
                                    roleInstance.setMentionable(false, "Pinging done");
                                    literations.push({
                                        server: server.id,
                                        launch: launches.name,
                                        time: launches.windowstart,
                                        timeleft: timeleft
                                    });
                                });
                        });
                    });
                }
            });
        }
    });
}, pingInterval);

bot.on("message", msg => {
    if (msg.content.includes(";help-liftoff")) {
        botFunctions.checkPingRoleServerEntry(msg.guild.id).then(row => {
            msg.channel.send(embeds.helpEmbeds(bot, row));
        });
    }
    if (msg.content.includes(";next-launch")) {
        embeds.nextLaunchEmbeds().then(embed => msg.channel.send(embed));
    }
    if (msg.content.includes(";event-role")) {
        botFunctions.getEventRoleInfo(msg.guild.id).then(info => {
            msg.channel.send(
                embeds.eventRoleInfoEmbeds({
                    channelId: info.channelId,
                    roleId: info.roleId
                })
            );
        });
    }
    if (msg.content.includes(";launch-list")) {
        const number = msg.content.match(/(\d+)/);
        if (number && number[0] <= 10) {
            utils.getRecentnLaunches(number[0]).then(data => {
                msg.channel.send(
                    embeds
                    .launchListEmbeds(data)
                    .setDescription("Upcoming " + number[0] + " launches")
                );
            });
        } else {
            utils.getRecentnLaunches("10").then(data => {
                msg.channel.send(
                    embeds.launchListEmbeds(data).setDescription("Upcoming 10 launches")
                );
            });
        }
    }
    if (msg.content.includes(";!ping")) {
        botFunctions.checkPingRoleServerEntry(msg.guild.id).then(row => {
            if (row) {
                if (
                    msg.member.roles.some(
                        role => role.id === utils.filterRole(row.role_id)
                    )
                ) {
                    const role = utils.filterRoleFromPingerCommand(msg.content);
                    if (utils.checkIfRoleIsPinged(role)) {
                        msg.channel.send(embeds.badSyntaxRolePingEmbeds());
                    } else {
                        const roleInstance = msg.guild.roles.find(
                            roleE => roleE.name === role
                        );
                        if (roleInstance) {
                            roleInstance
                                .setMentionable(true, "Role needs to be pinged")
                                .then(state => msg.channel.send(`<@&${state.id}>`))
                                .then(() => roleInstance.setMentionable(false, "Pinging done"));
                        } else {
                            msg.channel.send(embeds.roleNonExistentEmbeds());
                        }
                    }
                } else {
                    msg.channel.send(utils.noPermissions);
                }
            } else {
                msg.channel.send(utils.pingerRoleNonExistent);
            }
        });
    }
    if (msg.content.includes(";!set-pinger-role")) {
        if (msg.member.permissions.has("ADMINISTRATOR")) {
            let role = utils.getRoleFromText(msg.content);
            if (role) {
                botFunctions.checkPingRoleExist(msg.guild.id, role).then(info => {
                    console.log(role);
                    if (info.state === "exists") {
                        msg.channel.send(utils.rolePingerExists);
                    } else {
                        botFunctions.makeNewPingRole(msg.guild.id, role).then(state => {
                            switch (state) {
                                case "done":
                                    msg.channel.send(utils.rolePingerSet);
                                    break;
                                case "updated":
                                    msg.channel.send(utils.rolePingerUpdated);
                            }
                        });
                    }
                });
            } else {
                msg.channel.send(utils.forgotRoleMention);
            }
        } else {
            msg.channel.send(utils.noPermissions);
        }
    }
    if (msg.content.includes(";!register")) {
        if (msg.member.permissions.has("ADMINISTRATOR")) {
            let role = utils.getRoleFromText(msg.content);
            if (role && role[1]) {
                if (utils.registerFormatCheck(role)) {
                    msg.channel.send(embeds.badSyntaxRegisterRole());
                } else {
                    botFunctions.checkIfEventChannelExists(msg.guild.id).then(obj => {
                        if (obj.state === "new") {
                            botFunctions.registerRole(msg.guild.id, role).then(res => {
                                if (res === "problem") {
                                    msg.channel.send(utils.problemOccured);
                                } else if (res === "done") {
                                    msg.channel.send(utils.registerRoleSet);
                                }
                            });
                        } else if (obj.state === "exists") {
                            if (
                                obj.row.role_id === role[0] &&
                                obj.row.channel_id === role[1]
                            ) {
                                msg.channel.send(embeds.registerRoleExists(role));
                            } else {
                                if (obj.row.role_id === role[0]) {
                                    msg.channel.send(embeds.changingChannelEmbeds());
                                    botFunctions
                                        .changeChannel(msg.guild.id, role)
                                        .then(() => msg.channel.send("Done"));
                                } else if (obj.row.channel_id === role[1]) {
                                    msg.channel.send(embeds.changingRolesEmbeds());
                                    botFunctions
                                        .changeRole(msg.guild.id, role)
                                        .then(() => msg.channel.send("Done"));
                                } else {
                                    msg.channel.send(embeds.changingRolesAndChannelEmbeds());
                                    botFunctions
                                        .changeRoleAndChannel(msg.guild.id, role)
                                        .then(() => msg.channel.send("Done"));
                                }
                            }
                        }
                    });
                }
            } else {
                msg.channel.send(utils.wrongSyntax);
            }
        } else {
            msg.channel.send(utils.noPermissions);
        }
    }
});
bot.on("ready", () => {
    botFunctions.setActivity(bot);
    console.log(`Logged in`);
});
bot.login(auth);
setInterval(() => {
    http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);
app.listen(process.env.PORT);