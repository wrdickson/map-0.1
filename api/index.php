<?php
session_start();
require "lib/Slim/Slim.php";    
require "config/config.php";
require "phpClasses/class.dataconnecter.php";
require "phpClasses/class.person.php";
require "phpClasses/class.logger.php";
require "phpClasses/class.map.php";
require "phpClasses/class.mapUtil.php";
require "phpClasses/geoPHP-master/geoPhp.inc";
require "phpClasses/class.layer.php";

\Slim\Slim::registerAutoloader();

// create new Slim instance
$app = new \Slim\Slim();


//route the requests . . . 
$app->get('/users/:id', 'getUser');
$app->get('/users/', 'getAllUsers');
$app->get('/users/:id/maps', 'getMyMaps');

$app->get('/layers/:id', 'getLayer');
$app->put('/layers/:id', 'updateLayer');
$app->post('/layers/add/:user', 'addLayer');
$app->put('/layers/update/name/:id', 'updateLayerName');
$app->get('/login/','login');
$app->get('/logoff/', 'logoff');

$app->get('/maps/:id', 'getMap');
$app->put('/maps/update/parent/:id', 'updateMapParent');
$app->put('/maps/update/name/:id', 'updateMapName');
$app->put('/maps/update/style/:mapId/:layerId', 'updateMapStyle');
$app->put('/maps/update/removeLayer/:mapId', 'removeLayerFromMap');
$app->post('/maps/add/:user', 'addMap');
$app->post('/maps/delete/:mapId', 'deleteMap');


$app->post('/users/', 'addUser');
$app->post('/users/:id', 'updateUser');
$app->post('/users/:id/maps', 'getMyMaps');

$app->get('/test/:id', 'getTest');
$app->put('/test/:id',  'updateTest');
$app->post('/test/', 'addTest');

function addLayer ($user) {
    $app = \Slim\Slim::getInstance();
    $params = json_decode($app->request->getBody(), true);
    $response['params'] = $params;
    foreach($params as $key=>$value){
        $response[$key] = $value;
    }
    $owner = $params['user']['mUserId'];
    $parent = $params['parent'];
    $directory = $params['directory'];
    $name = "temp_new_layer";
    $response['db_response'] = json_decode( MapUtil::insertLayer( $owner, $parent, $name, $directory) );
    print json_encode($response);
}

function addMap( $user ){
    $app = \Slim\Slim::getInstance();
    $params = json_decode($app->request->getBody(), true);
    $response['params'] = $params;
    foreach($params as $key=>$value){
        $response[$key] = $value;
    }
    $owner = $params['user']['mUserId'];
    $directory = $params['directory'];
    $parent = $params['parent'];
    $name = "temp_new_node";
    $response['db_response'] = json_decode( MapUtil::insertMap( $owner, $directory, $parent, $name) );
    print json_encode($response);
}

function addTest() {
    $app = \Slim\Slim::getInstance();
    $params = json_decode($app->request->getBody(), true);
    $response['params'] = $params;
    foreach($params as $key=>$value){
        $response[$key] = $value;
    }   
    print json_encode($response);
}

function deleteMap( $mapId ) {
    $response = array();
    $app = \Slim\Slim::getInstance();
    $params = json_decode($app->request->getBody(), true);
    $response['params'] = $params;
    //verify the user
    $iPerson = new Person( $params['user']['mUserId'] );
    $response['verify_key'] = $iPerson->verify_key( $params['user']['mUserKey']);
    $iMap = new Map( $params['nodes']['id'] );
    $response['rootMap'] = $iMap->dumpArray();
    if( $iMap->getOwner() == $params['user']['mUserId'] ) {
        $response['userOwnsMap'] = true;
    } else {
        $response['userOwnsMap'] = false;
    }
    if( $response['verify_key'] == true && $response['userOwnsMap'] == true ){
        //delete all children of this map
        $response['childrenDeleted'] = mapUtil::deleteMapChildren( $params['nodes']['id'] );
    } else {
        $response['childrenDeleted'] = false;
    }
    //then delete the node if it is owned by the user
    if( $response['verify_key'] == true && $response['userOwnsMap'] == true ){
        $response['rootDeleted'] = mapUtil::deleteMap( $params['nodes']['id'] );
    } else {
        $response['rootDeleted'] = false;
    }
    //include a new copy of the map
    print json_encode($response); 
}

function getLayer($id){
    //this has to come across as json so it will map to the Backbone model
    $response = array();
    //$response['layers'] = array();
    $iLayer = new Layer($id);
    $response['id'] = $id;
    $response['layerData'] = $iLayer->dumpArray();
    print json_encode($response);       
}

