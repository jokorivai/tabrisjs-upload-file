<?php
$postdata = file_get_contents("php://input");
$dir = 'filestorage';
$file_name = "file".rand() .".jpg"; 
if (!is_dir(__DIR__.'/'.$dir)){
  mkdir(__DIR__.'/'.$dir);
}
$fp = fopen(__DIR__.'/'.$dir .'/'.$file_name, "wb");
fwrite($fp, $postdata);
fclose($fp);
$response = array(
  'error'=>false,
  'result' => array(
    'fileName' => $file_name,
    'filePath' => __DIR__.'/'.$dir.'/'.$file_name,
    'fileUri'  => 'http://'.$_SERVER['SERVER_NAME'].'/'.$dir.'/'.$file_name,
    'size'     => filesize(__DIR__.'/'.$dir.'/'.$file_name),
    'msg'      =>'File uploaded\nRetrieve this file by GET http://'.$_SERVER['SERVER_NAME'].'/'.$dir.'/'.$file_name
  )
);

echo json_encode($response);
?>