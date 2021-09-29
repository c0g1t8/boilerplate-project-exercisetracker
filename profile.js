let mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: {
    type: Date,
    default: Date.now,
    transform: v => v.toDateString()
  }
},
  {
    _id: false
  });

const profileSchema = new mongoose.Schema({
  username: {
    type: String, required: true
  },
  count: {
    type: Number, default: 0
  },
  log: [logSchema
  ]
});

const Profile = mongoose.model('Profile', profileSchema);

exports.ProfileModel = Profile;
