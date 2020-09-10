use crate::Launches;
use serenity::client::Context;
use serenity::framework::standard::{
    macros::{command, group},
    Args, CommandResult,
};
use serenity::model::prelude::Message;

#[group]
#[commands(nextlaunch, launchlist)]
struct LaunchCommands;

#[command]
#[description = "Show most recent launch \n Usage: ;nextlaunch"]
async fn nextlaunch(ctx: &Context, msg: &Message) -> CommandResult {
    let mut launches = Launches::get_recent_launch().await?;
    let val = launches.launches.remove(0);
    msg.channel_id
        .send_message(ctx, |m| Launches::get_embed_recent(val, m))
        .await?;
    Ok(())
}

#[command]
#[description = "Show next x launches \n Usage: ;launchlist x"]
async fn launchlist(ctx: &Context, msg: &Message, mut args: Args) -> CommandResult {
    const ERR_MSG: &str = "The argument should be an **integer** between 1 and 10";

    if let Ok(x) = args.single::<u8>() {
        let launches = Launches::get_n_launch(x).await?;
        if x != 0 && x <= 10 {
            msg.channel_id
                .send_message(ctx, |m| Launches::get_n_recent(launches, m, x))
                .await?;
        } else {
            msg.channel_id.say(ctx, ERR_MSG).await?;
        }
    } else {
        let launches = Launches::get_n_launch(3).await?;
        msg.channel_id
            .send_message(ctx, |m| Launches::get_n_recent(launches, m, 3))
            .await?;
    }

    Ok(())
}
