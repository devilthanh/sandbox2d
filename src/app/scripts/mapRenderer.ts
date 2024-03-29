// import { GameMap } from '../../server/definitions/type';
// import GameClient from './game';

// class MapRenderer {
//   private _gameClient: GameClient;
//   private _gameMap: GameMap;
//   private _isMapLoaded: boolean;
//   private _isTileLoaded: boolean;
//   private _isShadowLoaded: boolean;
//   private _clientRotate: number;
//   private _screenTileWidthCount: number;
//   private _screenTileHeightCount: number;
//   private _canvas?: HTMLCanvasElement;
//   private _context2D?: CanvasRenderingContext2D;
//   private _scaleX: number;
//   private _scaleY: number;
//   private _images: any;
//   private _currentFps: number;
//   private _fpsCouner: number;
//   private _fpsTime: number;
//   private _fpsTotalTime: number;

//   constructor(gameClient: GameClient, gameMap: GameMap) {
//     this._gameClient = gameClient;
//     this._gameMap = gameMap;
//     this._isMapLoaded = false;
//     this._isTileLoaded = false;
//     this._isShadowLoaded = false;
//     this._clientRotate = 0;
//     this._currentFps = 0;
//     this._fpsCouner = 0;
//     this._fpsTime = Date.now();
//     this._fpsTotalTime = 0;
//     this._scaleX = 1;
//     this._scaleY = 1;
//     this._canvas = document.querySelector('canvas') || undefined;
//     this._context2D = this._canvas?.getContext('2d') || undefined;
//     if (this._canvas) {
//       this._canvas.width = this._canvas.offsetWidth;
//       this._canvas.height = this._canvas?.offsetHeight;
//       this._screenTileWidthCount = Math.ceil(this._canvas.width / (2 * this._gameMap.width));
//       this._screenTileHeightCount = Math.ceil(this._canvas.height / (2 * this._gameMap.height));
//     } else {
//       this._screenTileWidthCount = 0;
//       this._screenTileHeightCount = 0;
//     }
//     this._images = {};
//     this.initImages();
//     this.loadMap();
//     window.requestAnimationFrame(this.gameDrawLoop);
//     window.onmousemove = (event: MouseEvent) => {
//       const gameScreen = document.getElementById('gameScreen') || undefined;
//       if (gameScreen) {
//         var x = event.pageX - gameScreen.offsetLeft;
//         var y = event.pageY - gameScreen.offsetTop;
//         this._clientRotate = -Math.atan2(gameScreen.offsetWidth / 2 - x, gameScreen.offsetHeight / 2 - y);
//       }
//     };
//   }

//   private initImages = () => {
//     this._images.tiles = [];
//     this._images.shadows = [];
//     this._images.tileset = new Image();
//     this._images.tileset.src = '/client/img/default_dust.png';
//     this._images.tileShadow = new Image();
//     this._images.tileShadow.src = '/client/img/tileshadow.png';
//     this._images.cloud = new Image();
//     this._images.cloud.src = '/client/img/cloud.png';
//     this._images.player = new Image();
//     this._images.player.src = '/client/img/player.png';
//     this._images.playerShadow = new Image();
//     this._images.playerShadow.src = '/client/img/playershadow.png';
//     this._images.monster = new Image();
//     this._images.monster.src = '/client/img/monster.png';
//     this._images.mapShadow = new Image();
//     this._images.mapShadow.src = '/client/img/shadowmap.png';

//     this._images.effect = {};
//     this._images.effect.blood = new Image();
//     this._images.effect.blood.src = '/client/img/blood.png';
//     this._images.effect.explosion = new Image();
//     this._images.effect.explosion.src = '/client/img/explosion.png';

//     this._images.tileset.onload = () => {
//       this.loadTiles();
//     };

//     this._images.mapShadow.onload = () => {
//       this.loadMapShadow();
//     };
//   };

//   private drawScaleRect = (x: number, y: number, width: number, height: number) => {
//     this._context2D?.rect(
//       Math.floor(x * this._scaleX),
//       Math.floor(y * this._scaleY),
//       Math.ceil(width * this._scaleX),
//       Math.ceil(height * this._scaleY)
//     );
//   };

