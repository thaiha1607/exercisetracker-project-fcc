require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log('Connected to MongoDB');
  }
});

const Schema = mongoose.Schema;
const userSchema = new Schema({
  username: { type: String, required: true },
  exercises: [
    {
      description: { type: String, required: true },
      duration: { type: Number, required: true },
      date: { type: Date, default: Date.now },
    },
  ],
});

class UserModel {
  constructor() {
    this.User = mongoose.model('User', userSchema);
  }
  /**
   * Create a new user
   * @param {string} username
   */
  async createNewUser(username) {
    const user = new this.User({ username });
    await user.save().catch((err) => {
      throw err;
    });
    return { username: user.username, _id: user.id };
  }
  /**
   * Get all users and return list of them
   */
  async allUsers() {
    const users = await this.User.find({}).catch((err) => {
      throw err;
    });
    return users.map((user) => {
      return { username: user.username, _id: user.id };
    });
  }
  /**
   * Find user by id and return it
   * @param {string} id
   */
  async findUserById(id) {
    const user = await this.User.findById(id).catch((err) => {
      throw err;
    });
    if (user === null) {
      throw new Error('User not found');
    }
    return user;
  }
  /**
   * Add exercise to specific user
   * @param {string} id
   * @param {{ description: string; duration: number; date?: string }} param1
   */
  async addExercise(id, { description, duration, date }) {
    let user;
    try {
      user = await this.findUserById(id);
    } catch (err) {
      throw err;
    }
    if (date === undefined) {
      user.exercises.push({ description, duration });
    } else user.exercises.push({ description, duration, date });
    await user.save().catch((err) => {
      throw err;
    });
    return {
      username: user.username,
      description,
      duration,
      date: user.date.toDateString(),
      _id: user.id,
    };
  }
  /**
   * Get exercises of specific user
   * @param {string} id
   * @param {{ from?: string; to?: string; limit?: number }} param1
   */
  async getExercises(id, { from, to, limit }) {
    let user;
    try {
      user = await this.findUserById(id);
    } catch (err) {
      throw err;
    }
    const log = user.exercises;
    const filteredLog = log
      .filter((exercise) => {
        let isInRange = true;
        if (from) {
          isInRange = isInRange && exercise.date >= new Date(from);
        }
        if (to) {
          isInRange = isInRange && exercise.date <= new Date(to);
        }
        return isInRange;
      })
      .sort((a, b) => {
        return a.date - b.date;
      })
      .slice(0, limit === undefined ? log.length : limit)
      .map((exercise) => {
        return {
          ...exercise,
          date: exercise.date.toDateString(),
        };
      });
    return {
      username: user.username,
      count: filteredLog.length,
      _id: user.id,
      log: filteredLog,
      ...(from && { from }),
      ...(to && { to }),
      ...(limit && { limit }),
    };
  }
}

exports.UserModel = UserModel;
