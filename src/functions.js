/**
 * A regex to get roleId from messages
 * @type {RegExp}
 */
const roleRegex = /(<).*?(>)/gm
/**
 * Moment library instance for working with dates
 */
const moment = require('moment')
/**
 * Discord js instance
 */
const Discord = require('discord.js')

const filter = (role) => { return role.replace("<","").replace(">","").replace("@","").replace("&","").replace("#","") }
const getRole = (message) => message.match(roleRegex)
const getEmbeds = (launches) => {
    let embed = new Discord.RichEmbed()
    embed.setTitle(launches.name)
    embed.setDescription(launches.missions[0].description.substring(0,100) + "...")
    embed.setImage(launches.rocket.imageURL)
    embed.addField("**Launch Time**", launches.windowstart)
    embed.addField("**Time left**", moment(launches.windowstart).fromNow())
    embed.addField("**Location**", launches.location.name)
    embed.addField("**Organisation**", launches.lsp.name)
    embed.addField("**Country Code**", launches.lsp.countryCode)
    embed.addField("**Links**",  "Company-wiki: " + launches.lsp.wikiURL + "\n" + "Video links " + launches.vidURLs[0])

    return embed
}
const helpEmbeds = () => {
    let embed = new Discord.RichEmbed()
    embed.setTitle("Commands")
    embed.addField("**;launchlist**", "Shows a list of 10 upcoming launches")
    embed.addField("**;nextlaunch**", "Returns a single but most near launch")
    embed.addField("**;eventrole**", "Shows the role that is registered for pinging when a launch is near")
    embed.addField("**;!register <rolename> <channel-name>**", "Use this to register a role that should be pinged when a launch is near. \n e.g `;!register @events-alert #general`")
    return embed
}
const getIds = (serverID, db, callback) => {
    db.serialize(() => {
        db.each("SELECT * FROM events WHERE server_id = ?", [ serverID ], (err, row) => {
            if (err) {
                console.error(err.message)
            }
            let roleID = row.role_id
            let channelUpdateId = row.channel_id
            let filteredID = filter(roleID)
            let filteredChannelId = filter(channelUpdateId)
            callback(filteredID, filteredChannelId, roleID)
        })
    })
}
const checkIfEventChannelExists = (serverID, db, callback) => {
    db.serialize(function() {
        db.get("SELECT * FROM events WHERE server_id = ?", [serverID], (err, row) => {
            if (err) { console.log(err) }
            if (row) { callback("exists", row) } else { callback("new", "") }
        })
    })
}
const changeChannel = (serverID, db, roles, callback) => {
    db.serialize(function() {
        db.run("UPDATE events SET channel_id = ? WHERE server_id = ?", [roles[1], serverID], (err, row) => {
            if (err) { console.log(err) }
            if (row) { callback() } else { callback() }
        })
    })
}
const changeRole = (serverID, db, roles, callback) => {
    db.serialize(function() {
        db.run("UPDATE events SET role_id = ? WHERE server_id = ?", [roles[0], serverID], (err, row) => {
            if (err) { console.log(err) }
            if (row) { callback() } else { callback() }
        })
    })
}
const changeRoleAndChannel = (serverID, db, roles, callback) => {
    db.serialize(function() {
        db.run("UPDATE events SET role_id = ? AND channel_id = ? WHERE server_id = ?", [roles[0], roles[1], serverID], (err, row) => {
            if (err) { console.log(err) }
            if (row) { callback() } else { callback() }
        })
    })
}
/**
 * Function exports
 */
exports.getRole = getRole
exports.filter = filter
exports.helpEmbeds = helpEmbeds
exports.getIds = getIds
exports.getEmbeds = getEmbeds
exports.checkIfEventChannelExists = checkIfEventChannelExists
exports.changeChannel = changeChannel
exports.changeRole = changeRole
exports.changeRoleAndChannel = changeRoleAndChannel
