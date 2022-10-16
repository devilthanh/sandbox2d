import { server as WebSocketServer } from 'websocket';
import {
  ChatMessage,
  GameInfo,
  GameMap,
  GameMessage,
  GameOptions,
  PlayerOptions,
  PlayerUpdate,
} from '../definitions/type';
import Player from './player';
import { getCurrentTickInNanos, NS_PER_SEC, toTile, walkable, Vector2Zero, normalizeVector2 } from './gameUtils';

const serverTick = 30;

class GameRoom {
  private _wsServer: WebSocketServer;
  private _id: number | string;
  private _roomName: string;
  private _maxPlayer: number;
  private _map: GameMap;
  private _players: Player[];
  private _bots?: number;
  private _tick: number;
  private _tickIndex: number;
  private _mapW: number;
  private _mapH: number;

  constructor(wsServer: WebSocketServer, gameOptions: GameOptions) {
    this._wsServer = wsServer;
    this._id = gameOptions.id || getCurrentTickInNanos();
    this._roomName = gameOptions.roomName;
    this._maxPlayer = gameOptions.maxPlayers;
    this._map = gameOptions.map;
    this._players = [];
    this._bots = gameOptions.bots;
    this._tick = 0;
    this._tickIndex = 0;
    this._mapW = this._map.width * this._map.tileWidth;
    this._mapH = this._map.height * this._map.tileHeight;
    console.log(`Created GameRoom [${this._id}]${this._roomName}`);
    gameOptions.autoStart && this.start();
  }

  public get id(): number | string {
    return this._id;
  }

  public get info(): GameInfo {
    return {
      id: this._id,
      roomName: this._roomName,
      players: this._players.length,
      maxPlayers: this._maxPlayer,
    } as GameInfo;
  }

  public get map(): GameMap {
    return this._map;
  }

  public start = () => {
    this.init();
    this._tick = getCurrentTickInNanos();
    this.loop();
    console.log(`Started GameRoom [${this._id}]${this._roomName}`);
  };

  public destroy = () => {
    console.log(`Destroyed GameRoom [${this._id}]${this._roomName}`);
  };

  public broadcast = (gameMessage: GameMessage) => {
    for (const player of this._players) {
      if (!gameMessage.playerId || gameMessage.playerId === player.id) {
        console.log(gameMessage);
      }
    }
  };

  public addPlayer = (playerOptions: PlayerOptions): Player => {
    const player = new Player(this, playerOptions);
    this._players.push(player);
    console.log(`Player [${player.id}]${player.name} joined GameRoom [${this._id}]${this._roomName}`);
    return player;
  };

  public removePlayer = (id: number | string) => {
    const player = this._players.find(player => player.id === id);
    if (player) {
      const index = this._players.indexOf(player);
      this._players.splice(index, 1);
      console.log(`Player [${player.id}]${player.name} left GameRoom [${this._id}]${this._roomName}`);
    }
  };

  private initBots = () => {
    if (this._bots) {
      for (var i = 0; i < this._bots; i++) {
        this.addPlayer({ playerName: `Bot ${i}` });
      }
    }
  };

  private init = () => {
    this.initBots();
  };

