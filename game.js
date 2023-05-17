const config = require('./config.json');
const gameDataTemplate = require('./gameDataTemplate.json');

const fs = require('fs');
const isValidJSON = (json) => {
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
}

async function getGameData(callback) {
  fs.readFile('gameData.json', function(err, res) {
    if (err) return callback(err)
    
    let data;
    
    try {
      data = JSON.parse(res);
    } catch (e) {
      console.log(res.toString())
      console.trace(e);
    } finally {
      data = gameDataTemplate;
    }
    
    callback(null, data);
  });
}

async function postGameData(data) {
  data = JSON.stringify(data);
  
  fs.writeFile("gameData.json", data, (err) => {
    if (err) throw err;
  });
}

function addPlayer(player) {
  getGameData(function(err, data) {
    data.players.push(player);
    postGameData(data);
  });
}

function removePlayer(playerGUID) {
  getGameData(function(err, data) {
    data.players = data.players.filter(function(blob) {
        return blob.guid !== playerGUID;
    });
    
    postGameData(data);
  });
}

function postPlayer(player) {
  getGameData(function(err, data) {
    let i = data.players.findIndex((oldPlayer => oldPlayer.guid === player.guid));
    
    if (i > -1 && data.players[i]) {
      data.players[i] = player;
    }
    
    postGameData(data);
  });
}

module.exports = {
  config: config,
  addPlayer: addPlayer,
  removePlayer: removePlayer,
  postPlayer: postPlayer,
  getGameData: getGameData
}