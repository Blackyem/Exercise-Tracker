const express = require('express');
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const colors = require("colors")

const cors = require('cors');


const app = express();
dotenv.config();

app.use(cors());

app.use(express.static('public'));

// Parse Application/Json....
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());


// Mongo Config.....  
mongoose.connect(process.env.DB_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

const userShema = mongoose.Schema({
  username: {
    type: String,
    require: true,
  }
}, {
  versionKey: false
});


const exerciseSchema = mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date,
  userId: String
}, {
  versionKey: false
});


const User = mongoose.model("User", userShema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/api/users", async (req, res) => {
  const users = await User.find();
  res.send(users);
});


app.get("/api/users/:_id/logs", async (req, res) => {
  let {
    from,
    to,
    limit
  } = req.query
  const userId = req.params._id
  const foundUser = await User.findById(userId)

  const filter = {
    userId
  }
  let dateFilter = {};
  if (from) {
    dateFilter["$gte"] = new Date(from);
  }

  if (to) {
    dateFilter["$lte"] = new Date(to);
  }
  if (from || to) {
    filter.date = dateFilter
  }

  if (!limit) {
    limit = 100;
  }

  let exercises = await Exercise.find(filter).limit(limit)
  exercises = exercises.map((exercise) => {
    return {
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    }
  });

  if (!foundUser) {
    res.json({
      message: "The user with that Id is not found"
    })
  }


  res.json({
    username: foundUser.username,
    count: exercises.length,
    _id: userId,
    logs: exercises
  })
});



app.post("/api/users", async (req, res) => {
  const username = req.body.username;
  const foundUser = await User.findOne({
    username
  });

  if (foundUser) {
    res.json(foundUser);
  }

  const user = await User.create({
    username
  })
  res.json(user);
});


app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id;
  const userId = req.body[":_id"]
  const foundUser = await User.findById(userId)

  let {
    description,
    duration,
    date,
  } = req.body;



  if (!foundUser) {
    res.json({
      message: "The user with that Id is not found"
    })
  }


  if (!date) {
    date = new Date()
  } else {
    date = new Date(date)
  }


  const exercise = await Exercise.create({
    username: foundUser.username,
    description,
    duration,
    date,
    userId
  })

  res.send({
    username: foundUser.username,
    description,
    duration,
    date: date.toDateString(),
    _id: id
  })

});


const PORT = process.env.PORT;

const listener = app.listen(process.env.PORT || 4050, () => {
  console.log(`Your app is listening on port ${PORT}`.magenta)
})