"use strict";

const database = require("sqlite-async");
const utils = require("./utils.js");
let db;
database
    .open("./liftoff.db", database.OPEN_READWRITE | database.OPEN_CREATE)
    .then(_db => {
        db = _db;
        console.log("db ok");
    })
    .catch(err => console.log(err.message));

exports.setActivity = bot => {
    let counter = true;
    setInterval(() => {
        if (counter) {
            counter = false;
            bot.user.setActivity(";help-liftoff", {
                type: "LISTENING"
            });
        } else {
            counter = true;
            bot.user.setActivity("soviet wave", {
                type: "LISTENING"
            });
        }
    }, 35000);
};

exports.getEventRoleInfo = serverID => {
    return new Promise(resolve => {
        db.each(
            "SELECT * FROM events WHERE server_id = ?",
            [serverID],
            (err, row) => {
                if (err) {
                    console.error(err.message);
                }
                resolve({
                    channelId: row.channel_id,
                    roleId: row.role_id
                });
            }
        );
    });
};
exports.checkPingRoleServerEntry = serverID => {
    return new Promise(resolve => {
        db.get(
            "SELECT * FROM ping_roles WHERE server_id = ?",
            [serverID]).then(
            row => {
                resolve(row);
            }
        );
    });
};
exports.pingRole = roleInstance => {
    return new Promise(res => {
        roleInstance
            .setMentionable(true, "Role needs to be pinged")
            .then(state => {
                res(`<@&${state.id}>`);
            })
            .catch(console.error);
    });
};

exports.checkPingRoleExist = (serverID, roles) => {
    return new Promise(resolve => {
        db.get("Select * FROM ping_roles WHERE role_id = ? AND server_id = ?", [
            roles[0],
            serverID
        ]).then(row => {
            if (typeof row === "undefined") {
                resolve({
                    state: "new",
                    row: row
                });
            } else {
                resolve({
                    state: "exists",
                    row: row
                });
            }
        });
    });
};

exports.makeNewPingRole = (serverID, roles) => {
    return new Promise(resolve => {
        exports.checkPingRoleServerEntry(serverID).then(cond => {
            console.log(cond);
            if (cond) {
                db.run("UPDATE ping_roles SET role_id = ? WHERE server_id = ?", [
                    roles[0],
                    serverID
                ]).then(res => {
                    if (res.changes) {
                        resolve("updated");
                    }
                });
            } else {
                db.run("INSERT INTO ping_roles (role_id, server_id) VALUES (?1, ?2)", {
                    1: roles[0],
                    2: serverID
                }).then(res => {
                    if (!res.changes) {
                        resolve("problem");
                    } else {
                        resolve("done");
                    }
                });
            }
        });
    });
};
exports.checkIfEventChannelExists = serverID => {
    return new Promise(resolve =>
        db.get("SELECT * FROM events WHERE server_id = ?", [serverID]).then(row => {
            if (row) {
                resolve({
                    state: "exists",
                    row: row
                });
            } else {
                resolve({
                    state: "new",
                    row: ""
                });
            }
        })
    );
};
exports.registerRole = (serverID, role) => {
    return new Promise(resolve => {
        db.run(
            "INSERT INTO events (server_id, role_id, channel_Id) VALUES (?1, ?2, ?3)", {
                1: serverID,
                2: role[0],
                3: role[1]
            }
        ).then(res => {
            if (!res.changes) {
                resolve("problem");
            } else {
                resolve("done");
            }
        });
    });
};
exports.changeChannel = (serverID, roles) => {
    return new Promise(resolve => {
        db.run("UPDATE events SET channel_id = ? WHERE server_id = ?", [
            roles[1],
            serverID
        ]).then(res => {
            if (res.changes) {
                resolve();
            }
        });
    });
};
exports.changeRole = (serverID, roles) => {
    return new Promise(resolve => {
        db.run("UPDATE events SET role_id = ? WHERE server_id = ?", [
            roles[0],
            serverID
        ]).then(res => {
            if (res.changes) {
                resolve();
            }
        });
    });
};
exports.changeRoleAndChannel = (serverID, roles) => {
    return new Promise(resolve => {
        db.run(
            "UPDATE events SET role_id = ?1, channel_id = ?2 WHERE server_id = ?3", {
                1: roles[0],
                2: roles[1],
                3: serverID
            }
        ).then(res => {
            if (res.changes) {
                resolve();
            }
        });
    });
};