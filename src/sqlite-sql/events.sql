BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "ping_roles" (
    "id"    INTEGER,
    "role_id"   TEXT,
    "server_id" TEXT,
    PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "events" (
    "id"    INTEGER PRIMARY KEY AUTOINCREMENT,
    "server_id" TEXT,
    "role_id"   TEXT,
    "channel_id"    TEXT
);
COMMIT;
