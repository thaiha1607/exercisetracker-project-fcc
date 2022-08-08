'use strict';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

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
      date: { type: Date, required: true },
    },
  ],
});

/**
 * Check if the given date is valid
 * @param {string?} dateString
 */
export async function isValidDate(dateString) {
  if (!dateString) {
    return undefined;
  }
  let regEx = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString.match(regEx)) return false;
  let dateObj = new Date(dateString);
  let dateObjNum = dateObj.getTime();
  if (!dateObjNum && dateObjNum !== 0) return false;
  return dateObj.toISOString().slice(0, 10) === dateString;
}

/**
 * Check if the given ID is valid
 * @param {string} id
 */
export async function isValidID(id) {
  return !!id && !!id.match(/^[0-9a-fA-F]{24}$/);
}

export class UserModel {
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
    const users = await this.User.find({})
      .lean()
      .exec()
      .catch((err) => {
        throw err;
      });
    return users.map((user) => {
      return { username: user.username, _id: user._id };
    });
  }
  /**
   * Add exercise to specific user
   * @param {string} id
   * @param {{ description: string; duration: number; date?: string }} param1
   */
  async addExercise(id, { description, duration, date }) {
    const dateObj = !date
      ? new Date().toDateString()
      : new Date(date).toDateString();
    const user = await this.User.findByIdAndUpdate(
      id,
      {
        $push: {
          exercises: {
            description,
            duration,
            date: dateObj,
          },
        },
      },
      { new: true }
    )
      .lean()
      .exec()
      .catch((err) => {
        throw err;
      });
    if (user === null) {
      throw new Error('User not found');
    }
    return {
      username: user.username,
      description,
      duration,
      date: dateObj,
      _id: user._id,
    };
  }
  /**
   * Get user logs
   * @param {string} id
   * @param {{ from?: string; to?: string; limit?: number }} param1
   */
  async getUserLogs(id, { from, to, limit }) {
    const user = await this.User.findById(id)
      .lean()
      .exec()
      .catch((err) => {
        throw err;
      });
    if (user === null) {
      throw new Error('User not found');
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
      _id: user._id,
      log: filteredLog,
      ...(from && { from }),
      ...(to && { to }),
      ...(limit && { limit }),
    };
  }
}