  private gameUpdate = () => {
    for (const player of this._players) {
      player.velocity = Vector2Zero;

      if (player.knockTime > 0) player.knockTime -= 1;

      if (player.knockTime == 0) {
        if (player.inputController.moveLeft) {
          player.velocity.x -= 3 - 1.5 * (player.isRunning ? 1 : 0);
        }
        if (player.inputController.moveRight) {
          player.velocity.x += 3 - 1.5 * (player.isRunning ? 1 : 0);
        }
        if (player.inputController.moveUp) {
          player.velocity.y -= 3 - 1.5 * (player.isRunning ? 1 : 0);
        }
        if (player.inputController.moveDown) {
          player.velocity.y += 3 - 1.5 * (player.isRunning ? 1 : 0);
        }

        player.velocity = normalizeVector2(player.velocity);
      } else {
        player.velocity = normalizeVector2({ x: Math.sin(player.knockDir) * 7, y: -Math.cos(player.knockDir) * 7 });
      }

      var ox = player.velocity.x == 0 ? 0 : player.velocity.x < 0 ? -12 : 12;
      var oy = player.velocity.y == 0 ? 0 : player.velocity.y < 0 ? -12 : 12;
      var x = toTile(player.position.x, this._map);
      var x1 = toTile(player.position.x - 12, this._map);
      var x2 = toTile(player.position.x + 12, this._map);
      var xh = toTile(player.position.x + player.velocity.x + ox, this._map);
      var y = toTile(player.position.y, this._map);
      var y1 = toTile(player.position.y - 12, this._map);
      var y2 = toTile(player.position.y + 12, this._map);
      var yv = toTile(player.position.y + player.velocity.y + oy, this._map);

      if (player.position.x + player.velocity.x - 32 < 0 || player.position.x + player.velocity.x + 32 >= this._mapW) {
        player.velocity.x = 0;
      }
      if (player.position.y + player.velocity.y - 32 < 0 || player.position.y + player.velocity.y + 32 >= this._mapH) {
        player.velocity.y = 0;
      }

      if (player.velocity.x != 0 || player.velocity.y != 0) {
        if (!walkable(this._map.data[y1][xh].type) || !walkable(this._map.data[y2][xh].type)) {
          player.velocity.x = 0;
        }
        if (!walkable(this._map.data[yv][x1].type) || !walkable(this._map.data[yv][x2].type)) {
          player.velocity.y = 0;
        }
      }

      player.position.x += player.velocity.x;
      player.position.y += player.velocity.y;
      player.fakeRotate = player.rotate;

      if (player.onAttack) {
        if (player.attackStage == 3) {
          player.fakeRotate += 0.2 * (5 - player.attackCount);
        } else if (player.attackStage == 2) {
          player.fakeRotate -= 0.4 * (5 - player.attackCount) - 0.2 * 5;
          for (const otherPlayer of this._players) {
            if (player.id != otherPlayer.id) {
              const dt =
                (player.position.x - otherPlayer.position.x) * (player.position.x - otherPlayer.position.x) +
                (player.position.y - otherPlayer.position.y) * (player.position.y - otherPlayer.position.y);
              const dir = -Math.atan2(
                player.position.x - otherPlayer.position.x,
                player.position.y - otherPlayer.position.y
              );

              if (dt <= 35 * 35 && !player.knock[otherPlayer.id]) {
                if (
                  Math.abs(player.rotate - dir) <= 0.8 ||
                  Math.abs(player.rotate + 2 * Math.PI - dir) <= 0.8 ||
                  Math.abs(player.rotate - 2 * Math.PI - dir) <= 0.8
                ) {
                  const killed = otherPlayer.hit(player, dir);
                  if (killed) {
                    this.broadcast({
                      gameId: this._id,
                      event: 'CHAT',
                      data: {
                        channel: 'GAME_ROOM',
                        message:
                          '<span style="color:blue">' +
                          player.name +
                          ' </span>' +
                          '<span style="color:#dd0000"> killed </span>' +
                          '<span style="color:blue">' +
                          otherPlayer.name +
                          ' </span>',
                      } as ChatMessage,
                    });
                  } else {
                    player.knock[otherPlayer.id] = true;
                  }
                }
              }
            }
          }
        } else if (player.attackStage == 1) {
          player.fakeRotate += 0.1 * (10 - player.attackCount) - 0.1 * 10;
        }

        if (player.fakeRotate > Math.PI) player.fakeRotate = player.fakeRotate - 2 * Math.PI;

        if (player.fakeRotate < -Math.PI) player.fakeRotate = 2 * Math.PI + player.fakeRotate;

        player.attackCount -= 1;
        if (player.attackCount < 0) {
          player.attackStage -= 1;
          if (player.attackStage == 2) player.attackCount = 5;
          else if (player.attackStage == 1) player.attackCount = 10;
        }

        if (player.attackStage == 0) {
          player.onAttack = false;
          player.attackStage = 0;
          player.attackCount = 0;
        }
      }
    }

    const sendData: PlayerUpdate[] = [];
    for (const player of this._players) {
      sendData.push({
        id: player.id,
        rotate: 0,
        position: player.position,
        velocity: player.velocity,
        inputController: player.inputController,
      });
    }

    this.broadcast({
      gameId: this._id,
      event: 'PLAYER_UPDATE',
      data: sendData,
    });
  };

