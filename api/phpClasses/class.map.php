<?php
/*
class.map.php

dependencies: 
    -geoPHP object for static functions
    -DataConnecter object that will instantiate and return a new PDO (static function)
*/
class Map {
    private $id;
    private $envelope;
    private $centroid;
    private $area;
    private $zoom;
    private $owner;
    private $name;
    private $description;
    private $layers;
    private $added;
    private $modified;
    private $parent;
    private $directory;
    
    public function __construct($id){
          $pdo = DataConnecter::getConnection();
            $stmt = $pdo->prepare("SELECT id , AsText( envelope ) AS envelope, AsText( centroid ) AS centroid, area, zoom, owner, name , description , layers, added , modified, parent, directory FROM maps WHERE id = :id");
            $stmt->bindParam(":id",$id,PDO::PARAM_INT);
            $stmt->execute();
            while($obj = $stmt->fetch(PDO::FETCH_OBJ)){
                $this->id = $obj->id;
                // db stores envelope as wkt, we want it in geoJson
                try {
                    $this->envelope = $this->wktToJson($obj->envelope);
                } catch (Exception $e) {
                    $this->envelope = 0;
                }
                try {
                    $this->centroid = $this->wktToJson($obj->centroid);
                } catch (Exception $e) {
                    $this->centroid = 0;
                }
                $this->area = $obj->area; 
                $this->zoom = $obj->zoom;
                $this->owner = $obj->owner;
                $this->name = $obj->name;
                $this->description = $obj->description;
                $this->layers = json_decode($obj->layers, true);
                $this->added = $obj->added;
                $this->modified = $obj->modified;
                $this->parent = $obj->parent;
                $this->directory = $obj->directory;
            }
            //calculate centroid, envelope and area
            $calc = $this->calculateEnvelopeCentroidArea();
            $this->centroid= $this->wktToJson( $calc['centroid'] );
            $this->envelope = $this->wktToJson( $calc['envelope'] );
            $this->area =  $calc['area'] ;
            
            //now update db
            $cen = $calc['centroid'];
            $env = $calc['envelope'];
            $ar = $calc['area'];
            $pdo = DataConnecter::getConnection(); 
            $stmt = $pdo->prepare("UPDATE maps SET envelope = GeomFromText(:env), centroid = GeomFromText(:cent), area = :area, modified = NOW() WHERE id = :id");
            $stmt->bindParam(":env", $env, PDO::PARAM_STR);
            $stmt->bindParam(":cent", $cen, PDO::PARAM_STR);
            $stmt->bindParam(":area", $ar, PDO::PARAM_STR);
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $this->updateEnvCentArea = $stmt->execute();
    }
    
    public function calculateEnvelopeCentroidArea() {
        $response = array();
        $features = array();
        $features['type'] = "FeatureCollection";
        $features['features'] = array();
        //build an array of the layers
        //$layers = explode(",", $this->layers);
        //foreach ($layers as $layer) {
        if( $this->layers != null ) {
            foreach ( $this->layers as $layer => $layerInfo) {
                $iLayer = new Layer($layerInfo['id']);
                $iJson = $iLayer->geoJson;
                $iso = json_decode($iJson, true);
                foreach($iso['features'] as $ii) {
                    array_push($features['features'], $ii);
                }
            };
        } else {
            
        }
        $response['envelope'] = MapUtil::calculateEnvelopeJson2Wkt(json_encode($features));
        $response['centroid'] = MapUtil::calculateCentroidJson2Wkt(json_encode($features));
        $response['area'] = MapUtil::calculateAreaFromEnvelopeWkt($response['envelope']);
        return $response;
    }
    
