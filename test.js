const client = require('discord-rich-presence')('646973093117558794');

client.updatePresence({
  state: 'slithering',
  details: '🐍',
  startTimestamp: Date.now(),
  endTimestamp: Date.now() + 1337,
  largeImageKey: 'snek_large',
  smallImageKey: 'snek_small',
  instance: true,
});
