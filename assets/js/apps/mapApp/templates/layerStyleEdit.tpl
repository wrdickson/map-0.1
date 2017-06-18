<div id="styleEditTop">

    <button type="button" id="closeStyleEdit" class="pull-right btn btn-default btn-xs"><span class="fa fa-window-close"></span></button>
    <button type="button" id="maxStyleEdit" class="pull-right btn btn-default btn-xs"><span class= "fa fa-window-restore"></span></button>
    <button type="buton" id="minStyleEdit" class="pull-right btn btn-default btn-xs"><span class="fa fa-window-minimize"></span></button>
    <span style="font-size: 16px"><b>Style Editor</b></span><br/>
    <span style="font-size: 16px">Layer: <b><%= name %></b></span><br/>
    <span style="font-size: 14px">Id: <b><%= id %></b></span><br/>
</div><br/>
<div id="styleEditContent">

        <label for="layerColor">Color:</label>
        <input type="text" id="layerColor" class="controlCPicker form-control input-sm demo"  value="#0000ff">
        
        <label for="layerIconColor">Icon Color:</label>
        <input type="text" id="layerIconColor" class="controlCPicker form-control input-sm demo" value="#0000ff">
        
        <label for="layerOpoacity">Opacity:</label>
        <select id="layerOpacity" class="from-control input-sm">
            <option value=".1">0.1</option>
            <option value=".2">0.2</option>
            <option value=".3">0.3</option>
            <option value=".4">0.4</option>
            <option value=".5">0.5</option>
            <option value=".6">0.6</option>
            <option value=".7">0.7</option>
            <option value=".8">0.8</option>
            <option value=".9">0.9</option>
            <option value="1.0">1.0</option>
        </select><br/>
        
        <label for="layerFillOpoacity">Fill Opacity:</label>
        <select id="layerFillOpacity" class="from-control input-sm">
            <option value=".1">0.1</option>
            <option value=".2">0.2</option>
            <option value=".3">0.3</option>
            <option value=".4">0.4</option>
            <option value=".5">0.5</option>
            <option value=".6">0.6</option>
            <option value=".7">0.7</option>
            <option value=".8">0.8</option>
            <option value=".9">0.9</option>
            <option value="1.0">1.0</option>
        </select><br/>
        
        <label for="layerWeight">Weight:</label>
        <select id="layerWeight" class="from-control input-sm">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
            <option value="11">11</option>
            <option value="12">12</option>
            
        </select><br/>
        
        <label for="layerFill">Fill:</label>
        <select id="layerFill" class="form-control input-sm">
            <option value="true">true</option>
            <option value="false">false</option>
        </select>
        
        <label for="layerDisplay">Display:</label>
        <select id="layerDisplay" class="form-control input-sm">
            <option value="true">true</option>
            <option value="false">false</option>
        </select>
        
        <label for="layerStroke">Stroke:</label>
        <select id="layerStroke" class="form-control input-sm">
            <option value="true">true</option>
            <option value="false">false</option>
        </select>
        
        <div>
            <button id="layerEditSave" type="button" class="form-control pull-right btn btn-default">Save</button>
        </div>
        
        
        
    
    </div>

</div>