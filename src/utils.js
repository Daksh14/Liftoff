"use strict";
const moment = require("moment");
const Launch = require("launchlib-js");
const launchLib = new Launch();

exports.getTimeLeftString = launch => {
  const duration = moment.duration(
    moment(new Date(launch.windowstart), "h:mm:s")
      .utc()
      .diff(moment(new Date(), "h:mm:s"))
  );
  return (
    duration.days() +
    " days " +
    duration.hours() +
    " hours " +
    duration.minutes() +
    " minutes"
  );
};
exports.getRecentLaunch = async () => {
  return new Promise(res => {
    launchLib
      .get("getLaunches", "1")
      .then(data => res(data.launches[0]))
      .catch(err => {
        console.log(err.message);
      });
  });
};
exports.getRecentnLaunches = async n => {
  return new Promise(res => {
    launchLib
      .get("getLaunches", n)
      .then(data => res(data))
      .catch(err => {
        console.log(err.message);
      });
  });
};

exports.filterRole = role =>
  role
    .replace("<", "")
    .replace(">", "")
    .replace("@", "")
    .replace("&", "")
    .replace("#", "");

exports.filterRoleFromPingerCommand = roleString =>
  roleString.replace(";!ping", "").replace(/^\s+/g, "");

exports.checkIfRoleIsPinged = role =>
  role.includes("@") || role.includes("&") || role.includes("!");
exports.noPermissions = "Insufficient permissions";
exports.pingerRoleNonExistent = "No role set as a pinger";
exports.forgotRoleMention = "You forgot to mention the role!";
exports.rolePingerExists = "The pinger role already exists";
exports.rolePingerSet = "Role pinger is set!";
exports.registerRoleSet = "Role successfully set";
exports.rolePingerUpdated = "Role pinger is updated!";
exports.wrongSyntax = "Wrong Syntax, try again";
exports.getRoleFromText = msg => msg.match(/(<).*?(>)/gm);
exports.registerFormatCheck = role =>
  !role[0].includes("@") ||
  !role[0].includes("&") ||
  !role[1].includes("#") ||
  role[1].includes("!") ||
  role[0].includes("!");

exports.problemOccured =
  "There's a problem, please try again, if the problem persists then report at the discord server https://discord.gg/w9J8suk";

exports.fromNow = windowstart => moment(new Date(windowstart)).fromNow();
