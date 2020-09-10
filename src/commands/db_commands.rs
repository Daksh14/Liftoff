use crate::db_lock;
use crate::lock;
use crate::Events;
use diesel::prelude::*;
use serenity::client::Context;
use serenity::framework::standard::{
    macros::{command, group},
    Args, CommandResult,
};
use serenity::model::id::{ChannelId, RoleId};
use serenity::model::prelude::Message;
use std::str::FromStr;

#[group]
#[commands(eventrole, register)]
struct DatabaseCommands;

#[command]
#[only_in(guilds)]
#[description = "Echos the channel id and roles to ping on launches \n Usage: ;eventrole"]
async fn eventrole(ctx: &Context, msg: &Message) -> CommandResult {
    let mut msg_string = String::new();
    let mut embeds_string = String::new();

    use crate::schema::events::dsl::*;
    lock!(|db| {
        match events
            .filter(server_id.eq(msg.guild_id.unwrap().as_u64().to_string()))
            .first::<Events>(db)
        {
            Err(_) => msg_string.push_str("You haven't registered an event role for this server"),
            Ok(x) => embeds_string.push_str(
                format!("role is {} and channel is {}", x.role_id, x.channel_id).as_str(),
            ),
        }
    });

    if msg_string.len() != 0 {
        msg.channel_id.say(ctx, msg_string).await?;
    } else {
        msg.channel_id
            .send_message(ctx, |m| {
                m.embed(|e| {
                    e.title("Role and channel to ping and message on event")
                        .description(embeds_string)
                })
            })
            .await?;
    }

    Ok(())
}

#[command]
#[only_in(guilds)]
#[required_permissions("ADMINISTRATOR")]
#[description = "Register an event role to ping channel id to send launches. \n Usage: ;register {@role} {#channel}"]
async fn register(ctx: &Context, msg: &Message, args: Args) -> CommandResult {
    let mut msg_string = String::new();
    use crate::schema::events::dsl::*;
    use diesel::insert_into;
    let mut peekable = args.rest().split(" ").peekable();
    if !peekable.peek().is_some() {
        msg.channel_id.say(ctx, "Wrong syntax, try again").await?;
    }
    while peekable.peek().is_some() {
        if peekable.peek().unwrap().len() != 0 {
            let role = RoleId::from_str(peekable.next().unwrap())?;
            let channel = ChannelId::from_str(peekable.next().unwrap())?;
            lock!(|db| {
                match events
                    .filter(server_id.eq(msg.guild_id.unwrap().as_u64().to_string()))
                    .first::<Events>(db)
                {
                    Err(_) => {
                        match insert_into(events)
                            .values((
                                server_id.eq(msg.guild_id.unwrap().as_u64().to_string()),
                                role_id.eq(format!("<@&{}>", role.to_string())),
                                channel_id.eq(format!("<#{}>", channel.to_string())),
                            ))
                            .execute(db)
                        {
                            Ok(_) => msg_string.push_str("Registered!"),
                            Err(_) => msg_string
                                .push_str("Issues in pushing id to the database, please try again"),
                        }
                    }
                    Ok(_) => {
                        msg_string.push_str("Entry already exists for this server");
                    }
                }
            });
            break;
        } else {
            msg_string.push_str("Wrong syntax, try again");
        }
    }
    msg.channel_id.say(ctx, msg_string).await?;

    Ok(())
}