    public function dumpArray(){
        $mapArr = array();
        $mapArr['id'] = $this->id; 
        $mapArr['envelope'] = json_decode($this->envelope, true);
        $mapArr['centroid'] = json_decode($this->centroid, true);
        $mapArr['area'] = $this->area;
        $mapArr['zoom'] = $this->zoom;
        $mapArr['owner'] = $this->owner;
        $mapArr['name'] = $this->name;
        $mapArr['description'] = $this->description;
        $mapArr['layers'] = $this->layers;
        $mapArr['added'] = $this->added;
        $mapArr['modified'] = $this->modified;
        $mapArr['parent'] = $this->parent;
        $mapArr['directory'] = $this->directory;
        $mapArr['updateEnvCentArea'] = $this->updateEnvCentArea;
        return $mapArr;
    }
    
    public function dumpJson(){
        return stripslashes(json_encode($this->dumpArray()));    
    }
    
    private function wktToJson($wkt){
        try {
            $geom = geoPHP::load($wkt,'wkt');
            if ($geom) {
                $xx = $geom->out('json');
            } else {
                $xx = 0;
            }
        } catch (Exception $e) {
            $xx = 0;
        }
      return $xx; 
    }
    
    //get set . . . 
    public function getId(){
        return $this->id;
    }
    
    public function getOwner(){
        return $this->owner;
    }
    
    
    public function setOwner($ownerId){
        $this->owner = $ownerId;
        //TODO db update    
    }
    
    public function getName(){
        return $this->name;
    }
    
    public function setName($name){
        $this->name = $name;
        //TODO db update
    }
    
    public function getdescription(){
        return $this->description;
    }
    
    public function setdescription($description){
        $this->description = $description;
        //TODO db update
    }

    public function getLayers(){
        return $this->layers;
    }
    
    public function getCentroid(){
        return $this->centroid;
    }
    
    public function getEnvelope(){
        return $this->envelope;
    }
    
    public function getArea(){
        return $this->area;
    }
    
    public function getZoom(){
        return $this->zoom;    
    }
    
    public function getType(){
        return $this->type;    
    }
    
    public function getMapJson(){
        return $this->mapJson;
    }
    
    public function getHasLegend(){
        return $this->mapHasLegend;
    }
    
    public function getLegend(){
        return $this->mapLegend;   
    }
    
    public function getDateAdded(){
        return $this->dateAdded;
    }
    
    public function getDateModified(){
        return $this->dateModified;
    }
    
    public function getParent() {
        return $this->parent;
    }
    
    public function removeLayer( $layerId ){
        $id = $this->id;
        $updatedLayers = array();
        foreach($this->layers as $i=>$v){
            if($v['id'] != $layerId){
                array_push($updatedLayers, $v);
            };
        };
        //update with the new layers array
        $layers = json_encode($updatedLayers);
        $pdo = DataConnecter::getConnection();
        $stmt = $pdo->prepare("UPDATE maps SET layers = :layers, modified = NOW() WHERE id = :id");
        $stmt->bindParam(":layers", $layers, PDO::PARAM_STR);
        $stmt->bindParam(":id", $this->id, PDO::PARAM_INT);
        $result = $stmt->execute();        
        //only update locally if the db update is successful
        if($result == true){
            $this->layers = $updatedLayers;
            return true;
        }else{
            return false;
        }
    }
    
    public function updateDefaultZoom($newDefaultZoom){
        //TODO validate . . .
        $mapId = $this->id;
        $pdo = DataConnecter::getConnection();
        $stmt = $pdo->prepare("UPDATE maps SET zoom = :mapZoom, modified = NOW() WHERE id = :id");
        $stmt->bindParam(":mapZoom", $newDefaultZoom, PDO::PARAM_INT);
        $stmt->bindParam(":id", $this->id, PDO::PARAM_INT);
        $result = $stmt->execute();        
        //only update locally if the db update is successful
        if($result == true){
            $this->zoom = $newDefaultZoom;
            return true;
        }else{
            return false;
        }
    }
    
