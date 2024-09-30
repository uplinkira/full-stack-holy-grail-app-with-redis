// This refactored version combines the best of both worlds: it uses modern JavaScript features and the latest Redis client methods while retaining the efficient multi-key operations and overall structure from the 2019 version. It's also more robust with better error handling and more flexible with environment-based configuration.这个重构版本结合了两个世界的最佳之处：它使用现代的JavaScript功能和最新的Redis客户端方法，同时保留了2019版本的高效多键操作和整体结构。它还具有更好的错误处理功能，并且在基于环境的配置方面更加灵活。

// Import required modules
const express = require("express"); // Import the Express module to create an HTTP server.
const redis = require("redis"); // Import the Redis client for connecting and interacting with a Redis database.
//导入redis模块，用于连接和与Redis数据库交互。
const app = express(); // Create an instance of an Express application.
//创建一个Express应用程序的实例。

// Create Redis client
const client = redis.createClient({
    url: 'redis://localhost:6379' // Specify the Redis server location. Here, it's hosted locally on port 6379.
});
//创建一个Redis客户端实例，连接到本地端口6379的Redis服务器。

// Connect to Redis asynchronously
//异步连接到Redis
(async () => {
    await client.connect(); // Connect to the Redis server asynchronously.
})();
//异步连接到Redis服务器。

// Event listener for successful connection
//成功连接事件监听器
client.on('connect', () => console.log('Redis Client Connected')); // Log a message when the Redis client connects successfully.

// Event listener for error handling
//错误处理事件监听器
client.on('error', (err) => console.log('Redis Client Error', err)); // Log an error message if the Redis client encounters an issue.

// Serve static files from the "public" directory
//从“public”目录提供静态文件
app.use(express.static("public")); // Use Express's static middleware to serve files from the "public" directory (e.g., HTML, CSS, JS files).
//使用Express的静态中间件从“public”目录提供静态文件（例如，HTML、CSS、JS文件）。

// Initialize Redis values for specific keys
//初始化Redis中特定键的值
async function initializeRedis() {
    const keys = ['header', 'left', 'article', 'right', 'footer']; // Define an array of keys corresponding to different page sections.
    //定义一个键数组，对应不同的页面部分。

    // Use the Redis 'mSet' function to set the initial value of each key to '0'. 
    //使用Redis的mSet函数将每个键的初始值设置为'0'。
    await client.mSet(
        keys.reduce((obj, key) => ({ ...obj, [key]: '0' }), {}) // Transform the keys array into an object where each key has a value of '0'.
        //将键数组转换为每个键的值为'0'的对象。
    );
    
    // Retrieve and log the current values for these keys to verify initialization.
    //检索并记录这些键的当前值，以验证初始化。
    console.log(await client.mGet(keys)); // Fetch and log the initial values of the keys in Redis.
    //从Redis中获取并记录这些键的初始值。
}

initializeRedis(); // Call the function to initialize Redis with default values.
//调用函数以使用默认值初始化Redis。

// Data retrieval function to get the values from Redis
//从Redis中检索数据的函数
async function data() {
    const keys = ['header', 'left', 'article', 'right', 'footer']; // Same set of keys as before.
    //定义一个键数组，对应不同的页面部分。
    
    // Use Redis 'mGet' to fetch the values of all these keys simultaneously.
    //使用Redis的mGet函数同时获取这些键的值。
    const values = await client.mGet(keys);
    
    // Convert the keys and their respective values into an object and return it.
    //将键和它们的值转换为对象并返回。
    // Convert each value from a string to a number using Number().
    //将每个值从字符串转换为数字。
    return Object.fromEntries(keys.map((key, i) => [key, Number(values[i])])); 
}

// GET route for retrieving current data from Redis
//从Redis中检索当前数据的GET路由
app.get("/data", async (req, res) => {
    try {
        const data = await data(); // Fetch the data using the 'data()' function.
        //使用'data（）'函数获取数据。
        console.log(data); // Log the data to the console for debugging purposes.
        //将数据记录到控制台，用于调试目的。
        res.json(data); // Send the data as a JSON response to the client.
        //将数据作为JSON响应发送给客户端。
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve data" }); // Send a 500 error response if something goes wrong.
        //如果出现问题，发送500错误响应。
    }
});

