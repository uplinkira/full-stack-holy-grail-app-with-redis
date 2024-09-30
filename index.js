const express = require('express');
const redis = require('redis');
const app = express();

// Create Redis client
const client = redis.createClient(process.env.REDIS_URL || 'redis://localhost:6379');

client.on('connect', () => console.log('Redis Client Connected'));
client.on('error', (err) => console.log('Redis Client Error', err));

// Initialize Redis values
function initializeRedis(callback) {
  client.mset([
    'header', '0',
    'left', '0',
    'article', '0',
    'right', '0',
    'footer', '0'
  ], (err, reply) => {
    if (err) {
      console.error('Error initializing Redis:', err);
    } else {
      console.log('Redis initialized');
    }
    callback(err);
  });
}

// Implement data() method
function getData(callback) {
  client.mget(['header', 'left', 'article', 'right', 'footer'], (err, values) => {
    if (err) {
      return callback(err);
    }
    const data = {
      header: parseInt(values[0] || '0'),
      left: parseInt(values[1] || '0'),
      article: parseInt(values[2] || '0'),
      right: parseInt(values[3] || '0'),
      footer: parseInt(values[4] || '0')
    };
    callback(null, data);
  });
}

// Serve static files
app.use(express.static('public'));

// Get data endpoint
app.get('/data', (req, res) => {
  getData((err, data) => {
    if (err) {
      res.status(500).json({ error: 'Error retrieving data' });
    } else {
      res.json(data);
    }
  });
});

// Update endpoint
app.get('/update/:key/:value', (req, res) => {
  const { key, value } = req.params;
  client.incrby(key, parseInt(value), (err) => {
    if (err) {
      res.status(500).json({ error: 'Error updating data' });
    } else {
      getData((err, data) => {
        if (err) {
          res.status(500).json({ error: 'Error retrieving updated data' });
        } else {
          res.json(data);
        }
      });
    }
  });
});

const port = process.env.PORT || 3000;

// Start the server and initialize Redis
initializeRedis((err) => {
  if (err) {
    console.error('Failed to initialize Redis. Exiting.');
    process.exit(1);
  } else {
    app.listen(port, () => console.log(`Server running on port ${port}`));
  }
});