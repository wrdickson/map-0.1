<div id = "lMapControl" class="btn-group" role="group" aria-label="...">
  <div class="btn-group" role="group">
    <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" title="Map functions">
      <span class="fa fa-map"></span>
      <span class="caret"></span>
    </button>
    <ul  class="dropdown-menu">
      <li><a id="loadTopo" href="">Topographic</a></li>
      <li><a id="loadOsm" href="">Open Street Map</a></li>
      <li><a id="loadSat" href="">Satellite</a></li>
      <li role="separator" class="divider"></li>
      <li><a id="myMaps" href="">My Maps</a></li>
    </ul>
  </div>
 
  <div class="btn-group" role="group">
    <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" title="Layer functions">
      <span class="fa fa-bars"></span>
      <span class="caret"></span>
    </button>
    <ul  id="layersSelect"  class="dropdown-menu" style="width: 275px">
    </ul>
  </div>

  <div class="btn-group" role="group">
    <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" title="Feature functions">
      <span class="fa fa-list"></span>
      <span class="caret"></span>
    </button>
    <ul id = "featuresSelect" class="dropdown-menu">
    </ul>
  </div>
  
  <div class="btn-group" role="group">
    <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" title="Feature functions">
      <span id="displayUsername"><%= mUserName %></span>
      <span class="fa fa-user"></span>
      <span class="caret"></span>
    </button>
    <ul id = "userSelect" class="dropdown-menu">
        <li style="background-color: #ddd"><a id="controlUsername" href="#"><b></b></a></li>
        <li><a id="lmap-login" href="">Login</a></li>
        <li><a id="lmap-logoff" href="">Logoff</a></li>
        <li><a class="hidden" id="lmap-logout" href="">Logout</a></li>
        <li id="lmap-registerLi"><a id="lmap-register" href="">Register</a></li>
        <li><div id="random">random</div></li>
    </ul>
  </div>  
</div>