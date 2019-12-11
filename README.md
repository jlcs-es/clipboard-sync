# clipboard-sync
Sync your clipboard between two computers

## Description

This is an inneficient way to synchronize two clipboards using the electron API to access and modify it.

By default, your instance will listen on all interfaces at port 7777. On startup, it will ask you the address of the other machine.

In the background, they use websockets to send the clipboard status to the other machine, if it detects any change on the local clipboard.

This tool supports synchronization of the following [clipboards](https://electronjs.org/docs/api/clipboard#clipboardwritedata-type):

* text
* html
* **image**
* rtf
* bookmark

## Compile

```bash
$ npm install
$ npm make
```

> If you are on MacOS, you may want to add in `package.json` a [DMG electron-forge maker](https://www.electronforge.io/config/makers/dmg). Note that building for MacOS has not been tested.


## TODO

* [ ] Improve P2P communication. Currently: 2 websocket channels used unidirectionally.
* [ ] Support more than two machines. But trying to keep the P2P design -> no master/slave
* [ ] Release compiled versions for all platforms
