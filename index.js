const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");

// Set up storage for uploaded files
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve static files
app.use(express.static("public"));

// Render the index.html file
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

// Handle file uploads
app.post("/upload", upload.single("file"), function (req, res) {
  // Create a new ffmpeg instance
  const ffmpegInstance = new ffmpeg();

  // Set the input to be the uploaded file
  ffmpegInstance.input(req.file.buffer);

  // Set the output format to be a live stream
  ffmpegInstance.outputFormat("flv");

  // Set the output to be a Socket.IO stream
  ffmpegInstance.output("pipe:1");

  // Start the transcoding process
  ffmpegInstance.run();

  // Stream the output to the client
  ffmpegInstance.pipe(res);
});

// Listen for new Socket.IO connections
io.on("connection", function (socket) {
  console.log("a user connected");

  // Listen for new video frames from the client
  socket.on("newFrame", function (frame) {
    // Broadcast the new frame to all connected clients
    socket.broadcast.emit("newFrame", frame);
  });

  // Listen for disconnections
  socket.on("disconnect", function () {
    console.log("user disconnected");
  });
});

// Start the HTTP server
http.listen(3000, function () {
  console.log("listening on *:3000");
});
