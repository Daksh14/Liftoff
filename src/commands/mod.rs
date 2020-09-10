use serenity::client::Context;
use serenity::framework::standard::{
    help_commands, macros::help, Args, CommandGroup, CommandResult, HelpOptions,
};
use serenity::model::id::{ChannelId, RoleId};
use serenity::model::prelude::Message;
use std::collections::HashSet;

use serenity::model::prelude::UserId;

pub mod db_commands;
pub mod launch_commands;

#[help]
#[individual_command_tip = "To know about a specific command, type ;help {command_name}"]
#[command_not_found_text = "Could not find: `{}`."]
#[strikethrough_commands_tip_in_dm = ""]
#[strikethrough_commands_tip_in_guild = ""]
async fn my_help(
    context: &Context,
    msg: &Message,
    args: Args,
    help_options: &'static HelpOptions,
    groups: &[&'static CommandGroup],
    owners: HashSet<UserId>,
) -> CommandResult {
    help_commands::with_embeds(context, msg, args, help_options, groups, owners).await;
    Ok(())
}

pub fn role(role_id_string: String) -> RoleId {
    let role_id_final = RoleId(
        role_id_string[3..role_id_string.len() - 1]
            .parse::<u64>()
            .unwrap(),
    );
    role_id_final
}

pub fn channel(channel_id_string: String) -> ChannelId {
    let channel_id_final = ChannelId(
        channel_id_string[2..channel_id_string.len() - 1]
            .parse::<u64>()
            .unwrap(),
    );
    channel_id_final
}
