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
```
cordova platform add android
cordova platform add ios
```

Add the plugin:
```
cordova-plugin-camera
```

You can back to the TabrisJS App's root folder by:
```
cd ../..
```

* Device/Emulator for testing

You may use IOS Simulator on mac machine or Android Emulator on other platforms.
Device/Emulator setups are not covered here.

### PHP Side:

Enable your HTTP server with PHP support. XAMPP, WAMP, UniServer are sufficient. Configure your PHP's maximum file upload size to match your requirements.

Create a folder in your HTTP server and copy file `php-app/test-post.php` there, and mark its url, for example:
`http://yourserver.net/test-post.php`. This url will be used by TabrisJS app to post files to.

### NodeJS Side:

Copy folder `node-app` to your disk. CD into the folder and make sure everything needed is installed.
```
cd node-app
npm i
```

While in there, create a folder `filestorage` - if not exists - where uploaded files will be put into:
```
mkdir filestorage
```

## Testing

### Run PHP

Start your http server to serve PHP file.

### Run NodeJS App

CD into `node-app` folder and start the server:
```
cd node-app
npm start
```

If you see this `Listening on yo.ur.i.p:808`, your NodeJS app is running. Please mark the IP and PORT.

### Run TabrisJS App

Open `app.js` file. Edit these lines
```
function uploadFile(fileUri, cbDone, cbProgress){
    // NodeJS:
    let url = 'http://atm.net:808/v1/upload/image';
    // PHP:
    // let url = 'http://atm.net/test-post.php';
    .........
```

To test upload to PHP, use `let url = 'http://yourserver.net/test-post.php';`.

To test upload to NodeJS, use `let url = 'http://yo.ur.i.p:808/v1/upload/image';`. The route `v1/upload/image` must match the route defined on `index.js` on `node-app` folder:
```
// .........
.post('/v1/upload/image', function(rq, rs){ ... });
// ........
```


CD into `tabris-app` and run
```
tabris run android|ios
```

## Screenshots

![Screenshot 1](/screenshots/Simulator Screen Shot - iPhone X - 2019-06-09 at 16.53.46.png?raw=true)

![Screenshot 1](/screenshots/Simulator Screen Shot - iPhone X - 2019-06-09 at 16.53.59.png?raw=true)

![Screenshot 1](/screenshots/Simulator Screen Shot - iPhone X - 2019-06-09 at 16.54.07.png?raw=true)

![Screenshot 1](/screenshots/Screen Shot 2019-06-09 at 16.54.22.png?raw=true)
