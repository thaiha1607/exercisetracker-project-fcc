const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app
  .route('/api/users')
  .get((req, res, next) => {
    // TODO
  })
  .post((req, res, next) => {
    // TODO
  });

app.post('/api/users/:_id/exercises', (req, res, next) => {
  // TODO
});

app.get('/api/users/:_id/logs', (req, res, next) => {
  // TODO
});

const PORT = process.env.PORT || 3000;
app.listen(PORT || 3000, () => {
  console.log('Your app is listening on port ' + PORT);
});
