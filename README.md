# tabrisjs-upload-file
Upload file from TabrisJS App to NodeJS &amp; PHP based server.

## Background

I was struggle to get this simple thing to work: Upload file(s) from TabrisJS App and receive them on NodeJS/PHP server, then save them to file. I tried formdata polyfill, multer on Node side, etc., just to not avail. Several tries and errors gave some light: it was very simple!

Just use TabrisJS' XMLHttpRequest - which supports binary transfer - and everything works like charm.

## Prerequisites

### TabrisJS App Side

The TabrisJS app needs these plugins to work:

* cordova-plugin-camera for taking/browsing photo
If you are building offline - i.e. your own development machine, use:
``` bash
  cd build/cordova
```
Add target platform(s):
`cordova platform add android`
`cordova platform add ios`

Add the plugin:
`cordova-plugin-camera`

You can back to the TabrisJS App's root folder by:
`cd ../..`
