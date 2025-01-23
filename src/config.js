const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://riyaavermaa0001:mainproject@cluster0.1nxfo.mongodb.net/Project_2?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true }
);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

module.exports = db;