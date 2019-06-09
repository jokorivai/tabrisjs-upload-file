const exp = require('express');
const fs = require('fs');
const cripto = require('crypto');
module.exports = function(wsServer, pgClient, dbParams){
  var router = exp.Router();
  router
  .get('/version', (q,s,n)=>{
    s.write(JSON.stringify({name: 'JSS Mobile Service', version: '1.0.0'}));
    s.end();
  })
  .get('/v1/broadcast/:msg', function(rq, rs, next){
    rq.setTimeout(180000);
    let msg = rq.params.msg;
    wsServer.broadcast(msg, function(count){
      rs.write(JSON.stringify({error: false, data: 'Message broadcasted to '+count+' client(s).'}));
    });    
    rs.end();
  })
  //  Login: 1. Get User Identification Number (UIN)
  .get('/v1/users/uin/:email', (rq,rs) => {
    let email = rq.params.email;
    let sql = "select (md5(id||user_name||user_password||email||full_name||allow_login||group_kode)||'-'||"+
      "md5(group_kode||allow_login||id||full_name||user_name||user_password)) uin from "+
      "usr_user where email = '"+email+"'";
    pgClient.pg(function(p){
      if (p.error){
        rs.write(JSON.stringify(e));
        rs.end();
      } else {
        p.query(sql, (e, data)=>{
          if (e){
            rs.write(JSON.stringify({error: true, msg: 'Email tidak terdaftar di sistem.'}));
          } else {
            if (data.rowCount > 0){
              rs.write(JSON.stringify({error: false, uin: data.rows[0].uin}));
            } else {
              rs.write(JSON.stringify({error: true, msg: 'Email tidak terdaftar di sistem.'}));
            }
          }
          rs.end();
        });
      }
    });  
  }) 
  // Can user access mobile app?
  .get('/v1/users/hasmobileaccess/:email', (rq, rs) =>{
    let email = rq.params.email;
    let sql = "select (case (select group_kode from usr_user where email = '"+email+"') "+
      "when  'DEV' then 'Y' else accessible_by(coalesce((select id from usr_user where email = '"+email+
      "'), 0), 'Mengakses Mobile App MIS', 'Mobile App') end) akses";
    pgClient.pg(function(p){
      if (p.error){
        rs.write(JSON.stringify({error: true, accessible: 'N'}));
        rs.end();
      } else {
        p.query(sql, (e, data)=>{
          if (e){
            rs.write(JSON.stringify({error: true, accessible: 'N'}));
          } else {
            let akses = data.rows[0].akses;
            rs.write(JSON.stringify({error: akses!='Y', accessible: akses}));
          }
          rs.end();
        });
      }
    });  
  })
  // User profile photo thumbnail
  .get('/v1/users/profile-thumb/:username', (rq,rs) => {
    let user = rq.params.username;
    let sql = "select avatar from usr_user where user_name = '"+user+"'";
    pgClient.pg(function(p){
      if (p.error){
        rs.write(JSON.stringify(e));
        rs.end();
      } else {
        p.query(sql, (e, data)=>{
          if (e){
            rs.write(JSON.stringify({error: true, msg: 'User tidak terdaftar di sistem.'}));
          } else {
            if (data.rowCount > 0){
              let fn = dbParams.mainAvatarBaseUri+data.rows[0].avatar;
              avatar = {
                big   : fn +'-512.jpg',
                medium: fn +'-128.jpg',
                small : fn +'-64.jpg'
              };
              rs.write(JSON.stringify({error: false, avatar: avatar}));
            } else {
              rs.write(JSON.stringify({error: true, msg: 'User tidak terdaftar di sistem.'}));
            }
          }
          rs.end();
        });
      }
    });  
  }) 
  // Login: 2. Login using UIN dan Client generated Password:
  .get('/v1/users/login/:uin/:cgp', (rq,rs) => {
    let uin = rq.params.uin;
    let cgp = rq.params.cgp;
    let sql = "select user_name, full_name from "+
      "usr_user where ((md5(id||user_name||user_password||email||full_name||allow_login||group_kode)||'-'||"+
      "md5(group_kode||allow_login||id||full_name||user_name||user_password))  = '"+uin+"') and ("+
      "md5('"+uin+"'||user_password)"
      +" = '"+cgp+"')";
    pgClient.pg(function(p){
      if (p.error){
        rs.write(JSON.stringify(e));
        rs.end();
      } else {
        p.query(sql, (e, data)=>{
          if (e){
            rs.write(JSON.stringify({error: true, msg: 'Login tidak valid.'}));
          } else {
            if (data.rowCount > 0){
              rs.write(JSON.stringify({error: false, msg: 'Welcome', user_name: data.rows[0].user_name, full_name: data.rows[0].full_name}));
            } else {
              rs.write(JSON.stringify({error: true, msg: 'Login tidak valid.'}));
            }
          }
          rs.end();
        });
      }
    }); 
  }) 
  //  IJP Hari Ini:
  .get('/v1/ijp/:produk/:tgl1/:tgl2', (rq,rs)=>{
    let produk = (rq.params.produk||'NA').toUpperCase();
    let tgl1 = rq.params.tgl1;
    let tgl2 = rq.params.tgl2;
    if (produk == 'SB'){
      let sql = "select no_sertifikat sp, penerima, porto_nama_kontraktor nasabah, "+
        "produk, cert_jumlah_kredit plafond, n_ijp ijp, n_diskon fb, n_asuransi pa, n_fee fa, "+
        "n_ijp_regaransi pr, n_regaransi regar, n_jaminan_rts rts, n_ijp_netto net "+
        "from vw_pjk_sb where (substr(kode,1,3) = '"+dbParams.CAB+"') and (tgl_input>='"+tgl1+"')  and (tgl_input<='"+tgl2+"')";
      pgClient.pg(function(p){
        if (p.error){
          rs.write(JSON.stringify(e));
          rs.end();
        } else {
          p.query(sql, (e, data)=>{
            if (e){
              rs.write(JSON.stringify({error: true, msg: 'Invalid parameter(s).'}));
            } else {
              rs.write(JSON.stringify({error: false, data: data.rows}));
            }
            rs.end();
          });
        }
      }); 
    }
    else if (produk == 'all'){
      let sql = "select no_sertifikat sp, penerima, porto_nama_kontraktor nasabah, "+
        "produk, cert_jumlah_kredit plafond, n_ijp ijp, n_diskon fb, n_asuransi pa, n_fee fa, "+
        "n_ijp_regaransi pr, n_regaransi regar, n_jaminan_rts rts, n_ijp_netto net "+
        "from vw_pjk_sb where (substr(kode,1,3) = '"+dbParams.CAB+"') and (tgl_input>='"+tgl1+"')  and (tgl_input<='"+tgl2+"')";
      pgClient.pg(function(p){
        if (p.error){
          rs.write(JSON.stringify(e));
          rs.end();
        } else {
          p.query(sql, (e, data)=>{
            if (e){
              rs.write(JSON.stringify({error: true, msg: 'Invalid parameter(s).'}));
            } else {
              rs.write(JSON.stringify({error: false, data: data.rows}));
            }
            rs.end();
          });
        }
      }); 
    }
    else {
      rs.write(JSON.stringify({error: true, msg: 'Belum diimplementasikan.'}));
      rs.end();
    }
  })
  // Fluktuasi IJP Bulan Ini:
  .get('/v1/ijpf/:thn/:bln', (rq, rs, next) => {
    let thn = rq.params.thn,
      bln = ('00'+rq.params.bln).slice(-2);
    let par = thn+'-'+bln;
    let sql = "with y as (with x as (select generate_series(1, substr(((date_trunc('MONTH', '"+par+"-01'::date) + INTERVAL '1 MONTH - 1 day')::date)::text,9,2)::integer) tgl) "+
      "select '1KR' prod, x.tgl, sum(coalesce(t.kr_ijp_nominal,0)) ijp from x "+
      "left join pjk_penjaminan p on p.cs_tanggal_input = ('"+par+"'||'-'||lpad(x.tgl::text,2,'0'))::date "+
      "left join pjk_terjamin_kredit t on p.kode = t.kode_penjaminan group by x.tgl union all "+
      "select '2SB' prod, x.tgl, sum(coalesce(t.cert_nilai_ijp,0)) ijp from x "+
      "left join pjk_penjaminan p on p.cs_tanggal_input = ('"+par+"'||'-'||lpad(x.tgl::text,2,'0'))::date "+
      "left join pjk_terjamin_surety_bond t on p.kode = t.kode_penjaminan group by x.tgl union all "+
      "select '3CG' prod, x.tgl, sum(coalesce(t.cg_ijp_nominal,0)) ijp from x "+
      "left join pjk_penjaminan p on p.cs_tanggal_input = ('"+par+"'||'-'||lpad(x.tgl::text,2,'0'))::date "+
      "left join pjk_terjamin_contra_garansi t on p.kode = t.kode_penjaminan group by x.tgl) "+
      " select prod, tgl, ijp from y order by prod asc, tgl asc";
    pgClient.pg(function(p){
      if (p.error){
        rs.write(JSON.stringify(e));
        rs.end();
      } else {
        p.query(sql, (e, data)=>{
          if (e){
            rs.write(JSON.stringify({error: true, msg: 'Invalid parameter(s).'}));
          } else {
            rs.write(JSON.stringify({error: false, data: data.rows}));
          }
          rs.end();
        });
      }
    }); 
  })
  // volume Jaminan per produk
  .get('/v1/vol/:thn/:bln', (rq, rs, next) => {
    let thn = rq.params.thn,
      bln = ('00'+rq.params.bln).slice(-2);
    let par = thn+'-'+bln;
    let sql = "with x as (select distinct p.kode, p.uraian, p.vkode prod from pjk_sub_jenis_bisnis p where (not p.kode like 'Z%')) "+
      "select 'KR' prod, coalesce(sum(coalesce(k.kr_coverage_nominal,0)),0) volume from pjk_terjamin_kredit k inner join pjk_penjaminan j on j.kode = k.kode_penjaminan "+
      "inner join pjk_sub_jenis_bisnis_xx sp on j.kode_sub_produk = sp.kode inner join x on x.kode = sp.kd_produk where substr(j.cs_tanggal_input::text,1,7) = '"+par+"' "+
      "union all  select 'SB' prod, coalesce(sum(coalesce(k.cert_jumlah_kredit,0)),0) volume from pjk_terjamin_surety_bond k inner join pjk_penjaminan j on j.kode = k.kode_penjaminan "+
      "inner join pjk_sub_jenis_bisnis_xx sp on j.kode_sub_produk = sp.kode inner join x on x.kode = sp.kd_produk where substr(j.cs_tanggal_input::text,1,7) = '"+par+"' "+
      "union all  select 'CG' prod, coalesce(sum(coalesce(k.cg_coverage_nominal,0)),0) volume from pjk_terjamin_contra_garansi k inner join pjk_penjaminan j on j.kode = k.kode_penjaminan "+
      "inner join pjk_sub_jenis_bisnis_xx sp on j.kode_sub_produk = sp.kode inner join x on x.kode = sp.kd_produk where substr(j.cs_tanggal_input::text,1,7) = '"+par+"'";
    pgClient.query(sql, (e, data)=>{
      if (e){
        rs.write(JSON.stringify({error: true, msg: 'Invalid parameter(s).'}));
      } else {
        rs.write(JSON.stringify({error: false, data: data.rows}));
      }
      rs.end();
    });  
  })
  .get('/v1/lr/:tgl1/:tgl2', function(rq, rs, next){
    rq.setTimeout(180000);
    let tgl1 = rq.params.tgl1,
        tgl2 = rq.params.tgl2;
    let sql = "select nomor, lvl, tipe, nama_rek, saldo_n from gen_lr('"+dbParams.CAB+"', '"+tgl1+"', '"+tgl2+"', 3);";
    pgClient.pg(function(p){
      if (p.error){
        rs.write(JSON.stringify(e));
        rs.end();
      } else {
        p.query(sql, (e, data)=>{
          if (e){
            rs.write(JSON.stringify({error: true, msg: 'Invalid parameter(s).'}));
          } else {
            // console.log(JSON.stringify(sql));
            rs.write(JSON.stringify({error: false, data: data.rows}));
          }
          rs.end();
        });
      }
    });  
  })
  .get('/v1/bs/:tgl1/:tgl2', function(rq, rs, next){
    rq.setTimeout(180000);
    let tgl1 = rq.params.tgl1,
        tgl2 = rq.params.tgl2;
    let sql = "select tingkat, nomor, vkode, nama_rek, saldo from gen_bs_aset('"+dbParams.CAB+"', '"+tgl1+"', '"+tgl2+"', 3) "+
      "union all "+
      "select tingkat, nomor, vkode, nama_rek, saldo from gen_bs_non_aset('"+dbParams.CAB+"', '"+tgl1+"', '"+tgl2+"', 3) ";
    pgClient.pg(function(p){
      if (p.error){
        rs.write(JSON.stringify(e));
        rs.end();
      } else {
        p.query(sql, (e, data)=>{
          if (e){
            rs.write(JSON.stringify({error: true, msg: 'Invalid parameter(s).'}));
          } else {
            // console.log(JSON.stringify(sql));
            rs.write(JSON.stringify({error: false, data: data.rows}));
          }
          rs.end();
        });
      }
    });   
  })
  .get('/v1/cf/:tgl1/:tgl2', function(rq, rs, next){
    rq.setTimeout(180000);
    let tgl1 = rq.params.tgl1,
        tgl2 = rq.params.tgl2;
    let sql = "select tingkat, kode, uraian, jumlah from gen_cf('"+dbParams.CAB+"', '"+tgl1+"', '"+tgl2+"', 'Y')";
    pgClient.pg(function(p){
      if (p.error){
        rs.write(JSON.stringify(e));
        rs.end();
      } else {
        p.query(sql, (e, data)=>{
          if (e){
            rs.write(JSON.stringify({error: true, msg: 'Invalid parameter(s).'}));
          } else {
            // console.log(JSON.stringify(sql));
            rs.write(JSON.stringify({error: false, data: data.rows}));
          }
          rs.end();
        });
      }
    });   
  })
  .get('/v1/saldo/kasbank/:tgl1/:tgl2', function(rq, rs, next){
    rq.setTimeout(180000);
    let tgl1 = rq.params.tgl1,
        tgl2 = rq.params.tgl2;
    let sql = "select \
      get_saldo_rek_ringkas_posisi('"+dbParams.CAB+"', get_option('"+dbParams.CAB+"defsetkas')||'01', '"+tgl1+"',  '"+tgl2+"', 'Y') kas_umum, \
      get_saldo_rek_ringkas_posisi('"+dbParams.CAB+"', get_option('"+dbParams.CAB+"defsetkas')||'02', '"+tgl1+"',  '"+tgl2+"', 'Y') kas_kecil, \
      get_saldo_rek_ringkas_posisi('"+dbParams.CAB+"', get_option('"+dbParams.CAB+"defsetbank'), '"+tgl1+"',  '"+tgl2+"', 'Y') bank \
    ";
    pgClient.pg(function(p){
      if (p.error){
        rs.write(JSON.stringify(e));
        rs.end();
      } else {
        p.query(sql, (e, data)=>{
          if (e){
            rs.write(JSON.stringify({error: true, msg: 'Invalid parameter(s).'}));
          } else {
            // console.log(JSON.stringify(sql));
            rs.write(JSON.stringify({error: false, data: data.rows[0]}));
          }
          rs.end();
        });
      }
    });   
  })
  // POST section:
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
      let fname = dbParams.mainFileStoragePath+'/'+params.fileName;
      let writer = fs.createWriteStream(fname);
      writer.on('open', function(f){
        writer.write(buffer, function(e){
          if (e){
            console.log(e);
            rs.end(JSON.stringify({error: true, msg: 'File upload failed'}));
          }
          else {
            let fileUri = 'http://'+dbParams.mainHost+'/v1/file/:fileName';
            let resObj = {error: false, result: {
              fileName: params.fileName,
              filePath: fname,
              fileUri: fileUri,
              size: buffer.length,
              msg: "File uploaded\nRetrieve this file by GET "+fileUri.replace(':fileName', params.fileName)
              }
            };
            // console.log(resObj);
            rs.end(JSON.stringify(resObj));
          }
        });
      });
    });
  })
  ;
  return router;
};