function getMap($id){
    //this has to come across as json so it will map to the Backbone model
    $response = array();
    $response['layersData'] = array();
    $iMap = new Map($id);    
    $response['mapData'] = $iMap->dumpArray();
    //get the layers

    foreach ( $iMap->getLayers() as $iLayerIndex => $iLayerInfo ) {
        $iLayer = new Layer($iLayerInfo['id']);
        //array_push($response['layers'], $iLayer->dumpArray());
        $response['layersData'][$iLayerIndex] = $iLayer->dumpArray(); 
    }
    print json_encode($response);   
}

function getMyMaps ($user) {
    
    $response = array();
    $app = \Slim\Slim::getInstance();
    $response['user'] = $user;
    $response['maps'] = MapUtil::getUserMaps( $user );
    
    
    print json_encode($response);
}

function getTest($id) {
    $response = array();
    $response['id'] = $id;
    $response['name'] = "Chuck";
    print(json_encode($response));
}

function removeLayerFromMap( $mapId ){
    $app = \Slim\Slim::getInstance();
    //this is the key . . .it's json string coming across
    $params = json_decode($app->request->getBody(), true);
    $response['mapId'] = $mapId;
    $response['params'] = $params;
    foreach($params as $key=>$value){
        $response[$key] = $value;
    }
    //TODO verify user . . .
    $iMap = new Map($mapId);
    $response['removeSuccess'] = $iMap->removeLayer($params['layerId']);
    print json_encode($response);
}

function updateLayer ($id) {
    $app = \Slim\Slim::getInstance();
    //this is the key . . .it's json string coming across
    $params = json_decode($app->request->getBody(), true);
    $response['$id'] = $id;
    $response['params'] = $params;
    foreach($params as $key=>$value){
        $response[$key] = $value;
    }
    //instantiate the layer
    $iLayer = new Layer($id);
    
    //verify that this user has permission to edit this layer
    if($iLayer->owner == $params['user']['mUserId']) {
        $userOwnsLayer = true;
    } else {
        $userOwnsLayer = false;
    };
    
    $response['userOwnsLayer'] = $userOwnsLayer;
    
    //verify user
    //TODO - fix this IMPORTANT!!!
    $userVerify = true;
    $response['userVerified'] = $userVerify;
    
    if($userVerify == true && $userOwnsLayer == true) {
        $response['origLayer'] = $iLayer->dumpArray();
        $iLayer->geoJson = $params['geoJson'];
        
        $response['newGeoJson'] = $params['geoJson'];
        $response['update'] = $iLayer->updateLayerJson(json_encode($iLayer->geoJson));
        
        //return the updated layer
        $updatedLayer = new Layer($id);
        $response['updatedLayer'] = $updatedLayer->dumpArray();
        
        print json_encode($response);        
    } else {
        $app->response->setStatus(403);
        print json_encode($response);
    }
}

function updateLayerName( $layerId ){
    $app = \Slim\Slim::getInstance();
    //this is the key . . .it's json string coming across
    $params = json_decode($app->request->getBody(), true);
    $response['$id'] = $layerId;
    $response['params'] = $params;
    foreach($params as $key=>$value){
        $response[$key] = $value;
    }
    //verify user's key
    
    
    //verify that map belongs to user
    
    //update
    $iLayer = new Layer( $layerId );
    $response['origLayerObj'] = $iLayer->dumpArray();
    $response['update'] = $iLayer->updateLayerName( $params['nodeData']['text'] );
    if( $response['update'] == true ) {
        $response['updatedLayerObj'] = $iLayer->dumpArray();
    } else {
        $response['updatedLayerObj'] = false;
    }

    print json_encode( $response );
}

function updateMapName( $id ) {
    $app = \Slim\Slim::getInstance();
    //this is the key . . .it's json string coming across
    $params = json_decode($app->request->getBody(), true);
    $response['$id'] = $id;
    $response['params'] = $params;
    foreach($params as $key=>$value){
        $response[$key] = $value;
    }
    //verify user's key
    
    
    //verify that map belongs to user
    $iMap = new Map( $id );
    $response['origMapObj'] = $iMap->dumpArray();
    //update the property
    $response['update'] = $iMap->updateMapName( $params['nodeData']['text'] );
    if( $response['update'] == true ) {
        $response['updatedMapObj'] = $iMap->dumpArray();        
    } else {
        $response['updatedMapObj'] = false;
    }

    print json_encode( $response );
}

