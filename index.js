const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log("Connected to the database"))
.catch(err => console.error(err));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: Date
});
const userSchema = new mongoose.Schema({
  username: String,
  log: [exerciseSchema]
});
const User = mongoose.model("User", userSchema);



app.post("/api/users", (req, res) => {
  try {
    const user = new User({username: req.body.username});
    user.save();
    res.json({username: user.username, _id: user._id});
  }
  catch (err) {
    console.error(err);
  }
})

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  }
  catch (err) {
    console.error(err);
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const exercise = {
      description: req.body.description,
      duration: (req.body.duration) ? parseInt(req.body.duration) : 0,
      date: req.body.date ? new Date(req.body.date) : new Date()
    };

    const user = await User.findById(req.params._id);
    user.log.push(exercise);
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      date: exercise.date.toDateString(),
      duration: exercise.duration,
      description: exercise.description
    });
  }
  catch (err) {
    console.error(err);
    res.json({ error: "Error occurred while saving the exercise." });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    let logs = user.log;

    // Handling the query parameters: from, to, and limit
    let from = req.query.from ? new Date(req.query.from) : new Date(0); // default to the oldest date if no "from"
    let to = req.query.to ? new Date(req.query.to) : new Date(); // default to current date if no "to"
    let limit = req.query.limit ? parseInt(req.query.limit) : logs.length;

    // Filtering logs within the date range
    logs = logs.filter(log => log.date >= from && log.date <= to);
    logs = logs.slice(0, limit); // Limit the number of logs if provided

    // Returning the logs in the expected format
    res.json({
      _id: user._id,
      username: user.username,
      count: logs.length,
      log: logs.map(log => ({
        description: log.description,
        duration: log.duration,
        date: log.date.toDateString() // Format the date as a string
      }))
    });
  }
  catch (err) {
    console.error(err);
    res.json({ error: "Error occurred while fetching the logs." });
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
