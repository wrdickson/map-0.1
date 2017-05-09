//userApp.js
define([
    'backbone',
    'common/dispatch',
    'tpl!apps/userApp/templates/userLoginModal.tpl',
    'jquery'
], function (
    Backbone,
    dispatch,
    userLoginModal
) {
    'use strict'
    
    //PRIVATE VARIABLES:
    var baseUrl;
    var userModel;
    
    var UserModel = Backbone.Model.extend({
        initialize: function(){
            this.on("change", function () {
                console.log("UserModel registers change");
                dispatch.trigger("userModel:change", this);
            });
            var baseUrl = dispatch.request("getBaseUrl");
        }
    });    

    var UserApp = {
        userModel: {},
        initialize: function () {
            var self = this;
            console.log("userApp initializes . . . ");
            self.baseUrl = dispatch.request("getBaseUrl");
            this.userModel = new UserModel();
            console.log("mUser:", mUser);
            this.userModel.set(mUser);
        },
        fireLoginModal: function() {
            var self = this;
            //clean out the dialog div
            $("#modal").html('');
            //get the template into html
            var html1 = userLoginModal();
            //load the region
            $("#modal").html(html1);
            //render the modal, firing the Bootstrap modal() ftn
            $("#userLoginModal").modal("show");
            //attach event
            $("#modal").on("shown.bs.modal", function () {
                $("#mLoginButton").unbind();
                $("#mLoginButton").on("click", function () {
                    self.login();
                });
            });            
        },
        login: function () {
            var self = this;
            var param = {};
            //scrape the inputs . . . 
            param.username = $("#mUserName").val();
            param.password = $("#mUserPwd").val();
            dispatch.trigger("app:spinOn");
            //send off the request . . . 
            $.ajax({
                url: self.baseUrl + "api/login/",
                type: "GET",
                data: param,
                dataType: "json",
                success: function (data) { 
                    dispatch.trigger("app:spinOff");
                    //TODO: handle a failed login, not just error as below . . . 
                    if(data.id > 0){
                        //login passes  ... continue .
                        //reload the model
                        self.userModel.set({
                            "mUserId": data.id,
                            "mUserKey": data.key,
                            "mUserName": data.username,
                            "mUserPerm": data.permission
                        });
                        //close the modal
                        $("#userLoginModal").modal('hide');
                        
                        $("#modal").on("hidden.bs.modal", function () {
                            $("#userLoginModal").remove();
                            $("#modal").html("");
                            var message = "Logged in as:<br/>" + data.username;
                            dispatch.trigger("app:popupMessage", message, "null");
                        });
                    } else { 
                        //login failed
                        //alert the modal
                        $("#mLoginAlert").html("Login Failed");
                        $("#mLoginAlert").slideDown("slow");
                    }
                },
                error: function (error) {
                    dispatch.trigger("app:spinOff");
                }
            }, this);                   
        },        
        logoff: function () {
            dispatch.trigger("app:spinOn");
            console.log("user at logoff: ", this.userModel.toJSON());
            var self = this;
            $.ajax({
                url: self.baseUrl + "api/logoff/",
                data: self.userModel.toJSON(),
                
                success: function(d) {
                    console.log("logoff response: ", d);
                    //remove user dropdown
                    self.setToGuest();
                },
                error: function() {
                    self.setToGuest();
                },
                complete: function () {
                    dispatch.trigger("app:spinOff");
                    var message = "Logged off.";
                    dispatch.trigger("app:popupMessage", message, null);                    
                },
                dataType: "json"
            });
        },        
        setMenuToLogin: function () {
            var self = this;
            $("#lmap-login").removeClass("hidden");
            $("#lmap-logoff").addClass("hidden");
            //if you don't do this, subsequent modal will fail
            $("#lmap-login").unbind();
            $("#lmap-login").on("click", function () {
                self.fireLoginModal();
            });
        },
        setToGuest: function () {
            this.userModel.set({
                "mUserId": 0,
                "mUserKey": 0,
                "mUserName": "Guest",
                "mUserPerm": 0
            });                        
        }
    }
    
    dispatch.setHandler("userApp:getUserModel", function() {
        return UserApp.userModel;
    });


    return UserApp;

});