function updateMapParent( $id ) {
    $app = \Slim\Slim::getInstance();
    //this is the key . . .it's json string coming across
    $params = json_decode($app->request->getBody(), true);
    $response['$id'] = $id;
    $response['params'] = $params;
    foreach($params as $key=>$value){
        $response[$key] = $value;
    }
    //verify user's key
    
    
    //verify that map belongs to user
    
    
    $iMap = new Map( $id );
    $response['origMapObj'] = $iMap->dumpArray();
    //update the property
    $response['update'] = $iMap->updateMapParent( $params['nodeData']['parent'] );
    if( $response['update'] == true ) {
        $response['updatedMapObj'] = $iMap->dumpArray();        
    } else {
        $response['updatedMapObj'] = false;
    }
    print json_encode( $response );
}

function updateMapStyle( $mapId, $layerId ) {
    $app = \Slim\Slim::getInstance();
    //this is the key . . .it's json object coming across
    $params = json_decode($app->request->getBody(), true);
    $response['params'] = $params;
    //verify user's key
    
    //verify that map belongs to user
    
    $iMap = new map($params['mapId']);
    $response['origMap'] = $iMap->dumpArray();
    $response['updateSuccess'] = $iMap->updateMapStyle( $params );
    //re instantiate and return the new map (and layers, too, why not?)
    $iMap = new map($params['mapId']);
    $response['mapData'] = $iMap->dumpArray();
    foreach ( $iMap->getLayers() as $iLayerIndex => $iLayerInfo ) {
        $iLayer = new Layer($iLayerInfo['id']);
        //array_push($response['layers'], $iLayer->dumpArray());
        $response['layersData'][$iLayerIndex] = $iLayer->dumpArray(); 
    }
    print json_encode( $response );
}

function updateTest() {
    $app = \Slim\Slim::getInstance();
    //this is the key . . .it's json object coming across
    $params = json_decode($app->request->getBody(), true);
    $response['newName'] = $params['name'];
    
    $response['params'] = $params;
    foreach($params as $key=>$value){
        $response[$key] = $value;
    }
    print json_encode($response);
    $app->response->setStatus(201);
}

function login(){ 
    $app = \Slim\Slim::getInstance();
    $username = $app->request->params('username');
    $pwd = $app->request->params('password');
    $result = Logger::check_login($username,$pwd);
    if($result['pass'] == 1){
        //this will persist user data if they refresh
        $_SESSION['mUserId'] = $result['id'];
        $_SESSION['mUserKey'] = $result['key'];
        $_SESSION['mUsername'] = $result['username'];
        $_SESSION['mUserPerm'] = $result['permission'];    
    }
    print json_encode($result);
}

function addUser() {
    $app = \Slim\Slim::getInstance();
    $params = $app->request->params();
    $response = array();
    $response['params'] = $params;
    $response['session'] = $_SESSION;
    if($_SESSION['miffUserPerm'] > 6) {
        //add user to db
        $response['success'] = logger::createUser($params['pwd'], $params['name'], $params['email'], $params['phone'], $params['perm']);
    }   
    print json_encode($response['success']);
}
function getAllUsers(){
    $response = logger::getAllUsers();
    print $response;
}

function getUser($id){
    $iPerson = new Person($id);
    print $iPerson->dumpJson();
}

function logoff(){
    $app = \Slim\Slim::getInstance();
    $id = $app->request->params('mUserId');
    $key = $app->request->params('mUserKey');
    $result = Logger::logoff($id, $key);
    //only reset if user logged off successfully with id and key,
    //otherwise, anyone could log anyone off through the api
    if($result['keychangesuccess'] == true){
        $_SESSION['mUserId'] = 0;
        $_SESSION['mUserKey'] = 0;
        $_SESSION['mUsername'] = "Guest";
        $_SESSION['mUserPerm'] = 0;     
    };
    print json_encode($result);
}

function updateUser($id){
    $app = \Slim\Slim::getInstance();
    $params = $app->request->params();
    //TODO validate
    $response = array();
    $response['params'] = $params;
    if($_SESSION['miffUserPerm'] > 6) {
        //check if there's a pwd param
        if(array_key_exists("pwd", $params)){
            $response['hasPwd'] = true;
            $response['success'] = logger::updateUserPassword($id, $params['pwd']);
            //update with password
        }else{
            $response['hasPwd'] = false;
            //update without password
            $success = logger::updateUser($params['id'], $params['username'], $params['email'], $params['phone'], $params['permission']);
            $response['success'] = $success;
        }
        
    }

    print json_encode($response['success']);
}

$app->run();
