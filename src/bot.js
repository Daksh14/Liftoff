/**
 *  Liftoff!. This bot tells about new launches and updates them in your discord server
 *  It checks for recent launches and pings you if any launch is near.
 *  The bot was intially created because of some issues with the OKOTO bot for our
 *  Aerospace Eng. server. Server invite-link: https://discord.gg/dt4zf6g
 */
const Discord = require('discord.js')
const bot = new Discord.Client()
/**
 * Contains the bot's secret
 */
const auth = process.env.TOKEN
/**
 * Moment library instance for working with dates
 */
const moment = require('moment')

/**
 * SQLite3 database API instance. Using this for storing roles
 * and the SQLite3 database location
 */
const sqlite3 = require('sqlite3').verbose()
const dbFile = './liftoff.db'
let db = new sqlite3.Database(dbFile, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) { console.error(err.message) }
})
/**
 * Some native functions that are required to perfom CRUD operations and
 * filtering of some sorts
 */
const fun = require("./functions.js")
/**
 * Standard http
 */
const http = require('http')
/**
 * ugh
 */
const express = require('express')
const app = express()
/**
 * Run the http server
 */
app.get("/", (request, response) => {
  response.sendStatus(200)
})
/**
 * Keep on send requests to our bot's domain just to
 * keep it alive :)
 */
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`)
}, 280000)
app.listen(process.env.PORT)
/**
 * Launchlibrary instance
 * @type {Launch}
 */
const Launch = require('launchlib-js')
const launchLib = new Launch()
/**
 * The time-interval in which the bot should fetch the launches data
 * again.
 * @type {Number}
 */
const pingInterval = 10000
/**
 * The time-interval for allowing ping to be ping-able.
 */
const pingIntervalPing = 1000
/**
 * We'll keep the record of the launch names, if a new one arisies
 * then ping the role. If the launch name exists in the array
 * then don't ping. This is to prevent un-necessary constant pinging
 * @type {Array}
 */
let literations = []
/**
 * The interval fetches the data from the server again and again
 * if it sees any new launches. For a fixed near-timestamp
 * Currently: 1 hour
 * Then it notifies the user/role about it
 */
let interval = setInterval(() => {
    launchLib.get('getLaunches', '5').then(data => {
        data.launches.forEach((launchesInfo) => {
            try {
                let s = moment(new Date(launchesInfo.windowstart)).fromNow()
                // The "one day left" event ping is now postponed as
                // there can be many launches in a day and this
                // can become spamy
                if (s == "in 15 minutes") {
                    Array.from(bot.guilds).forEach(val => {
                        try {
                            let id = Array.from(val)[0]
                            if (!literations.filter(e => e.server == id && e.launch == launchesInfo.name && e.time == launchesInfo.windowstart && e.timeleft == s).length > 0) {
                                literations.push({server: id, launch: launchesInfo.name, time: launchesInfo.windowstart, timeleft: s})
                                fun.getIds(id, db,  (filteredID, filteredChannelId, role) => {
                                    let roleInstance = bot.guilds.get(id).roles.find(roleE => roleE.id == filteredID)
                                    if (roleInstance) {
                                        roleInstance.setMentionable(true, 'Role needs to be pinged')
                                        .then(updated => {
                                            bot.channels.get(filteredChannelId).send(role + " Launch incoming")
                                            setTimeout(() => roleInstance.setMentionable(false, "Pinging done"), pingIntervalPing)
                                        })
                                        .catch(console.error)
                                    }
                                    let embed = fun.getEmbeds(launchesInfo)
                                    bot.channels.get(filteredChannelId).send(embed)
                                })
                            }
                        } catch (err) { console.log(err) }
                    })
                }
              if (s == "in 13 minutes") {
                literations = [];
              }
            }
            catch (err) {
                console.log(err)
            }
        })
    }).catch((err) => {
        console.log(err)
    })
}, pingInterval)

bot.on('message', msg => {
    let message = msg.content
    let channelID = msg.channel
    let serverID = msg.guild.id
    if (!message.includes(";!")) {
        switch(message) {
            case ";next-launch":
                launchLib.get('getLaunches', '1').then(data => {
                  try {
                    let launches = data.launches[0]
                    let embed = fun.getEmbeds(launches)
                    msg.channel.send(embed)
                  } catch (err) {
                    console.log(err)
                  }
                }).catch(err => {

                    console.log(err.message)
                    msg.channel.send("There's a problem, the author is informed")
                })
            break
            case ";launch-list":
                let embed = new Discord.RichEmbed()
                launchLib.get('getLaunches', '10').then(data => {
                    let launchesArr = data.launches.forEach((launches) => {
                        let vid = typeof launches.vidURLs[0] == "undefined" ? "Not available" : launches.vidURLs[0]

                        let duration = moment.duration(moment(new Date(launches.windowstart), "h:mm:s").utc().diff(moment(new Date(), "h:mm:s")))
                        let timeLeftString = duration.days() + " days " + duration.hours() + " hours " + duration.minutes() + " minutes"
                        embed.addField(launches.name, "**Launch Time**: " + launches.windowstart + "; " + timeLeftString + "\n **Organisation**: " + launches.lsp.name + "\n **Location**: " + launches.location.name + " \n **Country**: " + launches.lsp.countryCode + "\n **Live**: " + vid)
                    })
                    embed.setTitle("Launch data")
                    embed.setDescription("Upcoming 10 launches")
                    msg.channel.send(embed)
                })
                .catch(err => {
                    console.log(err)
                    msg.channel.send("There's a problem, the author is informed")
                })
            break
            case ";event-role":
                fun.getIds(serverID, db,  (filteredID, filteredChannelId) => {
                    let embed = new Discord.RichEmbed()
                    embed.setTitle("Roles to ping when launches are near")
                    let channelName = msg.guild.channels.find(ch => ch.id == filteredChannelId).name
                    let roleName = msg.guild.roles.find(ch => ch.id == filteredID)
                    if (roleName) {
                      embed.setDescription("Role name: " + roleName.name +". \n Event-Channel-name: " + channelName)
                      msg.channel.send(embed)
                    }else {
                      embed.setDescription("There has been a problem in registering your roleName. Please try again.")
                      msg.channel.send(embed)
                    }
                })
            break
            case ";help-liftoff":
                let helpEmbed = fun.helpEmbeds()
                helpEmbed.setTitle("Command list")
                msg.channel.send(helpEmbed)
            break
        }
    } else {
        if (message.includes(";!register")) {
            let perms = msg.member.permissions
            if (perms.has("ADMINISTRATOR")) {
                let role = fun.getRole(message)
                /**
                 *  Check if the message is in a correct format
                 */
                if (!role[0].includes("@") || !role[0].includes("&") || !role[1].includes("#") || role[1].includes("!") || role[0].includes("!")) {
                    let embed = new Discord.RichEmbed()
                    embed.setTitle("Event role and channel")
                    embed.setDescription("Bad synatx, the correct synatx is : `;!register <rolename> <channel-name>`")
                    msg.channel.send(embed)
                } else {
                    let channelregID = fun.filter(role[1])
                    let channelName = msg.guild.channels.find(ch => ch.id == channelregID).name
                    /**
                     * Check if the server exists. If it does not then create a new entry in the database
                     */
                    let response = fun.checkIfEventChannelExists(serverID, db, (state, row) => {
                        if (state == "new") {
                            fun.addAField(serverID, db, role, (res) => {
                                if (res == "problem") {
                                    msg.channel.send("There's a problem, the author is informed")
                                }else if (res == "done") {
                                    msg.channel.send("Role successfully set")
                                }
                            })
                        } else if (state == "exists") {
                            if (row.role_id == role[0] && row.channel_id == role[1]) {
                                let embed = new Discord.RichEmbed()
                                embed.setTitle("Event role and channel")
                                embed.setDescription("This role already exists for channel " + role[1])
                                msg.channel.send(embed)
                            }else{
                                if (row.role_id == role[0]) {
                                    let embed = new Discord.RichEmbed()
                                    embed.setTitle("Event role and channel")
                                    embed.setDescription("Changing channels")
                                    msg.channel.send(embed)
                                    fun.changeChannel(serverID, db, role, () => msg.channel.send("Done"))
                                } else if (row.channel_id == role[1]) {
                                    let embed = new Discord.RichEmbed()
                                    embed.setTitle("Event role and channel")
                                    embed.setDescription("Changing roles")
                                    msg.channel.send(embed)
                                    fun.changeRole(serverID, db, role, () => msg.channel.send("Done"))
                                } else {
                                    let embed = new Discord.RichEmbed()
                                    embed.setTitle("Event role and channel")
                                    embed.setDescription("Changing roles and channel")
                                    msg.channel.send(embed)
                                    fun.changeRoleAndChannel(serverID, db, role, () => msg.channel.send("Done"))
                                }
                            }
                        }
                    })
                }
            } else {
                msg.channel.send("Insufficient permissions")
            }
        }
        if (message.includes(";!ping")) {
            let getPingerRoleForServer = fun.checkPingRoleServerEntry(serverID, db, (_, row) => {
                if (msg.member.roles.some(role => role.id === fun.filter(row.role_id))) {
                    let role = message.replace(";!ping", "").replace(/^\s+/g, '')
                    if (role.includes("@") || role.includes("&") || role.includes("!")) {
                        let embed = new Discord.RichEmbed()
                        embed.setTitle("Event role and channel")
                        embed.setDescription("Bad synatx, the correct synatx is : `;!ping <role-name>.` Don't mention the role")
                        msg.channel.send(embed)
                    } else {
                        let roleInstance = msg.guild.roles.find(roleE => roleE.name == role)
                        if (roleInstance) {
                            roleInstance.setMentionable(true, 'Role needs to be pinged')
                            .then(updated => {
                              msg.channel.send("<@&"+roleInstance.id+">")
                              setTimeout(() => roleInstance.setMentionable(false, "Pinging done"), pingIntervalPing)
                            })
                            .catch(console.error)
                        } else {
                            let embed = new Discord.RichEmbed()
                            embed.setTitle("Event role and channel")
                            embed.setDescription("Role doesn't exists :/")
                            msg.channel.send(embed)
                        }
                    }
                } else {
                    msg.channel.send("Insufficient permissions")
                }
            })
        }
        if (message.includes(";!set-pinger-role")) {
            let perms = msg.member.permissions
            if (perms.has("ADMINISTRATOR")) {
                let role = fun.getRole(message)
                if (role) {
                    fun.checkPingRole(serverID, db, role, (state) => {
                        if (state == "exists") {
                            msg.channel.send("A pinger role for this server already exists with this particular role")
                        } else {
                            fun.makeNewPingRole(serverID, db, role, (state) => {
                                if (state === "done") {
                                    msg.channel.send("Role pinger is set!")
                                }
                                if (state === "updated") {
                                    msg.channel.send("Role pinger is updated!")
                                }
                            })
                        }
                    })
                }else {
                    msg.channel.send("You forgot to mention the role!")
                }
            } else {
                msg.channel.send("Insufficient permissions")
            }
        }
    }
})
bot.on('ready', () => {
  let counter = true
  setInterval(() => {
    if (counter) {
      counter = false
      bot.user.setActivity(";help-liftoff", {type: "LISTENING"})
    }else{
      counter = true
      bot.user.setActivity("soviet wave", {type: "LISTENING"})
    }
  }, 35000)

  console.log(`Logged in`)
})
bot.login(auth)