//   private drawScaleImage = (img: CanvasImageSource, x: number, y: number, width: number, height: number) => {
//     this._context2D?.drawImage(
//       img,
//       Math.floor(x * this._scaleX),
//       Math.floor(y * this._scaleY),
//       Math.ceil(width * this._scaleX),
//       Math.ceil(height * this._scaleY)
//     );
//   };

//   private drawScaleCropImage = (
//     img: CanvasImageSource,
//     sx: number,
//     sy: number,
//     sw: number,
//     sh: number,
//     x: number,
//     y: number,
//     width: number,
//     height: number
//   ) => {
//     this._context2D?.drawImage(
//       img,
//       sx,
//       sy,
//       sw,
//       sh,
//       Math.floor(x * this._scaleX),
//       Math.floor(y * this._scaleY),
//       Math.ceil(width * this._scaleX),
//       Math.ceil(height * this._scaleY)
//     );
//   };

//   private loadTiles = () => {
//     if (this._gameMap) {
//       const tilesW = this._images.tileset.width / this._gameMap.tileWidth;
//       const tilesH = this._images.tileset.height / this._gameMap.tileHeight;
//       for (var y = 0; y < tilesH; y++) {
//         for (var x = 0; x < tilesW; x++) {
//           this._images.tiles.push({
//             x: x * this._gameMap.tileWidth,
//             y: y * this._gameMap.tileHeight,
//             w: this._gameMap.tileWidth,
//             h: this._gameMap.tileHeight,
//           });
//         }
//       }
//       this._isTileLoaded = true;
//     }
//   };

//   private loadMapShadow = () => {
//     const shadowW = this._images.mapShadow.width / this._gameMap.tileWidth;
//     const shadowH = this._images.mapShadow.height / this._gameMap.tileHeight;
//     for (var y = 0; y < shadowH; y++) {
//       for (var x = 0; x < shadowW; x++) {
//         this._images.shadows.push({
//           x: x * this._gameMap.tileWidth,
//           y: y * this._gameMap.tileHeight,
//           w: this._gameMap.tileWidth,
//           h: this._gameMap.tileHeight,
//         });
//       }
//     }
//     this._isShadowLoaded = true;
//   };

//   private loadMap = () => {
//     for (var y = 0; y < this._gameMap.height; y++)
//       for (var x = 0; x < this._gameMap.width; x++) {
//         this._gameMap.data[y][x].sd = 0;
//         if (this._gameMap.data[y][x].type === 1 || this._gameMap.data[y][x].type === 5) this._gameMap.data[y][x].sd = 2;
//         if (this._gameMap.data[y][x].type === 2) this._gameMap.data[y][x].sd = 1;

//         var sd = 0;

//         if (this._gameMap.data[y][x].sd === 0) {
//           if (x - 1 >= 0) sd += this._gameMap.data[y][x - 1].sd * 3;
//           if (y - 1 >= 0) sd += this._gameMap.data[y - 1][x].sd;
//           if (x - 1 >= 0 && y - 1 >= 0) sd += this._gameMap.data[y - 1][x - 1].sd * 9;

//           switch (sd) {
//             case 1:
//               this._gameMap.data[y][x].sdId = 3;
//               break;
//             case 2:
//               this._gameMap.data[y][x].sdId = 2;
//               break;
//             case 3:
//               this._gameMap.data[y][x].sdId = 9;
//               break;
//             case 4:
//             case 13:
//             case 22:
//               this._gameMap.data[y][x].sdId = 13;
//               break;
//             case 5:
//             case 14:
//             case 23:
//               this._gameMap.data[y][x].sdId = 11;
//               break;
//             case 6:
//               this._gameMap.data[y][x].sdId = 8;
//               break;
//             case 7:
//             case 16:
//             case 25:
//               this._gameMap.data[y][x].sdId = 12;
//               break;
//             case 8:
//             case 17:
//             case 26:
//               this._gameMap.data[y][x].sdId = 10;
//               break;
//             case 9:
//               this._gameMap.data[y][x].sdId = 5;
//               break;
//             case 10:
//               this._gameMap.data[y][x].sdId = 1;
//               break;
//             case 11:
//               this._gameMap.data[y][x].sdId = 16;
//               break;
//             case 12:
//               this._gameMap.data[y][x].sdId = 7;
//               break;
//             case 15:
//               this._gameMap.data[y][x].sdId = 14;
//               break;
//             case 18:
//               this._gameMap.data[y][x].sdId = 4;
//               break;
//             case 19:
//               this._gameMap.data[y][x].sdId = 17;
//               break;
//             case 20:
//               this._gameMap.data[y][x].sdId = 0;
//               break;
//             case 21:
//               this._gameMap.data[y][x].sdId = 15;
//               break;
//             case 24:
//               this._gameMap.data[y][x].sdId = 6;
//               break;
//             default:
//               this._gameMap.data[y][x].sdId = -1;
//           }
//         } else if (this._gameMap.data[y][x].sd === 1) {
//           if (x - 1 >= 0) sd += Math.floor(this._gameMap.data[y][x - 1].sd / 2) * 2;
//           if (y - 1 >= 0) sd += Math.floor(this._gameMap.data[y - 1][x].sd / 2);
//           if (x - 1 >= 0 && y - 1 >= 0) sd += Math.floor(this._gameMap.data[y - 1][x - 1].sd / 2) * 4;

