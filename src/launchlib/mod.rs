use chrono::{DateTime, TimeZone, Utc};
use serde::Deserialize;
use serenity::builder::CreateMessage;
use serenity::utils::Colour;

const LAUNCH_LIB_URL: &str = "https://launchlibrary.net/1.4/launch?mode=verbose";

#[macro_export]
macro_rules! deref {
    ( $struct : ident<$($gen: tt),+>, $target : ty, $body : ident ) => {
        impl<$($gen),+> std::ops::Deref for $struct <$($gen),+> {
            type Target = $target;

            fn deref(&self) -> &Self::Target {
                &self.$body
            }
        }
    };
    ( $struct : ty, $target : ty, $body : ident ) => {
        impl std::ops::Deref for $struct {
            type Target = $target;

            fn deref(&self) -> &Self::Target {
                &self.$body
            }
        }
    };

}

#[derive(Debug, Deserialize)]
pub struct Launches {
    pub launches: Vec<Launch>,
}

deref!(Launches, Vec<Launch>, launches);

#[allow(non_snake_case)]
#[derive(Debug, Clone, Deserialize)]
pub struct Rocket {
    pub imageURL: String,
}

#[allow(non_snake_case)]
#[derive(Debug, Clone, Deserialize)]
pub struct Launch {
    pub id: u64,
    pub name: String,
    pub windowstart: String,
    pub windowend: String,
    pub net: String,
    pub status: u8,
    pub infoURLs: Vec<String>,
    pub vidURLs: Vec<String>,
    pub rocket: Rocket,
    pub missions: Vec<Mission>,
    pub location: Location,
    pub lsp: Lsp,
}

#[allow(non_snake_case)]
#[derive(Debug, Clone, Deserialize)]
pub struct Location {
    pub name: String,
    pub countryCode: String,
}

#[allow(non_snake_case)]
#[derive(Debug, Clone, Deserialize)]
pub struct Lsp {
    pub name: String,
    pub countryCode: String,
    pub wikiURL: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Mission {
    pub description: Option<String>,
}

impl Launches {
    pub async fn get_recent_launch() -> reqwest::Result<Self> {
        let url = format!("{}&next=1", LAUNCH_LIB_URL);
        let response = reqwest::get(&url);
        let launches: Launches = response.await?.json().await?;
        Ok(launches)
    }

    pub async fn get_n_launch(n: u8) -> reqwest::Result<Self> {
        let url = format!("{}&next={}", LAUNCH_LIB_URL, n);
        let response = reqwest::get(&url);
        let launches: Launches = response.await?.json().await?;
        Ok(launches)
    }
    pub fn get_embed_recent<'a, 'b>(
        launch: Launch,
        m: &'b mut CreateMessage<'a>,
    ) -> &'b mut CreateMessage<'a> {
        m.embed(|e| {
            e.title(&launch.name).color(Colour::DARK_GREEN);
            if launch.rocket.imageURL.contains("http") {
                e.thumbnail(&launch.rocket.imageURL);
            }
            e.description(
                &launch
                    .missions
                    .get(0)
                    .unwrap()
                    .description
                    .as_ref()
                    .unwrap_or(&"No description available".to_string()),
            )
            .field("**Launch Time**", &launch.windowstart, false)
            .field("**Time left**", time_left(&launch.windowstart), false)
            .field("**Location**", &launch.location.name, false)
            .field("**Organisation**", &launch.lsp.name, false)
            .field("**Country Code**", &launch.lsp.countryCode, false)
            .field("**Source**", "http://www.launchlibrary.net/", false)
            .field(
                "**Wiki**",
                &launch
                    .lsp
                    .wikiURL
                    .as_ref()
                    .unwrap_or(&"Not available".to_string()),
                false,
            )
            .field(
                "**Stream**",
                launch
                    .vidURLs
                    .get(0)
                    .unwrap_or(&"Not available".to_string()),
                false,
            )
        })
    }
    pub fn get_n_recent<'a, 'b>(
        launches: Launches,
        m: &'b mut CreateMessage<'a>,
        n: u8,
    ) -> &'b mut CreateMessage<'a> {
        m.embed(|e| {
            e.title(format!("Recent {} launches", n));
            for launch in launches.iter() {
                let mut string = String::new();
                string.push_str(format!("**Name**: {}\n", &launch.name).as_str());
                string.push_str(format!("**Launch Time**: {}\n", &launch.windowstart).as_str());
                string.push_str(
                    format!("**Time Left**:{}\n", time_left(&launch.windowstart)).as_str(),
                );
                string.push_str(format!("**Organisation**: {}\n", &launch.lsp.name).as_str());
                string.push_str(format!("**Location**: {}\n", &launch.location.name).as_str());
                string.push_str(format!("**Country**: {}\n", &launch.lsp.countryCode).as_str());
                string.push_str(
                    format!(
                        "**Stream**: {}\n",
                        launch
                            .vidURLs
                            .get(0)
                            .unwrap_or(&"Not available".to_string()),
                    )
                    .as_str(),
                );
                e.field("Launch", string, false);
            }
            e
        })
    }
}

pub fn time_left(windowstart: &String) -> String {
    let d = Utc
        .datetime_from_str(windowstart, "%B %d, %Y %H:%M:%S UTC")
        .unwrap();
    let now_utc: DateTime<Utc> = Utc::now();
    let duration_since = d.signed_duration_since(now_utc);
    let secds = duration_since.num_seconds();
    format!(
        "{} days {} hours {} minutes",
        (secds % 2592000) / 86400,
        (secds % 86400) / 3600,
        (secds % 3600) / 60,
    )
}
