define ([
    'common/dispatch',
    'apps/pageLoader/p1/p1',

], function (
    dispatch,
    p1

) {
    var pageLoader = {
        initialize: function () {
            var self = this;
            console.log("pageLoader initializes");
        },
        loadPage: function (id) {
            console.log("loading page " + id + " . . .");
            //remove any views in main content
            dispatch.trigger("contentMainClear");
            switch (id) {
                case "p1":
                    var p1View = new p1();
                    $("#contentMain").html(p1View.render().el);
                
                break;
                case "p2":
                
                break;
                case "p3":
                
                break;
                
                
                
            }
        }
    }
    
    return pageLoader;


});