//           switch (sd) {
//             case 1:
//               this._gameMap.data[y][x].sdId = 3;
//               break;
//             case 2:
//               this._gameMap.data[y][x].sdId = 9;
//               break;
//             case 3:
//             case 7:
//               this._gameMap.data[y][x].sdId = 13;
//               break;
//             case 4:
//               this._gameMap.data[y][x].sdId = 5;
//               break;
//             case 5:
//               this._gameMap.data[y][x].sdId = 1;
//               break;
//             case 6:
//               this._gameMap.data[y][x].sdId = 7;
//               break;
//             default:
//               this._gameMap.data[y][x].sdId = -1;
//           }
//         }
//       }
//     this._isMapLoaded = true;
//   };

//   private gameDrawLoop = () => {
//     if (this._isMapLoaded && this._isTileLoaded && this._isShadowLoaded && this._canvas && this._context2D) {
//       this._context2D.clearRect(0, 0, this._canvas.width, this._canvas.height);
//       this.mapUpdate('floor');
//       this.mapUpdate('tileshadow_obstacle');
//       this.mapUpdate('obstacle');
//       this.shadowUpdate();
//       this.playersUpdate();
//       this.mapUpdate('tileshadow_wall');
//       this.mapUpdate('wall');
//       this.statsUpdate();

//       const now = Date.now();
//       const deltaTime = now - this._fpsTime;
//       this._fpsTotalTime += deltaTime;
//       this._fpsCouner++;
//       this._fpsTime = now;

//       if (this._fpsTotalTime >= 1000) {
//         this._fpsTotalTime -= 1000;
//         this._currentFps = this._fpsCouner;
//         this._fpsCouner = 0;
//       }
//     }

//     window.requestAnimationFrame(this.gameDrawLoop);
//   };

//   private mapUpdate = (style: 'floor' | 'tileshadow_obstacle' | 'obstacle' | 'tileshadow_wall' | 'wall') => {
//     const clientPlayer = this._gameClient.clientPlayer;
//     if (clientPlayer != undefined && this._context2D && this._canvas) {
//       var startX = Math.max(
//         0,
//         Math.floor(clientPlayer.position.x / this._gameMap.tileWidth) - this._screenTileWidthCount
//       );
//       var startY = Math.max(
//         0,
//         Math.floor(clientPlayer.position.y / this._gameMap.tileHeight) - this._screenTileHeightCount
//       );
//       var endX = Math.min(
//         this._gameMap.width,
//         Math.ceil(clientPlayer.position.x / this._gameMap.tileWidth) + this._screenTileWidthCount
//       );
//       var endY = Math.min(
//         this._gameMap.height,
//         Math.ceil(clientPlayer.position.y / this._gameMap.tileHeight) + this._screenTileHeightCount
//       );

//       for (var y = startY; y < endY; y++)
//         for (var x = startX; x < endX; x++) {
//           this._context2D.beginPath();
//           var tileId = this._gameMap.data[y][x].id;
//           var tileType = this._gameMap.data[y][x].type;

