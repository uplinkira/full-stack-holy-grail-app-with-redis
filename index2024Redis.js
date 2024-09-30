// Import required modules
const express = require('express');
const redis = require('redis');
const app = express();

// Create Redis client
const client = redis.createClient({
  url: 'redis://localhost:6379'
});

// Connect to Redis asynchronously
(async () => {
  await client.connect();
})();

// Handle Redis connection events
client.on('connect', () => console.log('Redis Client Connected'));
client.on('error', (err) => console.log('Redis Client Error', err));

// Initialize Redis values
async function initializeRedis() {
  // Set predefined keys and values directly
  await client.mSet({
    'header': '0',
    'left': '0',
    'article': '0',
    'right': '0',
    'footer': '0'
  });
}
// The initializeRedis() function directly passes an object to mSet(), explicitly setting the keys (header, left, article, right, footer) with a value of '0'. This makes the initialization easier to read and understand when dealing with a fixed set of keys.initializeRedis（）函数直接将一个对象传递给mSet（），显式设置键（header，left，article，right，footer）的值为'0'。这使得在处理一组固定的键时，初始化更容易阅读和理解。


initializeRedis(); // Call the initialization function

// Function to retrieve data from Redis
async function data() {
  const keys = ['header', 'left', 'article', 'right', 'footer']; // Keys to fetch from Redis
  const values = await client.mGet(keys); // Retrieve the values
  return Object.fromEntries(keys.map((key, i) => [key, parseInt(values[i])]));
}
// Values are converted to integers using parseInt(), ensuring that only whole numbers are returned:使用parseInt（）将值转换为整数，确保仅返回整数：

// Serve static files from the "public" directory
app.use(express.static('public'));

// Define a route to retrieve the current data
app.get('/data', async (req, res) => {
  const data = await data(); // Fetch the data
  res.json(data); // Send it as JSON
});

// Define a route to update a specific key's value
app.get('/update/:key/:value', async (req, res) => {
  const { key, value } = req.params; // Extract the key and value from the URL
  
  // Increment the value using Redis's `incrBy` method
  await client.incrBy(key, parseInt(value));
  
  const data = await data(); // Fetch the updated data
  res.json(data); // Send the updated data as JSON
});
// The Redis built-in incrBy() method is used to update the value of a key by a specified amount, reducing the complexity of manually fetching and setting values:Redis内置的incrBy（）方法用于将键的值更新指定的数量，减少手动获取和设置值的复杂性：


// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
