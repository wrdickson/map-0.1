define ([
    'backbone',
    'common/dispatch',
    'text!apps/workspace/templates/myMapsWorkspace.tpl',
    'apps/workspace/data/data',
    'jstree'
], function (
    Backbone,
    dispatch,
    MyMapsWorkspace,
    data
) {
    var Workspace = {
        mapData: {},
        //used to prefix integer ids from db in trees on MAPS
        prefix: "wNode",
        //used to prefix integer ids from db in trees on LAYERS
        lPrefix: "layer",
        user: {},
        type: undefined,
        applyControlHandlers: function () {
            var self = this;
            //minimize
            $("#minWorkspace").click( function () {
                $("#workspaceControl").slideUp("slow", function () {
                });
            });
            //maximize
            $("#maxWorkspace").click( function () {
                $("#workspaceControl").slideDown("slow", function () {
                });
            });
            //close
            $("#closeWorkspace").click( function () {
                //remove events
                $("#workspace button").off();
                $("#workspace").hide("slow");
            });
            //btnCreateLayer
            $("#btnCreateLayer").click( function () {
                var ref = $('#jstree_mymaps_div').jstree(true);
                //this will be the parent of the new node
                //handle the case where nothing is selected
                if( ref.get_selected( 'full' ).length != 0 ) {
                    // make sure it's a directory
                    var fullParent = ref.get_selected( 'full' );
                    if( fullParent[0].type == "file") {
                        sel = ref.get_selected();
                        if(!sel.length) { return false; }
                        sel = sel[0];
                        //first thing we need to do is go to db, create a new node, and get the id . . .
                        //strip the prefix from sel, which is the id of the parent node
                        var parentId = sel.substring( self.prefix.length );
                        self.data.addLayer( self.user, parentId, "0" ).done( function ( dData ) {
                            if(dData.db_response.execute_layer_add == true && dData.db_response.layer_insert_id > 0){
                                sel = ref.create_node(sel, {
                                    "text": "New Node",
                                    "type":"layer",
                                    //parent is 0, this will put the new layer into the root directory
                                    "parent": "0",
                                    "id": self.lPrefix + dData.db_response.layer_insert_id
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
            });
            //btnCreateMap
            $("#btnCreateMap").click( function () {
                var ref = $('#jstree_mymaps_div').jstree(true);
                //this will be the parent of the new node
                // make sure it's a directory
                var fullParent = ref.get_selected( 'full' );
                //handle the case where nothing is selected
                if( ref.get_selected( 'full' ) != 0 ) {
                    if( fullParent[0].type == "directory") {
                        sel = ref.get_selected();
                        if(!sel.length) { return false; }
                        sel = sel[0];
                        //first thing we need to do is go to db, create a new node, and get the id . . .
                        //strip the prefix from sel, which is the id of the parent node
                        var parentId = sel.substring( self.prefix.length );
                        self.data.addMap( self.user, parentId, "0" ).done( function ( dData ) {
                            if(dData.db_response.execute_return == true && dData.db_response.insertId > 0){
                                sel = ref.create_node(sel, {
                                    "text": "New Node",
                                    "type":"file",
                                    "parent": parentId,
                                    "id": self.prefix + dData.db_response.insertId
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
            });
            //btnCreateDirectory
            $("#btnCreateMapDirectory").click( function () {
                var ref = $('#jstree_mymaps_div').jstree(true);
                //this will be the parent of the new node
                //handle the case where nothing is selected
                if( ref.get_selected( 'full' ).length != 0 ) {
                    // make sure it's a directory
                    var fullParent = ref.get_selected( 'full' );
                    if( fullParent[0].type == "directory" || fullParent[0].type =="root") {
                        sel = ref.get_selected();
                        if(!sel.length) { return false; }
                        sel = sel[0];
                        //first thing we need to do is go to db, create a new node, and get the id . . .
                        //strip the prefix from sel, which is the id of the parent node
                        var parentId = sel.substring( self.prefix.length );
                        self.data.addMap( self.user, parentId, "1" ).done( function ( dData ) {
                            if(dData.db_response.execute_return == true && dData.db_response.insertId > 0){
                                sel = ref.create_node(sel, {
                                    "text": "New Node",
                                    "type":"directory",
                                    "parent": parentId,
                                    "id": self.prefix + dData.db_response.insertId
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
            });
            //btnRenameMap
            $("#btnRenameMap").click( function () {
                var ref = $('#jstree_mymaps_div').jstree(true),
                    sel = ref.get_selected();
                if(!sel.length) { return false; }
                sel = sel[0];
                ref.edit(sel);          
            });
            //btnDeleteMap
            $("#btnDeleteMap").click( function () {
                var ref = $('#jstree_mymaps_div').jstree(true),
                    sel = ref.get_selected();
                if(!sel.length) { return false; }
                var fSel = ref.get_selected('full');
                //handle deleting a map or directory (map)
                if( fSel[0].type == "directory" || fSel[0].type == "file" ){
                    var fId = fSel[0].id.substring( self.prefix.length );
                    var params = {
                        "id" : fId,
                        "children" : []
                    };
                    //go through the children, strip out prefix
                    $.each( ref.get_selected('full')[0].children_d, function ( i,v ) {
                        params.children.push( v.substring( self.prefix.length ) );
                    });
                    console.log("params", params);
                    self.data.deleteNode( self.user, params ).done( function ( dbData ) {
                        console.log("back from deleteNode()", dbData ); 
                    });
                    ref.delete_node(sel); 
                };
                //handle removing a layer
                if( fSel[0].type == "layer" ){
                    console.log("layer selected for delete");
                    console.log("fSel[0]", fSel[0]);
                    var params = {};
                    params.layerId = fSel[0].id.substring(self.lPrefix.length);
                    params.mapId = fSel[0].parent.substring(self.prefix.length);
                    
                    self.data.removeLayerFromMap( self.user, params ).done(function(dData){
                        
                    });
                    ref.delete_node(sel);
                };
            });
        },
        initialize: function ( user, type, mapData ) {
            var self = this;
            console.log("workspace initializes");
            this.user = user;
            var userJson = self.user.toJSON();
            this.type = type;
            this.mapData = mapData;
            this.data = data;
            // _.template() returns a function
            var workspaceFtn = _.template( MyMapsWorkspace );
            var iHtml = workspaceFtn( {tData: userJson} );
            $("#workspace").html( iHtml );
            $("#workspace").show("slow", function () {
                $("#workspace").draggable();
                //TODO jquery-ui resizable doesn't work -
                //  the divs and classes get added, but the handles are not visible
            });
            self.applyControlHandlers();
            self.loadWorkspaceContent(); 
        },
        loadWorkspaceContent: function () {
            var self = this;
            //clear content
            $("#workspaceContent").empty().off().html("");
            //load up the content
            $("#workspaceContent").append('<div id="jstree_mymaps_div" style="font-family: Arial, Helvetica, sans-serif"></div>');
            //go to server for myMapsData
            this.data.getMyMapsData( this.user ).done( function ( mmData ) {
                //create the text/id/type/directory array of objects for jstree
                var jsTreeData = [];
                var iObj = {};
                var jObj = {};
                //generate a root node
                var rootObj = {
                    "id" : self.prefix + "0",
                    "text" : "maps",
                    "parent" : "#",
                    "type" : "root"
                };
                //and push it onto the array
                jsTreeData.push( rootObj );
                $.each(mmData.maps, function( i, v ) {
                    iObj.id = self.prefix + v.id;
                    iObj.text = v.name;
                    iObj.parent = self.prefix + v.parent;
                    if( v.directory == "1" ) {
                        iObj.type = "directory";
                    } else {
                        iObj.type = "file";
                    };
                    jsTreeData.push( iObj );
                    // i was throwing errors without this . . . hmmmmmm
                    iObj = {};
                    //now iterate through layersData
                    console.log('v @ iterate', v);
                    $.each(v.layersData, function ( ii, vv ){
                        console.log("vv @ iterate", vv);
                        jObj.id = "layer" + vv.id;
                        jObj.text = vv.name;
                        jObj.type = "layer";
                        jObj.parent = self.prefix + v.id;
                        jsTreeData.push( jObj );
                        jObj = {};
                    });
                });

                console.log("jsTreeData", JSON.stringify(jsTreeData));
                //
                /*     IMPORTANT   IMPORTANT   IMPORTANT
                * NOTE: I had to go to application.css and add a z-index to the 
                * context menu so that it would display properly.
                */
                //instantiate the tree . . .
                $('#jstree_mymaps_div')
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
                        "parent" : nParent,
                        "text" : eData.node.text,
                        "type"  : eData.node.type
                    }
                    console.log("nodeObj:", nodeObj);
                  
                    data.updateMapParent ( self.user, nodeObj ).done( function ( dData ) {
                        console.log("move - dData:", dData);
             
                    })
                })
                .on( 'select_node.jstree', function ( e, data) {
                    console.log("select_node fires", data );
                    
                })
                .on( 'create_node.jstree', function ( e, eData) {
                    console.log("create_node fires", data);
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
                    //depending on type . . 
                    if( eData.node.type == "file" || eData.node.type == "directory") {
                        data.updateMapName ( self.user, nodeObj ).done( function ( dData ) {
                            console.log("rename map (or directory) - dData:", dData);
                        });
                    }
                    if( eData.node.type == "layer") {
                        console.log("layer name change");
                        data.updateLayerName( self.user, nodeObj ).done( function ( dData ) {
                            
                        });
                    }
                })
                .on( 'delete_node.jstree', function ( e, data) {
                    console.log("delete_node fires", data);
                })
                .jstree({ 
        /*             "contextmenu":{         
                        "items": function($node) {
                            var tree = $("#tree").jstree(true);
                            return {
                                "Action1": {
                                    "separator_before": false,
                                    "separator_after": false,
                                    "label": "Action1",
                                    "action": function (obj) {
                                        console.log("Action1 fires");
                                    }
                                },
                                "Action2": {
                                    "separator_before": false,
                                    "separator_after": false,
                                    "label": "Action2",
                                    "action": function (obj) { 
                                        console.log("Action2 fires");
                                    }
                                },                         
                                "Action3": {
                                    "separator_before": false,
                                    "separator_after": false,
                                    "label": "Action3",
                                    "action": function (obj) { 
                                        console.log("Action3 fires");
                                    }
                                }
                            };
                        }
                    }, */
                    'core' : {
                        'check_callback': function (operation, node, node_parent, node_position, more) {
                            // operation can be 'create_node', 'rename_node', 'delete_node', 'move_node', 'copy_node' or 'edit'
                            // in case of 'rename_node' node_position is filled with the new node name
                            console.log("check_callback() fires");                  
                            //console.log("operation",operation);
                            //console.log("node", node);
                            //console.log("node_parent", node_parent);
                            //console.log("node", node);
                            //console.log("node_parent", node_parent);
                            //console.log("node_position", node_position);
                            //console.log("more", more);
                            
                            //nothing moves into the root directory but directories
                            /*
                            * MOVE OPERATIONG
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
                                * file (map)
                                */
                                if(node.type == "file") {
                                    if (more.ref != undefined) {
                                        if(more.ref.type != "directory") {
                                            return false;
                                        } else {
                                            return true;
                                        }
                                    }
                                };
                                /*
                                * layer
                                */
                                if(node.type == "layer") {
                                    return false;
                                };
                            };

                            //delete directory
                            if(node.type == "directory" && operation == "delete_node"){
                                return true;
                            };
                            //create directory
                            if(node.type == "directory" && operation == "create_node") {
                                console.log("gotcha");
                                return true;
                            };
                            //edit directory
                            if(node.type == "directory" && operation == "edit"){
                                console.log("gotcha22");
                                return true;
                            };
                            //rename directory
                            if(node.type == "directory" && operation == "rename_node"){
                                console.log("gotach23");
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
        }
    
    };
    return Workspace;
});