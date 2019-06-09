const {
  Button, 
  TextView, 
  fs,
  ui,
  ImageView,
  Composite,
  AlertDialog,
  ProgressBar,
  ActionSheet
} = require('tabris');

function uploadFile(fileUri, cbDone, cbProgress){
    // NodeJS:
    let url = 'http://atm.net:808/v1/upload/image';
    // PHP:
    // let url = 'http://atm.net/test-post.php';

  let options = {
    fileKey : 'uploadImage',
    mimeType : 'image/jpg',
    fileName : fileUri.substr(fileUri.lastIndexOf('/') + 1),
    fileExt : fileUri.substr(fileUri.lastIndexOf('.') + 1),
    headers : {
      dummy: 'dummy'
    }
  }
  fs.readFile(fileUri).then(function(buffer){
    let oReq = new XMLHttpRequest();
    oReq.open("POST", url, true);
    oReq.setRequestHeader('Content-Type', 'application/octet-stream');
    oReq.setRequestHeader('params', JSON.stringify(options));
    oReq.onload = function (oEvent) {
      console.log(oEvent.target.$responseData);
      let data = oEvent.target;
      let res = JSON.parse(data.$responseData);
      let uploadResult = {
        fileName: res.result.fileName, 
        responseCode: data.$status, 
        bytesSent: res.result.size,
        result: res.result
      };
      (cbProgress||function(a,b,c){})(100, 100);
      (cbDone||(function(x,y, z){}))(false, uploadResult);            
    };
    oReq.ontimeout= function(){
      (cbDone||(function(x,y,z){}))({error: 'Request timeout'}, null);
    };
    oReq.onabort = function(){
      (cbDone||(function(x,y,z){}))({error: 'Request aborted'}, null);
    };
    oReq.onprogress = function(evt){
      if (evt.lengthComputable) {
        (cbProgress||function(a,b,c){})(evt.total, evt.loaded);
      } else {
        (cbProgress||function(a,b,c){})(100, 60);
      }
    };
    oReq.send(buffer);
  }).catch(function(e){
    (cbDone||(function(x,y,z){}))(e, null);
  });
}

let btnTakePic = new Button({
  left: 20, top: 40,
  text: 'Take Pic'
}).appendTo(ui.contentView);
let btnUpload = new Button({
  right: 20, baseline: btnTakePic,
  text: 'Upload'
}).appendTo(ui.contentView);

let composite = new Composite({
  top: [btnTakePic, 20], left:20, right:20, height: screen.height/2, background: '#fafafa'
}).appendTo(ui.contentView);
let pic = new ImageView({
  top: 1, left:1, right:1, bottom:1, scaleMode: 'fit'
}).appendTo(composite);

pic.sourceUri = '';

let progress = new ProgressBar({
  left: 10, bottom: 10, right: 10, minimum:0, maximum:100, selection:6, visible: false,
  tintColor: '#0c0'
}).appendTo(composite);

btnTakePic.on('select', function(){
  new ActionSheet({ actions: [{title: 'Camera'}, {title: 'Album'},] }).on({
    select: function({target: actionSheet, index}) {
      let options =  {
        quality: 60,
        sourceType: index==0 ? Camera.PictureSourceType.CAMERA: Camera.PictureSourceType.PHOTOLIBRARY,
        destinationType: Camera.DestinationType.FILE_URI,
        allowEdit: true,
        saveToPhotoAlbum: true
      };
      switch(index){
        case 0:
        case 1: 
          progress.visible = false;
          progress.selection = 0;
          navigator.camera.getPicture(function(uri){
            pic.sourceUri = uri;
            pic.image = {src: uri};
          }, function(er){
            new AlertDialog({title: er , buttons: {ok: 'OK'}  }).open();
          }, options);
          break;
        default:
          break;
      }
    },
    close: function() {}
  }).open();
});

btnUpload.on('select', function(){
  if (pic.sourceUri == ''){
    new AlertDialog({title: 'No photo selected' , buttons: {ok: 'OK'}  }).open();
    return;
  }
  let fileName = pic.sourceUri.replace('file://', '');
  uploadFile(fileName, function(er, res){
    if (er){
      progress.tintColor = '#f00',
      progress.maximum = 100;
      progress.selection = 100;
      progress.visible = true;
      console.log(er);
    } else {
      progress.tintColor = '#0c0',
      progress.maximum = 100;
      progress.selection = 100;
      progress.visible = true;
      console.log(res);
      new AlertDialog({title: 'Photo uploaded' , buttons: {ok: 'OK'}  }).open();
    }    
  }, function (total, sent){
    progress.tintColor = '#0c0',
    progress.maximum = total;
    progress.selection = sent;
    progress.visible = true;
  });
});
