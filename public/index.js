"use strict";

if (location.protocol != "https:") {
  location.href =
    "https:" + window.location.href.substring(window.location.protocol.length);
}

let canvas = document.querySelector("#canvas");
let fpsText = document.querySelector("#fps");
let ctx = canvas.getContext("2d");
let socket = io();

let gameData;
let config = {
  tick_rate: 45,
  arena: {
    width: 5000,
    height: 5000,
  },
  blob: {
    mass: 50,
  },
  pellets: {
    mass: 1,
    r: 4,
  },
};

socket.on("connect", () => {
  game.status = 200;

  socket.emit("getConfig");
});

socket.on("disconnect", () => {
  game.status = 504;
  socket.emit("removePlayer", game.player.guid);
});

socket.on("connect_failed", function () {
  game.status = 404;
});

socket.on("getGameData", updGameData);

function updGameData(data) {
  gameData = data;

  gameData.players.forEach((player) => {
    let filtered = game.blobSystem.blobs.filter(function (blob) {
      return blob.guid === player.guid;
    });

    if (filtered.length === 0) {
      let newBlob = new Blob(
        game.camera,
        game.arena,
        player.name,
        player.mass,
        player.x,
        player.y
      );
      
      if (player.imageUrl) newBlob.clipImage(player.imageUrl);
      newBlob.setBlobStyle(player.bgColor, player.borderColor, player.textColor);

      newBlob.guid = player.guid;
      game.blobSystem.appendBlob(newBlob);
    }
  });

  if (game.blobSystem.blobs) {
    game.blobSystem.blobs.forEach((blob) => {
      // for each blob in the blobsystem it checks if there is an identical guid.

      let i = gameData.players.findIndex(
        (serverBlob) => serverBlob.guid === blob.guid
      );

      if (i !== -1 && gameData.players[i]) {
        if (gameData.players[i].guid !== game.player.blob.guid) {
          blob.guid = gameData.players[i].guid;
          blob.name = gameData.players[i].name;
          blob.mass = gameData.players[i].mass;
          blob.rotation = gameData.players[i].rotation;
          blob.xVel = gameData.players[i].xVel;
          blob.yVel = gameData.players[i].yVel;
          blob.x = gameData.players[i].x;
          blob.y = gameData.players[i].y;
        }
      }
    });
  }
}

socket.on("postConfig", (res) => {
  config = res;
});