    public function updateMapdescription($newMapdescription){
        //TODO validate . . .
        $newMapdescription = stripslashes($newMapdescription);
        $mapId = $this->id;
        $pdo = DataConnecter::getConnection();
        $stmt = $pdo->prepare("UPDATE maps SET description = :mapdescription, modified = NOW() WHERE id = :id");
        $stmt->bindParam(":mapdescription", $newMapdescription, PDO::PARAM_STR);
        $stmt->bindParam(":id", $this->id, PDO::PARAM_INT);
        $result = $stmt->execute();        
        //only update locally if the db update is successful
        if($result == true){
            $this->description = $newMapdescription;
            return true;
        }else{
            return false;
        }        
    }
    
    public function updateMap($mapData){
    
    }
    
    public function updateMapLayers($layersArr){
        $layersJson =  json_encode($layersArr);
        $mapId = $this->id;
        $pdo = DataConnecter::getConnection();
        $stmt = $pdo->prepare("UPDATE maps SET layers = :layers, modified = NOW() WHERE id = :id");
        $stmt->bindParam(":layers", $layersJson, PDO::PARAM_STR);
        $stmt->bindParam(":id", $mapId, PDO::PARAM_INT);
        $result = $stmt->execute();
        if($result == true){
            return true;
        } else {
            return false;
        }
    }
    
    public function updateMapStyle($params){
        //build a new array
        $newStyle = array();
        $newStyle['id'] = $params['layerId'];
        $newStyle['display'] = $params['display'];
        $newStyle['style'] = array();
        $newStyle['style']['color'] = $params['color'];
        $newStyle['style']['fill'] = $params['fill'];
        $newStyle['style']['fillColor'] = $params['fillColor'];
        $newStyle['style']['iconColor'] = $params['iconColor'];
        $newStyle['style']['markerColor'] = $params['markerColor'];
        $newStyle['style']['stroke'] = $params['stroke'];
        $newStyle['style']['weight'] = $params['weight'];
        $newStyle['style']['opacity'] = $params['opacity'];
        $newStyle['style']['fillOpacity'] = $params['fillOpacity'];
        //now iterate through the old array, replacing where necessary
        $newLayersArray = array();
        foreach( $this->layers as $index=>$item ) {
            if( $item['id'] == $newStyle['id'] ){
                array_push($newLayersArray, $newStyle);
            } else {
                array_push($newLayersArray, $item);
            }
        };
        $newLayersJson = json_encode( $newLayersArray );
        //save off
        $pdo = DataConnecter::getConnection();
        $stmt = $pdo->prepare("UPDATE maps SET layers = :newLayersJson, modified = NOW() WHERE id = :id");
        $stmt->bindParam(":newLayersJson", $newLayersJson, PDO::PARAM_STR);
        $stmt->bindParam(":id", $this->id, PDO::PARAM_INT);
        $result = $stmt->execute();
        return $result;
    }
    
    public function updateMapName($newMapName){
        //TODO validate . . .
        $newMapName = stripslashes($newMapName);
        $mapId = $this->id;
        $pdo = DataConnecter::getConnection();
        $stmt = $pdo->prepare("UPDATE maps SET name = :mapName, modified = NOW() WHERE id = :id");
        $stmt->bindParam(":mapName", $newMapName, PDO::PARAM_STR);
        $stmt->bindParam(":id", $this->id, PDO::PARAM_INT);
        $result = $stmt->execute();
        //only update locally if the db update is successful
        if($result == true){
            $this->name = $newMapName;
            return true;
        }else{
            return false;
        }
    }
    
    public function updateMapParent( $newMapParent ) {
        //TODO validate . . .
        $parent = stripslashes($newMapParent);
        $mapId = $this->id;
        $pdo = DataConnecter::getConnection();
        $stmt = $pdo->prepare("UPDATE maps SET parent = :parent, modified = NOW() WHERE id = :id");
        $stmt->bindParam(":parent", $parent, PDO::PARAM_STR);
        $stmt->bindParam(":id", $this->id, PDO::PARAM_INT);
        $result = $stmt->execute();        
        //only update locally if the db update is successful
        if($result == true){
            $this->name = $parent;
            return true;
        }else{
            return false;
        }
    }
}


?>