const express = require("express");
const app = express();
const port = 3000;
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const game = require('./game');

app.use(express.static(__dirname + '/public'));

app.get('/',  (req, res) => {
  res.render('/public/index.html');
});

io.on('connection', (socket) => {
  socket.on("getConfig", () => {
    socket.emit("postConfig", game.config);
  });
  
  socket.on("addPlayer", (player) => {
    game.addPlayer(player);
    
    setInterval(() => {
      game.getGameData(function(err, data) {
        socket.emit("getGameData", data);
      });
    }, 1000 / game.config.tick_rate);
  });
  
  socket.on("postPlayer", (player) => {
    game.postPlayer(player);
  });
  
  socket.on("removePlayer", (playerGUID) => {
    game.removePlayer(playerGUID);
  });
});

server.listen(port, () => {
  console.log('listening on *:' + port);
});