// GET route for updating a specific key's value
//更新特定键的值的GET路由
app.get("/update/:key/:value", async (req, res) => {
    const { key, value } = req.params; // Extract 'key' and 'value' parameters from the URL.
    
    try {
        // Get the current value of the specified key from Redis.
        //从Redis中获取指定键的当前值。
        const currentValue = await client.get(key);
        
        // Add the new value to the current value, converting both to numbers for the addition.
        //将新值添加到当前值，将两者都转换为数字进行加法。
        const newValue = Number(currentValue) + Number(value);
        
        // Update the key with the new value in Redis, converting it back to a string.
        //在Redis中更新键，将其转换回字符串。
        await client.set(key, newValue.toString());
        
        // Fetch the updated data from Redis and send it as a response.
        //从Redis中获取更新后的数据并将其作为响应发送。
        const updatedData = await data();
        console.log(updatedData); // Log the updated data.
        res.json(updatedData); // Send the updated data as a JSON response.
    } catch (error) {
        res.status(500).json({ error: "Failed to update data" }); // Send a 500 error response if something goes wrong.
        //如果出现问题，发送500错误响应。
    }
});

// Start the server and listen on the specified port
//启动服务器并监听指定的端口
const port = process.env.PORT || 3000; // Use the PORT environment variable or default to port 3000.
//使用环境变量中的PORT或默认端口3000。
app.listen(port, () => console.log(`Running on ${port}`)); // Log a message indicating that the server is running.
//记录一条消息，表示服务器正在运行。

// Gracefully handle process exit and ensure Redis client disconnects properly
//优雅地处理进程退出并确保Redis客户端正确断开连接
process.on("exit", async () => {
    await client.quit(); // Ensure Redis client is properly disconnected when the process exits.
    //确保Redis客户端在进程退出时正确断开连接。
});


// Now, let's go through the main updates and improvements:现在，让我们来看看主要的更新和改进：
// Async/Await: We've switched to using async/await syntax throughout the code, which makes it more readable and easier to handle promises.Async/Await：我们在整个代码中切换到使用async/await语法，这使得它更可读，更容易处理promise。
// Redis Client: We're using the newer Redis client initialization method, which is more flexible and allows for easier configuration.Redis客户端：我们使用更新的Redis客户端初始化方法，它更灵活，更容易配置。
// Error Handling: We've added more robust error handling, especially in the route handlers.错误处理：我们添加了更健壮的错误处理，特别是在路由处理程序中。
// Initialization: The initializeRedis function now uses mSet instead of mset (camelCase is the new convention), and we've made it an async function.注意：initializeRedis函数现在使用mSet而不是mset（camelCase是新的约定），并且我们已经将其作为一个appropric函数。
// Data Retrieval: The data function is now async and uses mGet instead of mget. It also converts the values to numbers directly.数据检索：数据函数现在是mGet，使用mGet而不是mget。它还将值直接转换为数字。
// Route Handlers: Both /data and /update/:key/:value routes are now using async/await, making the code more straightforward.路由处理程序：/data和/update/：key/：value路由现在都使用了Await/await，使代码更加简单。
// Port Configuration: We've added the ability to set the port via an environment variable, which is useful for deployment.端口配置：我们增加了通过环境变量设置端口的功能，这对部署很有用。
// Graceful Shutdown: The process.on("exit") handler is now async to ensure the Redis client closes properly.优雅的关闭：process.on（“exit”）处理程序现在是关闭的，以确保Redis客户端正确关闭。

// Improvements from the 2019 version that we've retained:我们保留的2019年版本的改进：

// Serving static files from the public directory.从公共目录提供静态文件。
// Using mSet and mGet for efficient multi-key operations.使用mSet和mGet进行高效的多键操作。
// The overall structure of the data retrieval and update logic.数据检索和更新逻辑的总体结构。

