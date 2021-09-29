const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config()

app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// mongoose/mongodb stuff
const mySecret = process.env['MONGO_URI'];
const mongoose = require('mongoose');
mongoose.connect(mySecret);
const Profile = require('./profile.js').ProfileModel;

app.post('/api/users', (req, res) => {
  if (req.body.username) {
    const profile = new Profile({ username: req.body.username });
    profile.save((err, data) => {
      if (err) return console.error(err);
      res.json({
        username: data.username,
        _id: data._id
      });
    });
  } else {
    res.send('Path `username` is required.')
  }
});

app.get('/api/users', (req, res) => {
  Profile
    .find({})
    .select(['_id', 'username'])
    .exec(
      (err, data) => {
        if (err) return console.error(err);
        res.json(data);
      }
    );
});

app.post('/api/users/:_id/exercises', (req, res) => {
  Profile.findById({ _id: req.params._id }, (err, data) => {
    if (err) {
      res.send(err.message);
    } else if (!data) {
      res.send('Unknown userId');
    } else {
      let exercise = {};
      if (!req.body.description) {
        res.send("Path `description` is required.");
      } else if (!req.body.duration) {
        res.send("Path `duration` is required.");
      } else {
        // populate exercise record
        if (req.body.date) {
          exercise.date = new Date(req.body.date);
        }
        exercise.duration = +req.body.duration;
        exercise.description = req.body.description;
        //
        data.log.push(exercise);
        // add to log
        data.count = data.log.length;
        // update profile
        data.save();
        //
        const logEntry = data.log[data.count - 1];
        //
        res.json({
          _id: data._id,
          username: data.username,
          description: logEntry.description,
          duration: logEntry.duration,
          date: logEntry.toJSON().date
        });
      };
    };
  });
});

app.get('/api/users/exercises', (req, res) => {
  res.send('not found');
});

app.get('/api/users/:_id/logs', (req, res) => {
  Profile.findById({ _id: req.params._id }, (err, data) => {
    if (err) {
      res.send(err.message);
    } else if (!data) {
      res.send('Unknown userId');
    } else {
      // filter based on date
      const filter = {};
      if (req.query.from) { filter.$gte = new Date(req.query.from) };
      if (req.query.to) { filter.$lte = new Date(req.query.to) };
      data.log.forEach((e, i, a) => {
        if (e.date < filter.$gte || e.date > filter.$lte) {
          a.splice(i, 1);
        };
      })
      // limit number of log entries being returned
      if (req.query.limit) {
        data.log.splice(req.query.limit);
      }
      const result = data.toJSON();
      //
      delete result.__v;
      res.json(result);
    };
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
