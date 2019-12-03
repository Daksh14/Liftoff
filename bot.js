/**
 * - bot. This bot tells about new launches and
 *  updates them in your discord server
 *  It checks for recent launches and pings
 *  you if any launch is near
 */
const Discord = require('discord.io')
/**
 * Contains the bot's secret
 * @type {object}
 */
const auth = require('./auth.json')
/**
 * Moment library instance for working with dates
 */
const moment = require('moment')
/**
 * This bot uses a wrapper on launchlibrary to get launch
 * Information.
 */
const Launch = require('launchlib-js')
/**
 * Launchlibrary instance
 * @type {Launch}
 */
const launchLib = new Launch()
/**
 * The channelId in which the bot pings you for recent launches
 * or where you want the bot to respond on
 * @type {String}
 */
const channelUpdateId = "646623019166334989"
/**
 * This is the author's discordId, the bot uses this id to notify
 * the author of any problems
 * @type {String}
 */
const authorId = "510184410155319308"
/**
 * The time-interval in which the bot should fetch the launches data
 * again.
 * @type {Number}
 */
const pingInterval = 10000

var bot = new Discord.Client({ token: auth.token, autorun: true });
/**
 * We'll keep the record of the launch names, if a new one arisies
 * then ping the role. If the launch name exists in the array
 * then don't ping. This is to prevent un-necessary constant pinging
 * @type {Array}
 */
let literations = []

/**
 * The interval fetches the data from the server again and again
 * if it sees any new launches then it notifies the user/role about it
 */
let interval = setInterval(() => {
    let now = moment().format('MMMM Do YYYY, h:mm:ss a');
    launchLib.get('getLaunches', '5').then(data => {
        data.launches.forEach((launchesInfo) => {
            try {
                let launches = launchesInfo
                let then = moment(launches.windowstart)
                let s = moment(launches.windowstart).fromNow()
                if (s === "in a day" && !literations.includes(launches.name)) {
                    literations.push(launches.name)
                    bot.sendMessage({
                        to: channelUpdateId,
                        message: "Launch imminent <@"+authorId+">",
                        embed: {
                            "title": launches.name,
                            "description": launches.missions[0].description,
                            "image": {
                                "url": launches.rocket.imageURL,
                            },fields: [{
                                name: "**Launch Time**",
                                value: launches.windowstart
                            }, {
                                name: "**Time left**",
                                value: moment(launches.windowstart).fromNow()
                            }, {
                                name: "**Location**",
                                value: launches.location.name
                            }, {
                                name: "**Organisation**",
                                value: launches.lsp.name
                            }, {
                                name: "**Country Code**",
                                value: launches.lsp.countryCode
                            }, {
                                name: "**Links**",
                                value: "Company-wiki: " + launches.lsp.wikiURL + "\n" + "Video links " + launches.vidURLs[0]
                            }],
                        }
                    })
                }
            } catch (err) {
                bot.sendMessage({
                    to: channelUpdateId,
                    message: "There's a problem, FIX IT <@"+authorId+">"
                });
            }
        })
    })
}, pingInterval)

bot.on('message', (user, userID, channelID, message, evt) => {

    switch(message) {
        case ";nextlaunch":
            launchLib.get('getLaunches', '1')
            .then(data => {
                let launches = data.launches[0]
                bot.sendMessage({
                    to: channelUpdateId,
                    message: "Launch",
                    embed: {
                        "title": launches.name,
                        "description": launches.missions[0].description,
                        'image': {
                            'url': launches.rocket.imageURL,
                        },fields: [{
                            name: "**Launch Time**",
                            value: launches.windowstart
                        }, {
                            name: "**Time left**",
                            value: moment(launches.windowstart).fromNow()
                        }, {
                            name: "Location",
                            value: launches.location.name
                        }, {
                            name: "Organisation",
                            value: launches.lsp.name
                        }, {
                            name: "Country Code",
                            value: launches.lsp.countryCode
                        }, {
                            name: "Links",
                            value: "Company-wiki: " + launches.lsp.wikiURL + "\n" + "Video links " + launches.vidURLs[0]
                        }],
                    }
                })
            })
            .catch(err => {
                //console.log(err)
                bot.sendMessage({
                    to: channelUpdateId,
                    message: "There's a problem, FIX IT <@"+authorId+">"
                });
            })
            break;
        case ";launchlist":
            launchLib.get('getLaunches', '10').then(data => {
                let launchesArr = data.launches.map((launches) => {
                    let vid = typeof launches.vidURLs[0] == "undefined" ? "Not available" : launches.vidURLs[0]
                    return { name: launches.name,
                        value: "**Launch Time**: " + launches.windowstart + "; " + moment(launches.windowstart).fromNow() + "\n **Organisation**: " + launches.lsp.name + "\n **Location**: " + launches.location.name + " \n **Country**: " + launches.lsp.countryCode + "\n **Live**: " + vid
                    }
                })
                bot.sendMessage({
                    to: channelUpdateId,
                    message: "Launches",
                    embed: {
                        "title": "Launch data",
                        "description": "Upcoming 10 launches",
                        fields: launchesArr
                    }
                })
            })
            .catch(err => {
                console.log(err)
                bot.sendMessage({
                    to: channelUpdateId,
                    message: "There's a problem, FIX IT <@"+authorId+">"
                });
            })
            break;
    }
});
