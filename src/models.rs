#[derive(Queryable, Debug)]
pub struct Events {
    pub id: i32,
    pub server_id: String,
    pub role_id: String,
    pub channel_id: String,
}

impl Events {
    pub fn new() -> Self {
        Self {
            id: 0,
            server_id: String::new(),
            role_id: String::new(),
            channel_id: String::new(),
        }
    }
}