//           if (style === 'tileshadow_obstacle' && this._gameMap.data[y][x].type === 2)
//             this.drawScaleImage(
//               this._images.tileShadow,
//               x * this._gameMap.tileWidth - clientPlayer.position.x + this._canvas.width / 2 - 2,
//               y * this._gameMap.tileHeight - clientPlayer.position.y + this._canvas.height / 2 - 2,
//               36,
//               36
//             );
//           else if (style === 'tileshadow_wall' && this._gameMap.data[y][x].type === 1)
//             this.drawScaleImage(
//               this._images.tileShadow,
//               x * this._gameMap.tileWidth - clientPlayer.position.x + this._canvas.width / 2 - 2,
//               y * this._gameMap.tileHeight - clientPlayer.position.y + this._canvas.height / 2 - 2,
//               36,
//               36
//             );
//           else if (style === 'floor' && (this._gameMap.data[y][x].type === 0 || this._gameMap.data[y][x].type >= 10))
//             this.drawScaleCropImage(
//               this._images.tileset,
//               this._images.tiles[tileId].x,
//               this._images.tiles[tileId].y,
//               this._images.tiles[tileId].w,
//               this._images.tiles[tileId].h,
//               x * this._gameMap.tileWidth - clientPlayer.position.x + this._canvas.width / 2,
//               y * this._gameMap.tileHeight - clientPlayer.position.y + this._canvas.height / 2,
//               this._gameMap.tileWidth,
//               this._gameMap.tileHeight
//             );
//           else if (style === 'obstacle' && this._gameMap.data[y][x].type === 2)
//             this.drawScaleCropImage(
//               this._images.tileset,
//               this._images.tiles[tileId].x,
//               this._images.tiles[tileId].y,
//               this._images.tiles[tileId].w,
//               this._images.tiles[tileId].h,
//               x * this._gameMap.tileWidth - clientPlayer.position.x + this._canvas.width / 2,
//               y * this._gameMap.tileHeight - clientPlayer.position.y + this._canvas.height / 2,
//               this._gameMap.tileWidth,
//               this._gameMap.tileHeight
//             );
//           else if (style === 'wall' && this._gameMap.data[y][x].type === 1)
//             this.drawScaleCropImage(
//               this._images.tileset,
//               this._images.tiles[tileId].x,
//               this._images.tiles[tileId].y,
//               this._images.tiles[tileId].w,
//               this._images.tiles[tileId].h,
//               x * this._gameMap.tileWidth - clientPlayer.position.x + this._canvas.width / 2,
//               y * this._gameMap.tileHeight - clientPlayer.position.y + this._canvas.height / 2,
//               this._gameMap.tileWidth,
//               this._gameMap.tileHeight
//             );
//           this._context2D.closePath();
//         }
//     }
//   };

//   private playersUpdate = () => {
//     const clientPlayer = this._gameClient.clientPlayer;
//     if (clientPlayer != undefined && this._context2D && this._canvas) {
//       for (const player of this._gameClient.players) {
//         let rot: number;
//         if (!player.onAttack) {
//           rot = player.id === clientPlayer.id ? this._clientRotate : player.rotate;
//         } else {
//           rot = player.fakeRotate;
//         }
//         this._context2D.beginPath();
//         this._context2D.save();
//         this._context2D.drawImage(
//           this._images.playerShadow,
//           player.position.x - clientPlayer.position.x + this._canvas.width / 2 - this._images.playerShadow.width / 2,
//           player.position.y - clientPlayer.position.y + this._canvas.height / 2 - this._images.playerShadow.height / 2,
//           this._images.playerShadow.width,
//           this._images.playerShadow.height
//         );
//         this._context2D.translate(
//           player.position.x - clientPlayer.position.x + this._canvas.width / 2,
//           player.position.y - clientPlayer.position.y + this._canvas.height / 2
//         );
//         this._context2D.rotate(rot);
//         this._context2D.drawImage(
//           this._images.player,
//           -this._images.player.width / 2,
//           -this._images.player.height / 2,
//           this._images.player.width,
//           this._images.player.height
//         );
//         this._context2D.restore();
//         this._context2D.closePath();
//       }
//     }
//   };

