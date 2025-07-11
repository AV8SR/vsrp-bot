const mongoose = require('mongoose');
const { MONGO_URI } = require('../config.json');

module.exports = {
  name: 'ready', // Adjust the event name as needed (e.g., 'ready' for when the bot starts)
  once: true, // Set to true if this event should only fire once (e.g., when the bot starts)
  async execute(client) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log("Connected to database");
    } catch (error) {
      console.error("Unable to connect to database:", error);
    }
  },
};