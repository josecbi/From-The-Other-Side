CREATE TABLE IF NOT EXISTS sightings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL,
        location TEXT NOT NULL,
        timeStamp TEXT NOT NULL,
        title TEXT NOT NULL,
        text TEXT NOT NULL
    );