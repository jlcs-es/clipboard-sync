const { app, Menu, Tray, clipboard, nativeImage } = require('electron');
const prompt = require('electron-prompt');
const settings = require('electron-settings');
const ioServer = require('socket.io')();
const _ = require('lodash');
const locks = require('locks');


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

let tray = null;
let peer;
let brotherSocket;
let synchronizedClipboard = {
  text: null,
  html: null,
  image: null,
  rtf: null,
  bookmark: null
};
let scMutex = locks.createMutex();

function clipboardListeningServer() {
  ioServer.on('connection', socket => {
      socket.on('update-clipboard', newClipboard => {
        scMutex.lock(function() {
          newClipboard.image = newClipboard.image ? nativeImage.createFromDataURL(newClipboard.image) : undefined;
          clipboard.write(newClipboard);
          synchronizedClipboard = {
              text: clipboard.readText(),
              html: clipboard.readHTML(),
              image: clipboard.readImage().toDataURL(),
              rtf: clipboard.readRTF(),
              bookmark: clipboard.readBookmark()
            }
          scMutex.unlock();
        });
      });
  });

  ioServer.listen(7777);
}

function mainLoop() {

  clipboardListeningServer();

  tray = new Tray(__dirname + '/tray.jpg');
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Quit',
      click: function() {
        app.quit();
      }
    }
  ]);
  tray.setToolTip('Clipboard Sync');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    tray.popUpContextMenu(contextMenu)
  });

  defaultPeer = settings.has('peer') ? settings.get('peer') : 'http://10.144.29.6:7777'

  prompt({
    title: `Father, who's my brother?`,
    label: `Father, who's my brother?`,
    value: defaultPeer,
    menuBarVisible: false
  }).then( r => {
    if(r === null) {
      console.log('user cancelled');
      app.quit();
    } else {
      peer = r;
      console.log(`Peer: ${peer}`);
      settings.set('peer', peer);
      const brotherSocket = require('socket.io-client')(peer);

      setInterval(() => {
        if(brotherSocket.connected) {
          scMutex.lock(function() {
            let localCB = {
              text: clipboard.readText(),
              html: clipboard.readHTML(),
              image: clipboard.readImage().toDataURL(),
              rtf: clipboard.readRTF(),
              bookmark: clipboard.readBookmark()
            }
            if(!_.isEqual(synchronizedClipboard, localCB)) {
              synchronizedClipboard = _.cloneDeep(localCB);
              brotherSocket.emit('update-clipboard', localCB);
            }
            scMutex.unlock();
          });
        }
      }, 500);
    }
  }).catch(console.error);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', mainLoop);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
});
