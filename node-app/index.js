'use strict';

const _SERVER_DOMAIN = 'atm.net';
const APP_PORT       = 808;
const FILE_STORAGE   = 'filestorage';

const express = require('express');
const fs = require('fs');
const ip = require('ip');
const cripto = require('crypto');

const server = express();
server
  .post('/v1/upload/image', function(rq, rs){
    let data = [];
    let params;
    if (rq.headers['params']==''){
      params = {
        fileKey: 'uploadImage',
        mimeType : 'image/jpeg',
        fileExt: 'jpg',
        fileName: 
          'img-'+cripto.createHmac('sha256', 'uploadImage'+Math.radom()).update('upl'+Math.random()).digest('hex')+
          '-'+Math.random()+
          '.jpg',
        headers : {
          
        }
      }
    } else {
      params = JSON.parse(rq.headers['params']);
      params.fileName = 
        'img-'+cripto.createHmac('sha256', params.fileName+Math.random()).update('upl'+Math.random()).digest('hex')+
        '-'+Math.random()+'.'+
        params.fileExt
    }
    rq.on('data', function(chunk){
      data.push(chunk);
    });
    rq.on('end', function(chunk){      
      let buffer = Buffer.concat(data);
      let fname = './'+FILE_STORAGE+'/'+params.fileName;
      let writer = fs.createWriteStream(fname);
      writer.on('open', function(f){
        writer.write(buffer, function(e){
          if (e){
            console.log(e);
            rs.end(JSON.stringify({error: true, msg: 'File upload failed'}));
          }
          else {
            let fileUri = 'http://'+_SERVER_DOMAIN+'/filestorage/'+params.fileName;
            let resObj = {error: false, result: {
              fileName: params.fileName,
              filePath: fname,
              fileUri: fileUri,
              size: buffer.length,
              msg: "File uploaded\nRetrieve this file by GET "+fileUri
              }
            };
            // console.log(resObj);
            rs.end(JSON.stringify(resObj));
          }
        });
      });
    });
  })
  .get('/ping', (r,s,n)=>{
    // console.log(r.app);
    s.write(JSON.stringify({ping:'OK'}));
    s.end();
  })
  ;
  server.listen(APP_PORT, () => {
    console.log('Listening on ' + ip.address() + ':' + APP_PORT);
  });