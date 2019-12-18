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
/**
 * filters the role/channel ids to their num format
 * @param  {String} id String
 * @return {String} Fitered string
 */
const filter = (role) => { return role.replace("<","").replace(">","").replace("@","").replace("&","").replace("#","") }
/**
 * Match the roleRegex to extract ids from message string
 * @param  {String} message The message string
 * @return {Array} Array of roles, these roles needs to be filtered first to be used in searching the guild object for any reason
 */
const getRole = (message) => message.match(roleRegex)
/**
 * Get embeds for ;nextlaunch
 * @param  {Launch} launches launch-lib instance
 * @return {embed} embed object
 */
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
/**
 * Get embeds for ;help-liftoff
 * @return {embed} embed object
 */
const helpEmbeds = () => {
    let embed = new Discord.RichEmbed()
    embed.setTitle("Commands")
    embed.addField("**;launch-list**", "Shows a list of 10 upcoming launches")
    embed.addField("**;next-launch**", "Returns a single but most near launch")
    embed.addField("**;event-role**", "Shows the role that is registered for pinging when a launch is near")
    embed.addField("**;!ping <rolename>**", "Pings the event role.")
    embed.addField("**;!register <rolename> <channel-name>**", "Use this to register a role that should be pinged when a launch is near. \n e.g `;!register @events-alert #general`")
    return embed
}
/**
 * Get role-id and channel-id for a server in the SQL-lite database
 * @param  {string} serverID Id of the server of which we want the channel-id or role-id
 * @param  {sqlite3} db sqlite3 db instance
 * @param  {callback} callback callback as soon as we get fetch the ids
 * @return {null}
 */
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
/**
 * Check if the user has submitted a channel for events
 * @param  {string} serverID Id of the server of which we want the channel-id or role-id
 * @param  {sqlite3} db sqlite3 db instance
 * @param  {callback} callback callback as soon as we get fetch the ids
 * @return {null}
 */
const checkIfEventChannelExists = (serverID, db, callback) => {
    db.serialize(function() {
        db.get("SELECT * FROM events WHERE server_id = ?", [serverID], (err, row) => {
            if (err) { console.log(err) }
            if (row) { callback("exists", row) } else { callback("new", "") }
        })
    })
}
/**
 * Update the channel-id for events of a given serverID
 * @param  {string} serverID Id of the server of which we want the channel-id or role-id
 * @param  {sqlite3} db sqlite3 db instance
 * @param  {Array} [roles] Array of role-id and channel-id
 * @param  {callback} callback callback as soon as we get fetch the ids
 * @return {null}
 */
const changeChannel = (serverID, db, roles, callback) => {
    db.serialize(function() {
        db.run("UPDATE events SET channel_id = ? WHERE server_id = ?", [roles[1], serverID], (err, row) => {
            if (err) { console.log(err) }
            callback()
        })
    })
}
/**
 * Update the role-id for events of a given serverID
 * @param  {string} serverID Id of the server of which we want the channel-id or role-id
 * @param  {sqlite3} db sqlite3 db instance
 * @param  {Array} [roles] Array of role-id and channel-id
 * @param  {callback} callback callback as soon as we get fetch the ids
 * @return {null}
 */
const changeRole = (serverID, db, roles, callback) => {
    db.serialize(function() {
        db.run("UPDATE events SET role_id = ? WHERE server_id = ?", [roles[0], serverID], (err, row) => {
            if (err) { console.log(err) }
            if (row) { callback() } else { callback() }
        })
    })
}
/**
 * Update the channel-id and the role-id for events of a given serverID
 * @param  {string} serverID Id of the server of which we want the channel-id or role-id
 * @param  {sqlite3} db sqlite3 db instance
 * @param  {Array} [roles] Array of role-id and channel-id
 * @param  {callback} callback callback as soon as we get fetch the ids
 * @return {null}
 */
const changeRoleAndChannel = (serverID, db, roles, callback) => {
    db.serialize(function() {
        db.run("UPDATE events SET role_id = ? AND channel_id = ? WHERE server_id = ?", [roles[0], roles[1], serverID], (err, row) => {
            if (err) { console.log(err) }
            if (row) { callback() } else { callback() }
        })
    })
}
/**
 * Push a channel-id and the role-id in the database for events of a given serverID
 * @param  {string} serverID Id of the server of which we want the channel-id or role-id
 * @param  {sqlite3} db sqlite3 db instance
 * @param  {Array} [roles] Array of role-id and channel-id
 * @param  {callback} callback callback as soon as we get fetch the ids
 * @return {null}
 */
const addAField = (serverID, db, role, callback) => {
    db.serialize(() => {
        db.run("INSERT INTO events (server_id, role_id, channel_Id) VALUES (?1, ?2, ?3)" , {
            1: serverID,
            2: role[0],
            3: role[1]
        }, (err) => {
            if (err) {
                console.error(err.message)
                callback("problem")
            }
            callback("done")
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
exports.addAField = addAField
