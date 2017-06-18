define([
    'backbone',
    'common/dispatch',
    'text!apps/layerApp/templates/myLayersTemplate.tpl',
    'apps/layerApp/data/data',
    'jstree'
], function(
    Backbone,
    dispatch,
    myLayersTemplate,
    lData
){
    'use strict';
    var MyLayersView = Backbone.View.extend({
        controlClose: function () {
            $("#myLayers").hide("slow", function () {
            });
        },
        controlMaximize: function () {
            $("#myLayersContent").slideDown("slow", function () {
            });
        },
        controlMinimize: function () {
            $("#myLayersContent").slideUp("slow", function () {
            });
        },
        createDirectory: function () {
            var self = this;
            var ref = $('#jstree-mylayers-div').jstree(true);
            //handle the case where nothing is selected
            if( ref.get_selected( 'full' ).length != 0 ) {
                // make sure it's a directory
                var fullParent = ref.get_selected( 'full' );
                if( fullParent[0].type == "directory" || fullParent[0].type =="root") {
                    var sel = ref.get_selected();
                    if(!sel.length) { return false; }
                    sel = sel[0];
                    console.log("sel",sel);
                    //first thing we need to do is go to db, create a new node, and get the id . . .
                    //strip the prefix from sel, which is the id of the parent node
                    var parentId = sel.substring( self.prefix.length );
                    lData.addLayer( self.user, parentId, "1" ).done( function ( dData ) {
                        console.log("back from db @ createDirecory", dData);
                        if(dData.db_response.execute_layer_add == true && dData.db_response.layer_insert_id > 0){
                            sel = ref.create_node(sel, {
                                "text": "New Node",
                                "type":"directory",
                                "parent": parentId,
                                "id": self.prefix + dData.db_response.layer_insert_id
                            });
                            if(sel) {
                                ref.edit(sel);
                            }
                            
                        } else {
                            //TODO - handle error
                        }
                    });
                } else {
                    dispatch.trigger("app:popupMessage", "Can't add to a file.", null);
                };
            }
        },
        createLayer: function () {
            console.log("firing");
            var self = this;
            var ref = $('#jstree-mylayers-div').jstree(true);
            //this will be the parent of the new node
            //handle the case where nothing is selected
            if( ref.get_selected( 'full' ).length != 0 ) {
                // make sure it's a directory
                var fullParent = ref.get_selected( 'full' );
                console.log("fullParent", fullParent);
                if( fullParent[0].type == "directory" || fullParent[0].type == "root") {
                    var sel = ref.get_selected();
                    if(!sel.length) { return false; }
                    sel = sel[0];
                    //first thing we need to do is go to db, create a new node, and get the id . . .
                    console.log("sel@createLayer()",sel);
                    var parentId = sel.substring(self.prefix);
                    lData.addLayer( self.user, parentId, "0" ).done( function ( dData ) {
                        if(dData.db_response.execute_layer_add == true && dData.db_response.layer_insert_id > 0){
                            sel = ref.create_node(sel, {
                                "text": "New Node",
                                "type":"layer",
                                //parent is 0, this will put the new layer into the root directory
                                "parent": "0",
                                "id": self.prefix + dData.db_response.layer_insert_id
                            });
                            if(sel) {
                                ref.edit(sel);
                            }
                            
                        } else {
                            //TODO - handle error
                        }
                    });
                } else {
                    //do nothing, you can't add a child to a file
                };
            };
        },
        events:{
            "click  #dClose"            :   "controlClose",
            "click  #dMax"              :   "controlMaximize",
            "click  #dMin"              :   "controlMinimize",
            "click  #btnCreateLayer"    :   "createLayer",
            "click  #btnCreateDirectory":   "createDirectory"
            
        },
        initialize: function ( user ){
            var self = this;
            self.user = user;
            console.log("user@ mlV init:", self.user);
            self.prefix = "mtoLayer";
            self.loadContent();
        },
        loadContent: function () {
            var self = this;
            //clear content


            //go to server for myLayersData
            lData.getMyLayers( self.user ).done( function ( mlData ) {
                //create the text/id/type/directory array of objects for jstree
                var jsTreeData = [];
                var iObj = {};
                var jObj = {};
                //generate a root node
                var rootObj = {
                    "id" : self.prefix + "0",
                    "text" : "layers",
                    "parent" : "#",
                    "type" : "root"
                };
                //and push it onto the array
                jsTreeData.push( rootObj );
                $.each(mlData.layers, function( i, v ) {
                    iObj.id = self.prefix + v.id;
                    iObj.text = v.name;
                    iObj.parent = self.prefix + v.parent;
                    if( v.directory == "1" ) {
                        iObj.type = "directory";
                    } else {
                        iObj.type = "layer";
                    };
                    jsTreeData.push( iObj );
                    // it was throwing errors without this . . . hmmmmmm
                    iObj = {};
                });
                console.log("jsTreeData", JSON.stringify(jsTreeData));
                //
                /*     IMPORTANT   IMPORTANT   IMPORTANT
                * NOTE: I had to go to application.css and add a z-index to the 
                * context menu so that it would display properly.
                */
                //instantiate the tree . . .
                $('#jstree-mylayers-div')
                //listen for the editing options . . .
                .on( 'set_id.jstree', function ( e, eData ) {
                    console.log("set_id.jstree fires", eData );
                })
                .on( 'move_node.jstree', function ( e,eData) {
                    console.log("move_node fires", eData);
                    //strip out the id prefix . . .
                    var nId = eData.node.id.substring( self.prefix.length );
                    var nParent = eData.node.parent.substring( self.prefix.length );
                    var nodeObj = {
                        "id" : nId,
                        "parent" : nParent
                    }
                    console.log("nodeObj:", nodeObj);
                    lData.updateLayerParent ( self.user, nodeObj ).done( function ( dData ) {
                        console.log("move - dData:", dData);
                    })
                })
                .on( 'select_node.jstree', function ( e, data) {
                    console.log("select_node fires", data );
                    
                })
                .on( 'create_node.jstree', function ( e, eData) {
                    console.log("create_node fires", eData);
                    //strip out the id prefix . . .
                    var nId = eData.node.id.substring( self.prefix.length );
                    var nParent = eData.node.parent.substring( self.prefix.length );
                    var nodeObj = {
                        //set id to 0, node doesn't yet exist on db
                        "id" : eData.node.id,
                        "parent" : nParent,
                        "text" : eData.node.text,
                        "type"  : eData.node.type
                    }
                    //don't do anything here, because jstree will call rename and we create there
                })
                .on( 'rename_node.jstree', function ( e, eData ) {
                    console.log("rename_node fires", eData);
                    //strip out the id prefix . . .
                    var nId = eData.node.id.substring( self.prefix.length );
                    var nParent = eData.node.parent.substring( self.prefix.length );
                    var nodeObj = {
                        "id" : nId,
                        "parent" : nParent,
                        "text" : eData.node.text,
                        "type"  : eData.node.type
                    }
                    console.log("nodeObj:", nodeObj);
                    //go to the database and save it
                    if( eData.node.type == "layer" || eData.node.type == "directory") {
                        console.log("layer name change");
                        lData.updateLayerName( self.user, nodeObj ).done( function ( dData ) {
                            
                        });
                    }
                })
                .on( 'delete_node.jstree', function ( e, data) {
                    console.log("delete_node fires", data);
                })
                .jstree({ 
                    'core' : {
                        'check_callback': function (operation, node, node_parent, node_position, more) {
                            // operation can be 'create_node', 'rename_node', 'delete_node', 'move_node', 'copy_node' or 'edit'
                            /*
                            * MOVE OPERATIONS
                            */
                            if(operation == "move_node"){
                                /*
                                * root
                                */
                                if(node.type == "root"){
                                    return false;
                                };
                                /*
                                * directory
                                */
                                if(node.type == "directory") {
                                    if (more.ref != undefined) {
                                        if(more.ref.type == "directory" || more.ref.type == "root" ) {
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    };
                                };
                                /*
                                * layer
                                */
                                if(node.type == "layer") {
                                    
                                    if (more.ref != undefined) {
                                        if(more.ref.type == "directory" || more.ref.type == "root") {
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    }
                                };
                            };
                            //delete directory
                            if(node.type == "directory" && operation == "delete_node"){
                                return true;
                            };
                            //create directory
                            if(node.type == "directory" && operation == "create_node") {
                                return true;
                            };
                            //edit directory
                            if(node.type == "directory" && operation == "edit"){
                                console.log("gotcha22");
                                return true;
                            };
                            //rename directory
                            if(node.type == "directory" && operation == "rename_node"){
                                return true;
                            };
                        } ,
                        'data' :  jsTreeData
                    },
                    'plugins': [
                        'dnd', 'types', 'sort', 'contextmenu'
                    ],
                    'types': {
                        "directory": {
                            "icon" : dispatch.request("getBaseUrl") + "assets/js/apps/workspace/img/directory16.png"
                        },
                        "file": {
                            "icon" : dispatch.request("getBaseUrl") + "assets/js/apps/workspace/img/map16.png"
                        },
                        "layer": {
                            "icon" : dispatch.request("getBaseUrl") + "assets/js/apps/workspace/img/layer16.png"
                        },
                        "root": {
                            "icon" : dispatch.request("getBaseUrl") + "assets/js/apps/workspace/img/directory16.png"
                        }
                    }
                });
            });
        },
        render: function() {
            var tData = {
                
            };
            // _.template() returns a function
            var renderFtn = _.template( myLayersTemplate );
            this.$el.html( renderFtn( tData ) );
            return this;
        }
    });
    return MyLayersView;
});