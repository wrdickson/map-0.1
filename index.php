<?php 
    session_start();
    define('BASE_URL', "http://map-0.1/");
?>
<!DOCTYPE html>
<html>
<head>
    <title>map-0.1</title>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    
    <!-- use absolute urls or it fails when routed -->
    <link rel="stylesheet" href="<?php echo BASE_URL;?>assets/css/application.css">
    <link rel="stylesheet" href="<?php echo BASE_URL;?>assets/js/vendor/bootstrap/dist/css/bootstrap.css">
    <link rel="stylesheet" href="<?php echo BASE_URL;?>assets/js/vendor/bootstrap/dist/css/bootstrap-theme.min.css"> 
    <link rel="stylesheet" href="<?php echo BASE_URL;?>assets/css/animate.css">
    <link rel="stylesheet" href="<?php echo BASE_URL?>assets/js/vendor/leaflet-0.7.7/leaflet.css">
    <!--
    <link rel="stylesheet" href="<?php echo BASE_URL?>assets/js/vendor/leaflet-1.0.3/leaflet.css">
    -->
    <link rel="stylesheet" href="<?php echo BASE_URL?>assets/js/vendor/leaflet-draw/leaflet.draw.css"> 
    <link rel="stylesheet" href="<?php echo BASE_URL?>assets/js/vendor/leaflet-vector-markers/leaflet-vector-markers.css">
    <link rel="stylesheet" href="<?php echo BASE_URL?>assets/css/font-awesome-4.7.0/css/font-awesome.min.css">  
    <link rel="stylesheet" href="<?php echo BASE_URL?>assets/js/jquery-ui-1.12.1.custom/jquery-ui.css">
    <link rel="stylesheet" href="<?php echo BASE_URL?>assets/js/jquery-ui-1.12.1.custom/jquery-ui.theme.css">
    <link rel="stylesheet" href="<?php echo BASE_URL?>assets/js/vendor/vakata-jstree-a6a0d0d/dist/themes/default/style.min.css">
    <link rel="stylesheet" href="<?php echo BASE_URL?>assets/js/vendor/vakata-jstree-a6a0d0d/dist/themes/default/style.min.css" />
    <link rel="stylesheet" href="<?php echo BASE_URL?>assets/js/vendor/jquery-minicolors/jquery.minicolors.css" />
    <?php
        //get session user data if available
        //this is to handle the situation where a user refreshes or manually enters a url
        if(isset($_SESSION['mUserId']) && isset($_SESSION['mUserKey']) && isset($_SESSION['mUserPerm'])){
            //TODO validate key with userid
        }else{
            $_SESSION['mUserId'] = 0;
            $_SESSION['mUserKey'] = 0;
            $_SESSION['mUsername'] = "Guest";
            $_SESSION['mUserPerm'] = 0;
        }
        $mUser = array();
        $mUser['mUserId'] = $_SESSION['mUserId'];
        $mUser['mUserKey'] = $_SESSION['mUserKey'];
        $mUser['mUserName'] = $_SESSION['mUsername'];
        $mUser['mUserPerm'] = $_SESSION['mUserPerm'];
        $userJson = json_encode($mUser);
        //send mtoUser (global!) to javascript
        echo"<script>var mUser = " . $userJson . ";</script>";
        echo"<script>var baseUrl = '" . BASE_URL . "';</script>";
    ?>  
</head>
<body>
    
    <div id="contentMain">
        <div id="map"></div>
    </div>
    <div id="spinnerWrapper">
        <div id="spinner">
        </div>
    </div>

    <div id="modal"></div>
    
    <div id="workspace"></div>
    <div id="myLayers"></div>
    <div id="styleEdit"></div>
    
    <div class='popupPanel'>
        <div id='pPanelText' class="alert alert-success" role="alert">Successfully longer message here</div>
    </div>

    <script data-main="/assets/js/require_main.js" src="/assets/js/vendor/require.js"></script>     

    <!--
    <script src="/build/compiled.js"></script>
    -->
</body
</html>