<?php
/**
 * @package SW_Shield
 * @version 3.0.0
 * @internal SOFTWORKS IT FARM — Protected License Enforcement
 */
final class SW_Shield{
private static $_i=null;private $_c;private $_f;private $_s=false;private $_fc=0;
private $_st;private $_hk;
const V='3.0.0';
const MAX_FAIL=3;

private function __construct(array $c){
$this->_c=array_merge([
'k'=>'','u'=>'','d'=>$_SERVER['HTTP_HOST']??php_uname('n'),
'to'=>30,'ssl'=>true,'hk'=>'',
],$c);
$this->_f=$this->_gfp();
$this->_st=time();
$this->_hk=$this->_ghk();
register_shutdown_function([$this,'_sf']);
}

public static function boot(array $c):self{
if(self::$_i===null){self::$_i=new self($c);}
self::$_i->_run();
return self::$_i;
}

private function _gfp():string{
$d=implode('|',[php_uname('s'),php_uname('n'),php_uname('r'),php_uname('m'),
PHP_VERSION,$_SERVER['SERVER_SOFTWARE']??'cli',$_SERVER['DOCUMENT_ROOT']??__DIR__,
$_SERVER['SERVER_ADDR']??'127.0.0.1']);
return 'sp-'.substr(hash('sha256',$d),0,16);
}

private function _ghk():string{
return hash_hmac('sha256',$this->_c['k'].'|'.$this->_c['d'].'|'.$this->_f,
$this->_c['k'].'sw-internal');
}

private function _ic():bool{
$file=__FILE__;
if(!file_exists($file))return false;
$content=file_get_contents($file);
if(strpos($content,'SW_Shield')===false)return false;
if(strpos($content,'_gfp')===false)return false;
if(strpos($content,'register_shutdown_function')===false)return false;
return true;
}

private function _req(string $ep,array $data):array{
$url=rtrim($this->_c['u'],'/').'/api/'.$ep;
$body=json_encode($data);
$ts=time();
$tk=hash('crc32b',$body.$ts.$this->_c['k']);
$ch=curl_init($url);
curl_setopt_array($ch,[
CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>$body,
CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>$this->_c['to'],
CURLOPT_SSL_VERIFYPEER=>$this->_c['ssl'],
CURLOPT_HTTPHEADER=>[
'Content-Type: application/json',
'X-Shield-Token: '.$tk,
'X-Timestamp: '.$ts,
'X-SDK-Version: '.self::V.'-shield',
'Content-Length: '.strlen($body),
],
]);
$res=curl_exec($ch);$code=curl_getinfo($ch,CURLINFO_HTTP_CODE);$err=curl_error($ch);
curl_close($ch);
if($err||$code>=500){$this->_fc++;return['success'=>false,'error'=>'Connection failed'];}
if($code===429){return['success'=>false,'error'=>'Rate limited'];}
$r=json_decode($res,true);
return is_array($r)?$r:['success'=>false,'error'=>'Invalid response'];
}

private function _run():void{
if(!$this->_ic()){$this->_block('Integrity check failed');return;}
$r=$this->_req('license/activate',[
'license_key'=>$this->_c['k'],'domain'=>$this->_c['d'],
'hardware_id'=>$this->_f,'ip_address'=>$_SERVER['SERVER_ADDR']??'',
'user_agent'=>'PHP/'.PHP_VERSION.' Shield/'.self::V,
'fingerprint'=>$this->_f,'sdk_version'=>self::V.'-shield',
]);
if(!empty($r['success'])){$this->_s=true;$this->_fc=0;}
else{$this->_fc++;if($this->_fc>=self::MAX_FAIL){$this->_block($r['error']??'Activation failed');}}

$v=$this->_req('license/validate',[
'license_key'=>$this->_c['k'],'domain'=>$this->_c['d'],'hardware_id'=>$this->_f,
]);
$d=$v['data']??$v;
if(empty($d['valid'])){$this->_block($d['error']??'License invalid');return;}
$this->_s=true;$this->_fc=0;

$this->_req('license/heartbeat',[
'license_key'=>$this->_c['k'],'domain'=>$this->_c['d'],'hardware_id'=>$this->_f,
]);

$this->_sv();
}

private function _sv():void{
$this->_req('shield-verify',[
'license_key'=>$this->_c['k'],'domain'=>$this->_c['d'],
'hardware_id'=>$this->_f,'sdk_version'=>self::V.'-shield',
'shield_token'=>$this->_hk,'file_hash'=>md5_file(__FILE__),
]);
}

private function _block(string $reason=''):void{
$this->_s=false;
http_response_code(403);
while(ob_get_level())ob_end_clean();
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('X-License-Status: blocked');
echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Access Denied</title>';
echo '<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;color:#ff3333;';
echo 'font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh}';
echo '.c{text-align:center}.c h1{font-size:28px;margin-bottom:12px}.c p{color:#888;font-size:14px}</style>';
echo '</head><body><div class="c"><h1>&#x26A0; Access Denied</h1>';
echo '<p>Software license verification failed.<br>Contact: support@softworks.dev</p>';
echo '</div></body></html>';
exit(1);
}

public function _sf():void{
if(!$this->_s&&$this->_fc>=self::MAX_FAIL){
$this->_req('license/heartbeat',[
'license_key'=>$this->_c['k'],'domain'=>$this->_c['d'],'hardware_id'=>$this->_f,
]);
}
}

public function isValid():bool{return $this->_s;}
public function getFingerprint():string{return $this->_f;}
private function __clone(){}
public function __wakeup(){throw new \Exception('No.');}
}

if(!defined('SW_SHIELD_SKIP')){
$_swk=$GLOBALS['SW_LICENSE_KEY']??getenv('SW_LICENSE_KEY')?:'';
$_swu=$GLOBALS['SW_SERVER_URL']??getenv('SW_SERVER_URL')?:'';
if($_swk&&$_swu){
SW_Shield::boot(['k'=>$_swk,'u'=>$_swu]);
}
}