//   private shadowUpdate = () => {
//     const clientPlayer = this._gameClient.clientPlayer;
//     if (clientPlayer != undefined && this._context2D && this._canvas) {
//       var startX = Math.max(
//         0,
//         Math.floor(clientPlayer.position.x / this._gameMap.tileWidth) - this._screenTileWidthCount
//       );
//       var startY = Math.max(
//         0,
//         Math.floor(clientPlayer.position.y / this._gameMap.tileHeight) - this._screenTileHeightCount
//       );
//       var endX = Math.min(
//         this._gameMap?.width,
//         Math.ceil(clientPlayer.position.x / this._gameMap.tileWidth) + this._screenTileWidthCount
//       );
//       var endY = Math.min(
//         this._gameMap.height,
//         Math.ceil(clientPlayer.position.y / this._gameMap.tileHeight) + this._screenTileHeightCount
//       );

//       for (var y = startY; y < endY; y++)
//         for (var x = startX; x < endX; x++) {
//           this._context2D.beginPath();
//           if (this._gameMap.data[y][x].sd === 0 && this._gameMap.data[y][x].sdId >= 0) {
//             this.drawScaleCropImage(
//               this._images.mapShadow,
//               this._images.shadows[this._gameMap.data[y][x].sdId].x,
//               this._images.shadows[this._gameMap.data[y][x].sdId].y,
//               this._images.shadows[this._gameMap.data[y][x].sdId].w,
//               this._images.shadows[this._gameMap.data[y][x].sdId].h,
//               x * this._gameMap.tileWidth - clientPlayer.position.x + this._canvas.width / 2,
//               y * this._gameMap.tileHeight - clientPlayer.position.y + this._canvas.height / 2,
//               this._gameMap.tileWidth,
//               this._gameMap.tileHeight
//             );
//           } else if (this._gameMap.data[y][x].sd === 1 && this._gameMap.data[y][x].sdId >= 0) {
//             this.drawScaleCropImage(
//               this._images.mapShadow,
//               this._images.shadows[this._gameMap.data[y][x].sdId].x,
//               this._images.shadows[this._gameMap.data[y][x].sdId].y,
//               this._images.shadows[this._gameMap.data[y][x].sdId].w,
//               this._images.shadows[this._gameMap.data[y][x].sdId].h,
//               x * this._gameMap.tileWidth - clientPlayer.position.x + this._canvas.width / 2,
//               y * this._gameMap.tileHeight - clientPlayer.position.y + this._canvas.height / 2,
//               this._gameMap.tileWidth,
//               this._gameMap.tileHeight
//             );
//           }

//           this._context2D.closePath();
//         }
//     }
//   };

//   private statsUpdate = () => {
//     const clientPlayer = this._gameClient.clientPlayer;
//     if (clientPlayer != undefined && this._context2D && this._canvas) {
//       this._context2D.beginPath();
//       this._context2D.font = '9pt Arial';
//       this._context2D.fillStyle = 'white';
//       this._context2D.textAlign = 'right';
//       this._context2D.fillText(
//         `Ping: ${this._gameClient.latency} ms | ${this._currentFps} fps`,
//         this._canvas.width - 10,
//         20
//       );

//       for (const player of this._gameClient.players) {
//         this._context2D.fillStyle = 'blue';
//         this._context2D.textAlign = 'center';
//         this._context2D.font = 'bold 9pt Arial';
//         this._context2D.fillText(
//           player.name,
//           player.position.x - clientPlayer.position.x + this._canvas.width / 2,
//           player.position.y - clientPlayer.position.y + this._canvas.height / 2 + 30
//         );
//       }

//       this._context2D.textAlign = 'right';
//       this._context2D.fillStyle = 'rgba(255, 255, 255, 0.8)';
//       this._context2D.fillText('Armor', this._canvas.width - 25, this._canvas.height - 120);
//       this._context2D.font = 'bold 12pt Arial';
//       this._context2D.fillText('Health', this._canvas.width - 25, this._canvas.height - 60);
//       this._context2D.fillText(clientPlayer.sheild.toString(), this._canvas.width - 20, this._canvas.height - 100);

//       this._context2D.font = 'bold 30pt Arial';
//       this._context2D.fillText(clientPlayer.health.toString(), this._canvas.width - 20, this._canvas.height - 20);

//       this._context2D.closePath();
//     }
//   };
// }

// export default MapRenderer;
export {};
