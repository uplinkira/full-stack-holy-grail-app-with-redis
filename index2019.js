// Import the Express framework to set up a web server
// 导入Express框架以设置Web服务器
var express = require("express");

// Initialize the Express application
// 初始化Express应用程序
var app = express();

// Import the Redis client to interact with a Redis database
// 导入Redis客户端以与Redis数据库交互
var redis = require("redis");

// Create a new Redis client instance to connect to the Redis server
// 创建一个新的Redis客户端实例以连接到Redis服务器
var client = redis.createClient();

// Middleware to serve static files from the "public" directory.
// 中间件，用于从"public"目录提供静态文件
// This allows the server to serve files like HTML, CSS, and JavaScript from the public folder.
// 这允许服务器从public文件夹提供HTML、CSS和JavaScript文件。
app.use(express.static("public"));

// Initialize Redis with default key-value pairs.
// 使用默认键值对初始化Redis
// `mset` sets multiple keys and values in the Redis database.
// `mset`在Redis数据库中设置多个键和值。
client.mset(
  "header", 0,      // Set 'header' key to 0
  "left", 0,        // Set 'left' key to 0
  "article", 0,     // Set 'article' key to 0
  "right", 0,       // Set 'right' key to 0
  "footer", 0       // Set 'footer' key to 0
);

// Retrieve the values for "header", "left", "article", "right", and "footer" keys from Redis.
// 从Redis检索"header"、"left"、"article"、"right"和"footer"键的值。
// `mget` retrieves multiple keys at once. The callback function is used to handle the results.
client.mget(["header", "left", "article", "right", "footer"], function (err, value) {
  console.log(value); // Log the retrieved values to the console.
});

// Function to retrieve data as a Promise.
// 函数以Promise形式检索数据。
// It fetches the values of "header", "left", "article", "right", and "footer" keys from Redis.
// 从Redis检索"header"、"left"、"article"、"right"和"footer"键的值。
// The promise allows for asynchronous handling of the data retrieval.
// 承诺允许异步处理数据检索。
function data() {
  return new Promise((resolve, reject) => {
    client.mget(["header", "left", "article", "right", "footer"], function (err, value) {
      // Create an object that stores the values from Redis, converting them to numbers.
      // 创建一个对象，将来自Redis的值存储为数字。
      const data = {
        header: Number(value[0]),    // Convert 'header' value to a number
        left: Number(value[1]),      // Convert 'left' value to a number
        article: Number(value[2]),   // Convert 'article' value to a number
        right: Number(value[3]),     // Convert 'right' value to a number
        footer: Number(value[4]),    // Convert 'footer' value to a number
      };
      // If there's an error, reject the promise with null, otherwise resolve with the data object.
      // 如果出错，则以null拒绝承诺，否则以数据对象解决。
      err ? reject(null) : resolve(data);
    });
  });
}

// Define a GET route for "/data".
// 定义一个GET路由"/data"。
// This route retrieves the current values of the keys from Redis and sends them as a response.
// 此路由从Redis检索当前键的值，并将其作为响应发送。
app.get("/data", function (req, res) {
  // Call the data() function to fetch the values asynchronously.
  data().then((data) => {
    console.log(data);   // Log the data to the console.
    res.send(data);      // Send the data object as a JSON response to the client.
  });
});

// Define a dynamic GET route for updating a specific key with a value.
// 定义一个动态GET路由，用于更新具有值的特定键。
// Route format: "/update/:key/:value", where `:key` is the Redis key to update, and `:value` is the value to add.
// 路由格式："/update/:key/:value"，其中`:key`是要更新的Redis键，`:value`是要添加的值。
app.get("/update/:key/:value", function (req, res) {
  const key = req.params.key;        // Extract the key from the route parameters.
  let value = Number(req.params.value); // Extract the value, converting it to a number.
  
  // Retrieve the current value of the specified key from Redis.
  // 从Redis检索指定键的当前值。
  client.get(key, function (err, reply) {
    // Update the value by adding the new value to the current value.
    // 通过将新值添加到当前值来更新值。
    value = Number(reply) + value;
    
    // Set the new value in Redis for the specified key.
    // 在Redis中为指定键设置新值。
    client.set(key, value);
    
    // Fetch the updated data and send it as a response.
    // 获取更新后的数据并将其作为响应发送。
    data().then((data) => {
      console.log(data);   // Log the updated data to the console.
      res.send(data);      // Send the updated data as a JSON response to the client.
    });
  });
});

// Start the Express server on port 3000.
// 在端口3000上启动Express服务器。
app.listen(3000, () => {
  console.log("Running on 3000");   // Log a message when the server is up and running.
  // 当服务器启动并运行时，记录一条消息。
});

// Gracefully handle the exit event to close the Redis client connection when the process exits.
// 优雅地处理退出事件，以在进程退出时关闭Redis客户端连接。
process.on("exit", function () {
  client.quit();   // Close the Redis connection to avoid hanging processes.
  // 关闭Redis连接以避免挂起进程。
});
