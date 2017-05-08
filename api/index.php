<?php
session_start();
require "lib/Slim/Slim.php";    
require "config/config.php";
require "phpClasses/class.dataconnecter.php";
require "phpClasses/class.person.php";
require "phpClasses/class.logger.php";

\Slim\Slim::registerAutoloader();

// create new Slim instance
$app = new \Slim\Slim();


//route the requests . . . 
$app->get('/users/:id', 'getUser');
$app->get('/users/', 'getAllUsers');
$app->get('/login/','login');
$app->get("/logoff/", "logoff");

$app->post('/users/', 'addUser');
$app->post('/users/:id', 'updateUser');

$app->get('/test/:id', 'getTest');
$app->put('/test/:id',  'updateTest');
$app->post('/test/', 'addTest');


function addTest() {
	$app = \Slim\Slim::getInstance();
	$params = json_decode($app->request->getBody(), true);
	$response['params'] = $params;
	foreach($params as $key=>$value){
		$response[$key] = $value;
	}	
	print json_encode($response);    
}

function getTest($id) {
    $response = array();
    $response['id'] = $id;
    $response['name'] = "Chuck";
    print(json_encode($response));
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