  private loop = () => {
    const now = getCurrentTickInNanos();

    if (now - this._tick > NS_PER_SEC / serverTick) {
      this._tick = now;
      this._tickIndex++;
      this.gameUpdate();
    }

    if (now - this._tick < NS_PER_SEC / serverTick - 16 * 1e6) {
      setTimeout(() => {
        this.loop();
      }, 1);
    } else {
      setImmediate(() => {
        this.loop();
      });
    }
  };
}

const createGameRoom = (gameOptions: GameOptions) => {
  // // NETWORKING-----------------------------------------------------------------
  // const broadCast = (msg) {
  //   for (i in PLAYERS) {
  //     if (!PLAYERS[i].bot) PLAYERS[i].socket.send(msg);
  //   }
  // };
  // wsServer.on('const request', (request) {
  //   var connection = request.accept(null, request.origin);
  //   var clientIp = connection.remoteAddress.split(':')[3];
  //   delete PLAYERS[clientIp];
  //   PLAYERS[clientIp] = new Player(clientIp, clientIp);
  //   PLAYERS[clientIp].socket = connection;
  //   console.log('Player at ' + PLAYERS[clientIp].name + ' connected.');
  //   broadCast(
  //     JSON.stringify({
  //       header: 'chatUpdate',
  //       data: { name: '[System]', msg: 'Player at ' + PLAYERS[clientIp].name + ' connected.' },
  //     })
  //   );
  //   connection.send(
  //     JSON.stringify({
  //       header: 'load',
  //       data: {
  //         id: clientIp,
  //         sv_tick: tick,
  //         map: map,
  //       },
  //     })
  //   );
  //   var sendData = [];
  //   for (var i in PLAYERS) {
  //     sendData.push({
  //       name: PLAYERS[i].name,
  //       ip: PLAYERS[i].ip,
  //       x: PLAYERS[i].x,
  //       y: PLAYERS[i].y,
  //       rot: PLAYERS[i].rot,
  //       fakerot: PLAYERS[i].fakerot,
  //       health: PLAYERS[i].health,
  //       armor: PLAYERS[i].armor,
  //       moveLeft: PLAYERS[i].moveLeft,
  //       moveRight: PLAYERS[i].moveRight,
  //       moveUp: PLAYERS[i].moveUp,
  //       moveDown: PLAYERS[i].moveDown,
  //       run: PLAYERS[i].run,
  //       onAttack: PLAYERS[i].onAttack,
  //       attackStage: PLAYERS[i].attackStage,
  //       attackCount: PLAYERS[i].attackCount,
  //       knockTime: PLAYERS[i].knockTime,
  //       knockDir: PLAYERS[i].knockDir,
  //       knock: PLAYERS[i].knock,
  //       botrot: PLAYERS[i].botrot,
  //       bot: PLAYERS[i].bot,
  //     });
  //   }
  //   broadCast(
  //     JSON.stringify({
  //       header: 'newPlayer',
  //       data: sendData,
  //     })
  //   );
  //   connection.on('close', (data) {
  //     if (PLAYERS[clientIp] != undefined) {
  //       console.log('Player at ' + PLAYERS[clientIp].name + ' disconnected.');
  //       broadCast(
  //         JSON.stringify({
  //           header: 'chatUpdate',
  //           data: { name: '[System]', msg: 'Player at ' + PLAYERS[clientIp].name + ' disconnected.' },
  //         })
  //       );
  //       delete PLAYERS[clientIp];
  //       broadCast(JSON.stringify({ header: 'deletePlayer', data: clientIp }));
  //     }
  //   });
  //   connection.on('message', (event) {
  //     var msg = JSON.parse(event.utf8Data);
  //     var header = msg.header;
  //     var data = msg.data;
  //     if (header === 'sendMouse') {
  //       PLAYERS[clientIp].onAttack = true;
  //       PLAYERS[clientIp].attackStage = 3;
  //       PLAYERS[clientIp].attackCount = 5;
  //       for (var j in PLAYERS[clientIp].knock) PLAYERS[clientIp].knock[j] = false;
  //       broadCast(
  //         JSON.stringify({
  //           header: 'updateAttack',
  //           data: {
  //             ip: clientIp,
  //             onAttack: PLAYERS[clientIp].onAttack,
  //             attackStage: PLAYERS[clientIp].attackStage,
  //             attackCount: PLAYERS[clientIp].attackCount,
  //             knock: PLAYERS[clientIp].knock,
  //           },
  //         })
  //       );
  //     } else if (header === 'sendKey') {
  //       var code = data.code;
  //       var status = data.status;
  //       if (code == 65 || code == 37) {
  //         PLAYERS[clientIp].moveLeft = status;
  //       }
  //       if (code == 68 || code == 39) {
  //         PLAYERS[clientIp].moveRight = status;
  //       } else if (code == 87 || code == 38) {
  //         PLAYERS[clientIp].moveUp = status;
  //       } else if (code == 83 || code == 40) {
  //         PLAYERS[clientIp].moveDown = status;
  //       } else if (code == 16) {
  //         PLAYERS[clientIp].run = status;
  //       }
  //       broadCast(
  //         JSON.stringify({
  //           header: 'updateMovement',
  //           data: {
  //             ip: clientIp,
  //             x: PLAYERS[clientIp].x,
  //             y: PLAYERS[clientIp].y,
  //             moveLeft: PLAYERS[clientIp].moveLeft,
  //             moveRight: PLAYERS[clientIp].moveRight,
  //             moveUp: PLAYERS[clientIp].moveUp,
  //             moveDown: PLAYERS[clientIp].moveDown,
  //             run: PLAYERS[clientIp].run,
  //           },
  //         })
  //       );
  //     } else if (header === 'rot') {
  //       PLAYERS[clientIp].rot = data.rot;
  //       PLAYERS[clientIp].x = data.x;
  //       PLAYERS[clientIp].y = data.y;
  //       broadCast(JSON.stringify({ header: 'updateRot', data: { ip: clientIp, rot: PLAYERS[clientIp].rot } }));
  //     } else if (header === 'p') {
  //       connection.send(JSON.stringify({ header: 'p', data: '' }));
  //     } else if (header === 'chat') {
  //       broadCast(JSON.stringify({ header: 'chatUpdate', data: { name: PLAYERS[clientIp].name, msg: data } }));
  //     } else if (header === 'requestUpdate') {
  //       var sendData2 = [];
  //       for (var i in PLAYERS) {
  //         sendData2.push({
  //           ip: PLAYERS[i].ip,
  //           x: PLAYERS[i].x,
  //           y: PLAYERS[i].y,
  //         });
  //       }
  //       connection.send(JSON.stringify({ header: 'requestUpdate', data: sendData2 }));
  //     } else if (header === 'chatting') {
  //       PLAYERS[clientIp].moveLeft = false;
  //       PLAYERS[clientIp].moveRight = false;
  //       PLAYERS[clientIp].moveUp = false;
  //       PLAYERS[clientIp].moveDown = false;
  //       PLAYERS[clientIp].run = false;
  //       broadCast(
  //         JSON.stringify({
  //           header: 'updateMovement',
  //           data: {
  //             ip: clientIp,
  //             x: PLAYERS[clientIp].x,
  //             y: PLAYERS[clientIp].y,
  //             moveLeft: PLAYERS[clientIp].moveLeft,
  //             moveRight: PLAYERS[clientIp].moveRight,
  //             moveUp: PLAYERS[clientIp].moveUp,
  //             moveDown: PLAYERS[clientIp].moveDown,
  //             run: PLAYERS[clientIp].run,
  //           },
  //         })
  //       );
  //     }
  //   });
  // });
};

const velX = 3.0;
const velY = 13.0;
const friction = 0.85;

var tick = 0;

export { createGameRoom, GameRoom };