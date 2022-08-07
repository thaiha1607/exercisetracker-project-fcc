'use strict';

import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
const app = express();

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { isValidDate, isValidID, UserModel } from './model.js';
const UserObj = new UserModel();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app
  .route('/api/users')
  .get(async (req, res, next) => {
    try {
      const users = await UserObj.allUsers();
      res.status(200).json(users);
    } catch (err) {
      next(err);
    }
  })
  .post(async (req, res, next) => {
    const { username } = req.body;
    if (!username) {
      res.status(400).send('Username is required');
      return;
    }
    try {
      const user = await UserObj.createNewUser(username);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  });

app.post('/api/users/:_id/exercises', async (req, res, next) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  const isValidFields = await Promise.all([
    isValidID(_id),
    (async (desc) => !!desc)(description),
    (async (dur) => {
      let result = parseFloat(dur);
      return result !== NaN && result >= 0;
    })(duration),
    isValidDate(date),
  ]);
  if (!isValidFields.every((x) => (x === undefined ? true : x))) {
    res.status(400).send('Invalid request');
    return;
  }
  try {
    const user = await UserObj.addExercise(_id, {
      description,
      duration: parseFloat(duration),
      date,
    });
    res.status(201).json(user);
  } catch (err) {
    if (err.message === 'User not found') {
      res.status(404).json({ message: 'User not found' });
    } else next(err);
  }
});

app.get('/api/users/:_id/logs', async (req, res, next) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;
  const isValidFields = await Promise.all([
    isValidID(_id),
    (async (lim) => {
      if (lim === undefined) return undefined;
      let result = parseInt(lim);
      return result !== NaN && result >= 0;
    })(limit),
    isValidDate(from),
    isValidDate(to),
  ]);
  if (!isValidFields.every((x) => (x === undefined ? true : x))) {
    res.status(400).send('Invalid request');
    return;
  }
  try {
    const user = await UserObj.getUserLogs(_id, { from, to, limit });
    res.status(200).json(user);
  } catch (err) {
    if (err.message === 'User not found') {
      res.status(404).json({ message: 'User not found' });
    } else next(err);
  }
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT || 3000, () => {
  console.log('Your app is listening on port ' + PORT);
});