function randomNumber(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function newPlayer(newBlob) {
  game.appendBlob(
    new Blob(
      game.camera,
      game.arena,
      newBlob.name,
      newBlob.mass,
      newBlob.x,
      newBlob.y
    )
  );
}

let randomColor = () => {
  return Math.floor(Math.random() * 16777215).toString(16);
};

let fillText = () => {
  var txt = 'line 1\nline 2\nthird line..';
  var x = 30;
  var y = 30;
  var lineheight = 15;
  var lines = txt.split('\n');
};

let guidGenerator = () => {
  var S4 = function () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return (
    S4() +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    S4() +
    S4()
  );
};

class Joystick {
  constructor(blob, borderRadius, borderMargin, knobRadius) {
    this.blob = blob;
    this.intervalAmount = 55;
    this.angle = 0;
    this.client = {
      x: 0,
      y: 0,
    };

    this.border = {
      r: borderRadius,
      margin: borderMargin,
    };

    this.knob = {
      x: 0,
      y: 0,
      r: knobRadius,
    };

    this.mousedown = false;

    canvas.addEventListener("mousedown", (e) => {
      e.stopImmediatePropagation();
      this.onDown(e);
    });
    canvas.addEventListener(
      "touchstart",
      (e) => {
        e.stopImmediatePropagation();
        this.onDown(e);
      },
      { passive: true }
    );

    canvas.addEventListener("mousemove", (e) => {
      e.stopImmediatePropagation();
      this.onMove(e);
    });

    canvas.addEventListener(
      "touchmove",
      (e) => {
        e.stopImmediatePropagation();
        this.onMove(e);
      },
      { passive: true }
    );

    canvas.addEventListener("mouseup", (e) => {
      e.stopImmediatePropagation();
      this.onUp(e);
    });

    canvas.addEventListener(
      "touchend",
      (e) => {
        e.stopImmediatePropagation();
        this.onUp(e);
      },
      { passive: true }
    );
  }

  // $(".window").on("mousemove", function); ?

  onDown(e) {
    this.mousedown = true;
    this.onMove(e);
    this.blob.setMovement(true);

    return this;
  }

  onMove(e) {
    this.clientX = e.clientX ? e.clientX : e.touches[0].clientX;
    this.clientY = e.clientY ? e.clientY : e.touches[0].clientY;

    let dim = canvas.getBoundingClientRect();

    this.client = {
      x:
        this.clientX -
        dim.x -
        canvas.width +
        this.border.r +
        this.border.margin,
      y:
        this.clientY -
        dim.y -
        canvas.height +
        this.border.r +
        this.border.margin,
    };

    // https://stackoverflow.com/questions/28226833/get-angle-in-terms-of-360-degrees --because im bad at math

    if (this.mousedown) {
      this.blob.setRotation(this.calcAngle());
      this.knob.x = this.client.x;
      this.knob.y = this.client.y;

      if (!this.withinBorders()) {
        this.knob.x = Math.cos((this.angle * Math.PI) / 180) * this.border.r;
        this.knob.y = Math.sin((this.angle * Math.PI) / 180) * this.border.r;
      }
    }

    return this;
  }

  calcDistance() {
    return parseInt(Math.sqrt(this.client.x ** 2 + this.client.y ** 2));
  }

  withinBorders() {
    this.distance = this.calcDistance();

    if (this.distance <= this.border.r) {
      return true;
    } else {
      return false;
    }
  }

  onUp() {
    this.mousedown = false;
    this.blob.setMovement(false);

    this.knob.x = this.knob.y = 0;

    return this;
  }

  calcAngle() {
    let radians;

    if (this.client.x || this.client.y) {
      radians = Math.atan2(this.client.y, this.client.x);
    } else {
      radians = 0;
    }

    if (radians < 0) {
      radians += 2 * Math.PI;
    }

    return (this.angle = (radians * 180) / Math.PI);
  }

  render() {
    ctx.globalCompositeOperation = "difference";
    ctx.fillStyle = "white";
    ctx.strokeStyle = "white";

    ctx.beginPath();
    ctx.arc(
      canvas.width - this.border.r - this.border.margin,
      canvas.height - this.border.r - this.border.margin,
      this.border.r,
      0,
      2 * Math.PI
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(
      canvas.width - this.border.r - this.border.margin + this.knob.x,
      canvas.height - this.border.r - this.border.margin + this.knob.y,
      this.knob.r,
      0,
      2 * Math.PI
    );
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";

    return this;
  }
}

class Camera {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.scale = 1;
    this.focus;
  }

  calcCameraCoord(x, y) {
    this.focusX = 0;
    this.focusY = 0;

    if (this.focus) {
      this.focusX = this.focus.x;
      this.focusY = this.focus.y;
    }

    return {
      x: this.x + x - this.focusX,
      y: this.y + y - this.focusY,
    };
  }

  setCenterCoordinates(x = canvas.width / 2, y = canvas.height / 2) {
    this.x = x;
    this.y = y;

    this.fixScale();

    return this;
  }

  focusOn(blob) {
    this.focus = blob;
    return this;
  }

  fixScale() {
    if (this.focus) {
      this.calcScale = canvas.height / this.focus.mass / 3;

      if (this.calcScale < 1) {
        this.scale = this.calcScale;
      }
    }
  }
}

class GameCollision {
  constructor(game) {
    this.game = game;
  }

  calcArcCollision(player, target) {
    this.player = player;
    this.target = target;

    this.a = this.player.x - this.target.x;
    this.b = this.player.y - this.target.y;

    this.distance = Math.sqrt(this.a ** 2 + this.b ** 2);

    if (this.distance < this.player.r) {
      return true;
    }

    return false;
  }

  trackCollision() {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";

    for (let i = 0; i < this.game.blobSystem.blobs.length; i++) {
      let b = this.game.blobSystem.blobs[i].calcCollisionBorders();
      // ⬆ 'b' are the coordinates before fixed camera coordinates
      // THIS IS A BORDER; if there is a collision, then the actual collision calculations start

      // this checks for pellets nearby based on border collision
      if (this.game.pelletSystem) {
        for (let o = 0; o < this.game.pelletSystem.pellets.length; o++) {
          if (
            b.x <
              this.game.pelletSystem.pellets[o].x +
                this.game.pelletSystem.pellets[o].mass &&
            b.x + b.w > this.game.pelletSystem.pellets[o].x &&
            b.y <
              this.game.pelletSystem.pellets[o].y +
                this.game.pelletSystem.pellets[o].mass &&
            b.h + b.y > this.game.pelletSystem.pellets[o].y
          ) {
            if (this.game.showCollisionBorders) {
              ctx.strokeStyle = "#f0f";

              let a = this.game.camera.calcCameraCoord(
                this.game.blobSystem.blobs[i].x,
                this.game.blobSystem.blobs[i].y
              );
              let b = this.game.camera.calcCameraCoord(
                this.game.pelletSystem.pellets[o].x,
                this.game.pelletSystem.pellets[o].y
              );

              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }

            if (
              this.calcArcCollision(
                this.game.blobSystem.blobs[i],
                this.game.pelletSystem.pellets[o]
              )
            ) {
              this.game.camera.fixScale();
              this.game.blobSystem.blobs[i].mass +=
                this.game.pelletSystem.pellets[o].mass;
              this.game.pelletSystem.unappendPellet(o);
              this.game.blobSystem.sortBlobs();
            }
          }
        }
      }

      for (let o = 0; o < this.game.blobSystem.blobs.length; o++) {
        let h = this.game.blobSystem.blobs[o].calcCollisionBorders();

        if (i !== o) {
          if (
            b.x < h.x + h.w &&
            b.x + b.w > h.x &&
            b.y < h.y + h.h &&
            b.h + b.y > h.y
          ) {
            if (this.game.showCollisionBorders) {
              ctx.strokeStyle = "#ff0";
              let a = this.game.camera.calcCameraCoord(
                this.game.blobSystem.blobs[i].x,
                this.game.blobSystem.blobs[i].y
              );
              let b = this.game.camera.calcCameraCoord(
                this.game.blobSystem.blobs[o].x,
                this.game.blobSystem.blobs[o].y
              );

              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
            if (
              this.calcArcCollision(
                this.game.blobSystem.blobs[i],
                this.game.blobSystem.blobs[o]
              ) &&
              this.game.blobSystem.blobs[i].mass >
                this.game.blobSystem.blobs[o].mass
            ) {
              this.percent =
                this.game.blobSystem.blobs[o].mass /
                this.game.blobSystem.blobs[i].mass;
              // console.log(this.percent)
              // this.difference = this.game.blobSystem.blobs[i].mass - this.game.blobSystem.blobs[o].mass;

              if (this.percent < 0.95) {
                this.game.blobSystem.blobs[i].mass +=
                  this.game.blobSystem.blobs[o].mass;
                this.game.blobSystem.unappendBlob(o);
                this.game.camera.fixScale();
              }
            }
          }
        }
      }

      if (this.game.showCollisionBorders) {
        let f = this.game.camera.calcCameraCoord(b.x, b.y);
        b.x = f.x;
        b.y = f.y;

        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
      }
    }
  }
}

class Game {
  constructor() {
    this.camera = new Camera();
    this.arena = new Arena(config.arena.width, config.arena.height, this.camera);
    this.pelletSystem = new PelletSystem(this.camera, this.arena);
    this.blobSystem = new BlobSystem(this.camera, this.arena);
    this.userInterface = null;
    this.showCollisionBorders = true;
    this.collision = new GameCollision(this);
    this.status;
  }

  unappendUI() {
    this.userInterface = null;
  }

  appendUI(userInterface) {
    this.userInterface = userInterface;

    return this;
  }

  setPlayer(player) {
    this.player = player;
    this.camera.focusOn(this.player.blob);

    return this;
  }

  render() {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(this.camera.scale, this.camera.scale);
    ctx.translate(-(canvas.width / 2), -(canvas.height / 2));

    this.arena.render();

    if (this.pelletSystem) {
      this.pelletSystem.render();
    }

    if (this.blobSystem) {
      this.blobSystem.render();
    }

    this.collision.trackCollision();

    ctx.restore();
    
    if (gameData && gameData.players) {
      gameData.players.forEach((player, index) => {
        let txt = `${player.name} - ${player.mass}`;
        
        ctx.fillStyle = "#fff";
        ctx.fillText(txt, canvas.width - ctx.measureText(txt).width, 12 + (index * 16));
      });
    }
    
    
    ctx.alignText = "left";

    if (this.status) {
      switch (this.status) {
        case 200:
          ctx.fillStyle = "green";
          this.prompt = "Connected to Server";
          break;
        case 404:
          ctx.fillStyle = "orange";
          this.prompt = "Cannot Connect to Server";
        case 504:
          ctx.fillStyle = "red";
          this.prompt = "Disconnected from Server";
      }

      ctx.fillText(this.prompt, 0, 24);
      ctx.fillStyle = "#fff";
    }

    if (this.userInterface) {
      this.userInterface.render();
    }

    return this;
  }
}

class Arena {
  constructor(w, h, camera) {
    this.camera = camera;
    this.width = w || 1000;
    this.height = h || 1000;
    this.bgColor = "#111";
    this.borderColor = "#fff";
    this.blobs = new Array();
  }

  render() {
    this.x = 0;
    this.y = 0;

    if (this.camera.focus) {
      this.x = this.camera.focus.x;
      this.y = this.camera.focus.y;
    }

    ctx.fillStyle = this.bgColor;
    ctx.fillRect(
      this.camera.x - this.x,
      this.camera.y - this.y,
      this.width,
      this.height
    );

    ctx.lineWidth = 5;
    ctx.strokeStyle = this.borderColor;
    ctx.strokeRect(
      this.camera.x - this.x,
      this.camera.y - this.y,
      this.width,
      this.height
    );
  }
}

class PelletSystem {
  constructor(camera, arena) {
    this.camera = camera;
    this.arena = arena;
    this.pellets = new Array();

    this.delay = 200;
    this.maxAmount = 10000;

    let cache = this;

    this.interval = setInterval(function () {
      cache.appendPellet(new Pellet(cache.camera, cache.arena));
    }, this.delay);
  }

  appendPellet(pellet) {
    if (this.pellets.length < this.maxAmount) {
      this.pellets.push(pellet);
    }
  }

  unappendPellet(index) {
    this.pellets.splice(index, 1);
  }

  render() {
    if (this.pellets.length > 0) {
      for (let i in this.pellets) {
        this.pellets[i].render();
      }
    }
  }
}

class Pellet {
  constructor(camera, arena) {
    this.camera = camera;
    this.arena = arena;
    this.bgColor = "#" + randomColor();

    this.x = Math.random() * this.arena.width;
    this.y = Math.random() * this.arena.height;
    this.mass = randomNumber(1,5);
    this.r = this.mass * 2;
  }

  render() {
    ctx.fillStyle = this.bgColor;

    this.calcX = this.camera.calcCameraCoord(this.x, this.y).x;
    this.calcY = this.camera.calcCameraCoord(this.x, this.y).y;

    ctx.beginPath();
    ctx.arc(this.calcX, this.calcY, this.r, 0, 2 * Math.PI);
    ctx.fill();
  }
}

class BlobSystem {
  constructor(camera, arena) {
    this.camera = camera;
    this.arena = arena;
    this.blobs = new Array();
  }

  setPlayer(player) {
    this.player = player;
  }

  appendBlob(blob) {
    this.blobs.push(blob);
    this.sortBlobs();
    return this;
  }

  unappendBlob(index) {
    if (this.player && this.player.blob === this.blobs[index]) {
      this.player.removeSelf();
    }

    this.blobs.splice(index, 1);

    return this;
  }

  sortBlobs() {
    this.blobs.sort((a, b) => parseFloat(a.mass) - parseFloat(b.mass));
    return this;
  }

  render() {
    if (this.blobs.length > 0) {
      for (let i in this.blobs) {
        this.blobs[i].render();
      }
    }
  }
}

class Blob {
  constructor(camera, arena, name, mass, x, y) {
    this.camera = camera;
    this.arena = arena;
    this.name = name;
    this.mass = mass;
    this.guid = guidGenerator();
    this.rotation = 0;
    this.moving = false;
    this.border = 1;
    this.bgColor = "rgba(0,0,0,0.9)";
    this.borderColor = "#f00";
    this.shadowColor = this.borderColor;
    this.textColor = "#fff";
    this.bgImage = null;
    this.bgImageError = false;


    this.x = x ?? Math.random() * this.arena.width;
    this.y = y ?? Math.random() * this.arena.height;
    (this.xVel = 0), (this.yVel = 0), (this.speed = 1), (this.friction = 0.09);

    this.trackMovement();
  }

  setMovement(boolean) {
    this.moving = boolean;
  }

  setRotation(angle) {
    this.rotation = angle;
  }

  trackMovement() {
    setInterval(() => {
      if (this.moving) {
        this.xVel += Math.cos((this.rotation * Math.PI) / 180);
        this.yVel += Math.sin((this.rotation * Math.PI) / 180);
      }
    }, 1000 / config.tick_rate);
  }

  calcCollisionBorders() {
    this.colBorderLength = 2.5;

    return {
      x: this.x - (this.r * this.colBorderLength) / 2,
      y: this.y - (this.r * this.colBorderLength) / 2,
      w: this.colBorderLength * this.r,
      h: this.colBorderLength * this.r,
    };
  }

  clipImage(src) {
    this.bgImage = new Image();
    this.bgImage.src = src;
    
    console.log("hello")
    
    this.bgImage.onerror = () => {
      this.bgImageError = true;
    }

    return this;
  }

  shoot() {}

  setBlobStyle(bgColor, borderColor, textColor) {
    this.bgColor = bgColor;
    this.borderColor = borderColor;
    this.textColor = textColor;

    return this;
  }

  render() {
    this.calcX = this.camera.calcCameraCoord(this.x, this.y).x;
    this.calcY = this.camera.calcCameraCoord(this.x, this.y).y;

    this.r = this.mass / 2;

    if (this.bgImage) {
      ctx.save();
    }

    ctx.fillStyle = this.bgColor;
    ctx.beginPath();
    ctx.arc(this.calcX, this.calcY, this.r, 0, 2 * Math.PI);
    ctx.closePath();
    if (this.bgImage) {
      ctx.clip();
    }
    ctx.fill();

    if (this.bgImage && !this.bgImageError) {
       ctx.drawImage(
        this.bgImage,
        this.calcX - this.r,
        this.calcY - this.r,
        this.mass,
        this.mass
      );
      
    }
    
    ctx.restore();

    ctx.shadowColor = this.borderColor;
    ctx.shadowBlur = 15;

    ctx.strokeStyle = this.borderColor;
    ctx.fillStyle = this.borderColor;

    ctx.lineWidth = this.border;

    // renders 'pointer'
    ctx.save();

    ctx.translate(this.calcX, this.calcY);
    ctx.rotate((Math.PI / 180) * this.rotation);

    ctx.beginPath();
    ctx.moveTo(0 + this.r, -10);
    ctx.lineTo(10 + this.r, 0);
    ctx.lineTo(0 + this.r, 10);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // renders Blob's border
    ctx.beginPath();
    ctx.arc(this.calcX, this.calcY, this.r, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // renders Blob text
    ctx.fillStyle = this.textColor;
    ctx.textAlign = "center";
    ctx.font = `${this.r / 3}px Arial`;
    ctx.fillText(
      this.name,
      this.calcX + this.border / 2,
      this.calcY + this.border / 2
    );

    ctx.fillText(
      this.mass,
      this.calcX + this.border / 2,
      this.calcY + this.border / 2 + this.r / 3
    );

    this.yVel *= 1 - this.friction;
    this.y += this.yVel;
    this.xVel *= 1 - this.friction;
    this.x += this.xVel;

    if (this.x < 0) {
      this.x = 0;
    }

    if (this.y < 0) {
      this.y = 0;
    }

    if (this.x > this.arena.width) {
      this.x = this.arena.width;
    }

    if (this.y > this.arena.height) {
      this.y = this.arena.height;
    }

    return this;
  }
}

class Player {
  constructor(game, blob) {
    this.game = game;
    this.blob = blob;
    this.structureClone = structuredClone(this.blob);
    this.ui = new Joystick(this.blob, 75, 50, 45);
    this.trackMovement();
  }

  addSelf() {
    this.game.blobSystem.appendBlob(this.blob);
    this.game.blobSystem.setPlayer(this);
    this.game.appendUI(this.ui);

    socket.emit("addPlayer", {
      name: this.blob.name,
      guid: this.blob.guid,
      mass: this.blob.mass,
      rotation: this.blob.rotation,
      x: this.blob.x,
      y: this.blob.y,
      xVel: this.blob.xVel,
      yVel: this.blob.yVel,
    });
  }

  removeSelf() {
    this.game.unappendUI(this.ui);

    socket.emit("removePlayer", this.blob.guid);

    $(".modal").show();
  }

  trackMovement() {
    setInterval(() => {
      // if (this.blob.xVel.toFixed(2) !== 0 || this.blob.yVel.toFixed(2) !== 0) {
      socket.emit("postPlayer", {
        name: this.blob.name,
        guid: this.blob.guid,
        mass: this.blob.mass,
        rotation: this.blob.rotation,
        x: this.blob.x,
        y: this.blob.y,
        xVel: this.blob.xVel,
        yVel: this.blob.yVel,
        imageUrl: (this.blob.bgImage && this.blob.bgImage.src) ? this.blob.bgImage.src : null,
        bgColor: this.blob.bgColor, 
        borderColor: this.blob.borderColor, 
        textColor: this.blob.textColor
      });
      //
    }, 1000 / config.tick_rate);
  }
}

let game = new Game();
let player = new Player(
  game,
  new Blob(game.camera, game.arena, "", config.blob.mass)
);

game.setPlayer(player);

$(".username").val(localStorage.getItem("username"));
$(".bgColor").val(localStorage.getItem("bgColor"));
$(".borderColor").val(localStorage.getItem("borderColor"));
$(".textColor").val(localStorage.getItem("textColor"));
$(".imageUrl").val(localStorage.getItem("imageUrl"));

$("#form").submit(function (e) {
  e.preventDefault();

  $(".modal").hide();

  let username = $(".username").val();
  let bgColor = $(".bgColor").val();
  let borderColor = $(".borderColor").val();
  let textColor = $(".textColor").val();
  let imageUrl = $(".imageUrl").val();
  
  localStorage.setItem("username", username);
  localStorage.setItem("bgColor", bgColor);
  localStorage.setItem("borderColor", borderColor);
  localStorage.setItem("textColor", textColor);
  localStorage.setItem("imageUrl", imageUrl);
  
  if (imageUrl) player.blob.clipImage(imageUrl);
  
  player.blob.setBlobStyle(bgColor, borderColor, textColor);
  
  player.blob.name = username;
  game.player.addSelf(player);
});

class fpsDebug {
  constructor() {
    this.times = new Array();
    this.fps = 0;
  }

  clear() {
    this.times = new Array();
  }

  track() {
    const now = performance.now();
    while (this.times.length > 0 && this.times[0] <= now - 1000) {
      this.times.shift();
    }
    this.times.push(now);
    this.fps = this.times.length;
  }

  getFPS() {
    return this.fps;
  }
}

let reqFrame;
let fps = new fpsDebug();

let loop = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  game.render();

  ctx.font = "12px Arial";
  ctx.textAlign = "left";
  ctx.fillStyle = "white";
  ctx.fillText(`fps: ${fps.getFPS()}`, 0, 12);

  reqFrame = window.requestAnimationFrame(() => {
    fps.track();
    loop();
  });
};

function init() {
  window.addEventListener("resize", resize, false);
  resize();
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = 100 + "%";
  canvas.style.height = 100 + "%";
  game.camera.setCenterCoordinates();
  cancelAnimationFrame(reqFrame);
  loop();
}

init();
