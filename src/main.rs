#[macro_use]
extern crate diesel;
#[macro_use]
extern crate lazy_static;

use crate::commands::{
    channel, db_commands::DATABASECOMMANDS_GROUP, launch_commands::LAUNCHCOMMANDS_GROUP, role,
    MY_HELP,
};
use crate::launchlib::*;
use crate::models::Events;
use colored::*;
use diesel::prelude::*;
use rtoml::ast::Node::Value;
use rtoml::ast::TomlValue::String;
use rtoml::parser::{RToml, Reader};
use serenity::async_trait;
use serenity::client::{Client, Context, EventHandler};
use serenity::framework::standard::StandardFramework;
use serenity::model::prelude::*;
use std::sync::Arc;
use tokio::time::{interval, Duration};

use std::sync::Mutex;

lazy_static! {
    static ref CON: Mutex<SqliteConnection> = Mutex::new(establish_connection());
    static ref TOML: Reader = RToml::file("bot.toml")
        .parse()
        .map_err(|_| panic!("{:?}", "bot.toml not found"))
        .ok()
        .unwrap();
    static ref MINUTES_LEFT: &'static str = "0 days 0 hours 15 minutes";
}

pub mod commands;
pub mod launchlib;
pub mod models;
pub mod schema;

struct Handler;

#[async_trait]
impl EventHandler for Handler {
    async fn ready(&self, _: Context, ready: Ready) {
        println!("{} is connected!", ready.user.name.red());
        println!("{}!", "And we have liftoff".green());
    }
}

#[tokio::main]
async fn main() {
    let launch_commands_framework = StandardFramework::new()
        .configure(|c| c.prefix(";"))
        .help(&MY_HELP)
        .group(&DATABASECOMMANDS_GROUP)
        .group(&LAUNCHCOMMANDS_GROUP);
    let val = TOML.get_table("bot_credentials");
    let token;
    if let Value(String(x)) = val.get("token").unwrap() {
        token = x;
    } else {
        panic!("But token missing");
    }
    let client = Client::new(token)
        .event_handler(Handler)
        .framework(launch_commands_framework)
        .await
        .expect("Error creating client");
    // start polling launches
    let mut arc = Arc::new(client);
    poll_launches(Arc::clone(&arc));
    if let Err(why) = Arc::get_mut(&mut arc).unwrap().start().await {
        println!("An error occurred while running the client: {:?}", why);
    }
}

pub fn poll_launches(client: Arc<Client>) {
    use crate::schema::events::dsl::*;

    let mut interval = interval(Duration::from_secs(10));
    let cache_and_http = Arc::clone(&(client).cache_and_http);
    task!({
        interval.tick().await;
        loop {
            let cache_and_http = Arc::clone(&cache_and_http);
            interval.tick().await;
            task!({
                let mut launches = Launches::get_recent_launch().await.unwrap();
                let launch = launches.launches.remove(0);
                if time_left(&launch.windowstart) == *MINUTES_LEFT {
                    let mut guilds = vec![Events::new()];
                    lock!(|db| {
                        if let Ok(guild_info) = events.load::<Events>(db) {
                            guilds = guild_info
                        } else {
                            panic!("{:?}", "Cannot read guilds");
                        }
                    });
                    for guild in guilds.iter() {
                        let cache_and_http = Arc::clone(&cache_and_http);
                        let id_server = guild.server_id.parse::<u64>().unwrap();
                        if let Some(guild_instance) = GuildId::from(id_server)
                            .to_guild_cached(cache_and_http.cache.clone())
                            .await
                        {
                            let role_id_final = role(guild.role_id.to_string());
                            if let Some(role) = guild_instance.roles.get(&role_id_final) {
                                Role::edit(role, cache_and_http.http.clone(), |r| {
                                    r.mentionable(true)
                                })
                                .await
                                .unwrap();

                                let channel_id_final = channel(guild.channel_id.to_string());
                                if let Some(channel) =
                                    guild_instance.channels.get(&channel_id_final)
                                {
                                    if let Ok(_) = channel
                                        .send_message(cache_and_http.http.clone(), |e| {
                                            e.content(format!(
                                                "Launch incoming {}",
                                                guild.role_id.to_string()
                                            ));
                                            Launches::get_embed_recent(launch.clone(), e)
                                        })
                                        .await
                                    {
                                        Role::edit(role, cache_and_http.http.clone(), |r| {
                                            r.mentionable(false)
                                        })
                                        .await
                                        .unwrap();
                                    }
                                }
                            }
                        }
                    }
                }
            });
        }
    });
}

pub fn establish_connection() -> SqliteConnection {
    let val = TOML.get_table("bot_credentials");
    let database_url;
    if let Value(String(x)) = val.get("db").unwrap() {
        database_url = x;
    } else {
        panic!("database entry missing in bot.toml");
    }
    if let Ok(connection) = SqliteConnection::establish(&database_url) {
        println!("database is {}", "connected".red());
        connection
    } else {
        panic!("{} ugh", "Database not found".red());
    }
}

pub fn db_lock<F: FnOnce(&SqliteConnection)>(f: F) {
    let lock = &(*CON.lock().unwrap());
    f(lock)
}

#[macro_export]
macro_rules! task {
    ( $method : expr ) => {
        tokio::spawn(async move { $method })
    };
}

#[macro_export]
macro_rules! lock {
    ( $method : expr ) => {
        db_lock($method)
    };
}
