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
        //used to prefix integer ids from db
        prefix: "wNode",
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
            //btnCreateMap
            $("#btnCreateMap").click( function () {
                var ref = $('#jstree_mymaps_div').jstree(true);
                //this will be the parent of the new node
                // make sure it's a directory
                var fullParent = ref.get_selected( 'full' );
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
                }
            });
            //btnCreateDirectory
            $("#btnCreateMapDirectory").click( function () {
                var ref = $('#jstree_mymaps_div').jstree(true);
                //this will be the parent of the new node
                // make sure it's a directory
                var fullParent = ref.get_selected( 'full' );
                if( fullParent[0].type == "directory") {
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
                console.log("ref.get_selected('full') @ delete:", ref.get_selected('full'));
                var fSel = ref.get_selected('full');
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
                // I don't want divs with an integer id, so add a prefix
                var prefix = "wNode";
                //generate a root node
                var rootObj = {
                    "id" : self.prefix + "0",
                    "text" : "maps",
                    "parent" : "#",
                    "type" : "directory"
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
                    //go to the database and save it
                    data.updateMapParent ( self.user, nodeObj ).done( function ( dData ) {
                        console.log("move - dData:", dData);
                    });
                })
                .on( 'select_node.jstree', function ( e, data) {
                    console.log("select_node fires", data );
                    
                })
                .on( 'create_node.jstree', function ( e, eData) {
                    console.log("create_node fires", data);
                    //strip out the id prefix . . .
                    var nId = eData.node.id.substring( prefix.length );
                    var nParent = eData.node.parent.substring( prefix.length );
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
                    var nId = eData.node.id.substring( prefix.length );
                    var nParent = eData.node.parent.substring( self.prefix.length );
                    var nodeObj = {
                        "id" : nId,
                        "parent" : nParent,
                        "text" : eData.node.text,
                        "type"  : eData.node.type
                    }
                    console.log("nodeObj:", nodeObj);
                    //go to the database and save it
                    data.updateMapName ( self.user, nodeObj ).done( function ( dData ) {
                        console.log("rename - dData:", dData);
                    });
                    
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
                            console.log("operation",operation);
                            //console.log("node", node);
                            //console.log("node_parent", node_parent);
                            //console.log("node_position", node_position);
                            //console.log("more", more);
                            if (node_parent.type == "directory" || node_parent.type == "#") {
                                    return true
                                } else {
                                    return false
                                }
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
                            "icon" : dispatch.request("getBaseUrl") + "assets/js/apps/workspace/img/layer16.png"
                        }
                    }
                });
                
            });
        }
    
    };
    return Workspace;
});