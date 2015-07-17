/**
 *this object serves as a wrapper for the API calls made when Weave is being used as a visualization engine 
 *@author spurushe
 */

if(!this.wa)
	this.wa = {};

(function(){
	function WeaveWrapper (){
		this.weave = document.getElementById('weave');
	}
	
	var p = WeaveWrapper.prototype;
	
	//////////////
	////VIZs
	//////////////
	p.request_BarChart = function(tool_config){
		if(this.check_WeaveReady()){
			var toolName = this.generate_UniqueName("BarChartTool");
			this.weave.path(toolName)
			.request('CompoundBarChartTool')
			.tool_config({  showAllLabels : tool_config.showAllLabels })
			.push('children', 'visualization', 'plotManager', 'plotters', 'plot')
			.push('sortColumn').setColumn(tool_config && tool_config.sort ? tool_config.sort.metadata : "", tool_config && tool_config.sort ? tool_config.sort.dataSourceName : "")
			.pop()
			.push('labelColumn').setColumn(tool_config && tool_config.label ? tool_config.label.metadata : "", tool_config && tool_config.label ? tool_config.label.dataSourceName : "")
			.pop()
			.push("heightColumns").setColumns(tool_config && tool_config.heights && tool_config.heights.length ? tool_config.heights.map(function(column) {
				return column.metadata;
			}) : {}, tool_config && tool_config.heights && tool_config.heights[0] ? tool_config.heights[0].dataSourceName : "")
			.pop()
			.push("positiveErrorColumns").setColumns(tool_config && tool_config.posErr ? tool_config.posErr.map(function(column) {
				return column.metadata;
			}) : {}, tool_config && tool_config.posErr && tool_config.posErr[0] ? tool_config.posErr[0].dataSourceName : "")
			.pop()
			.push("negativeErrorColumns").setColumns(tool_config && tool_config.negErr && tool_config.negErr.map(function(column) {
				return column.metadata;
			}), tool_config && tool_config.negErr && tool_config.negErr[0] ? tool_config.negErr[0].dataSourceName : "");
		}
		else{
			console.log("Weave and its api are not ready");
			return;
		}
		
	};
	
	
	p.request_ScatterPlot = function(tool_config){
		var toolName;
		if(this.check_WeaveReady()){
			
			toolName = this.generate_UniqueName("ScatterPlotTool");
			
			 this.weave.path(toolName).request('ScatterPlotTool')
			.push('children', 'visualization','plotManager', 'plotters', 'plot')
			.push('dataX').setColumn(tool_config.X.metadata, tool_config.X.dataSourceName)
			.pop()
			.push('dataY').setColumn(tool_config.Y.metadata, tool_config.Y.dataSourceName);
				
		}
		else{//if weave is not ready
			console.log("Weave and its api are not ready");
			return;
		}
		return toolName;
	};
	
	
	p.request_AdvancedDataTable = function(tool_config){
		var toolName;
		if (this.check_WeaveReady())
		{
			toolName = this.generate_UniqueName("DataTableTool");
			
			this.weave.path(toolName).request('AdvancedTableTool')
			.push("columns").setColumns(tool_config && tool_config.columns && tool_config.columns.length ? tool_config.columns.map(function(column) {
				return column.metadata;
			}) : {}, tool_config && tool_config.columns && tool_config.columns[0] ? tool_config.columns[0].dataSourceName : ""); 
			
			// empty columns
			if(tool_config.columns && !tool_config.columns.length)
				weave.path(toolName).request("AdvancedTableTool").push("columns").tool_config({});
		}
		else{//if weave is not ready
			console.log("Weave and its api are not ready");
			return;
		}
		return toolName;
	};
	
	
	p.request_Map = function(){
		
	};
	
	
	////////////////
	//TOOLS
	///////////////
	p.request_AttributeMenu = function(){
		var toolName;
		if(this.check_WeaveReady()){
			toolName = aToolName || ws.generateUniqueName("AttributeMenuTool");
			ws.weave.path(toolName).request('AttributeMenuTool').call(setQueryColumns, {choices: tool_config.columns});
				
				if(tool_config.vizAttribute && tool_config.selectedVizTool)
					ws.weave.path(toolName).request('AttributeMenuTool')
					.tool_config({targetAttribute : tool_config.vizAttribute.title , targetToolPath : [tool_config.selectedVizTool]});
			}
		else{
			console.log('Weave and its api are not ready yet');
		}
	};
	
	
	p.request_DataFilter = function(){
		
		if(this.check_WeaveReady()){
			
			this.weave.path(toolName).request('DataFilterTool');
			
			if(tool_config.filterStyle == "Discrete values") {
				this.weave.path(toolName, "editor", null).request("StringDataFilterEditor").tool_config({
					layoutMode : tool_config.layoutMode.value,
					showPlayButton : tool_config.showPlayButton,
					showToggle : tool_config.showToggle
				});
			} else if(tool_config.filterStyle == "Continuous range") {
				this.weave.path(toolName, "editor", null).request("NumberDataFilterEditor");
			}
			if(tool_config.column) {
				this.weave.path(toolName, "filter", null, "column").setColumn(tool_config.column.metadata, tool_config.column.dataSourceName);
			}
		}
		else{
			console.log("Weave and its api are not ready");
		}
	};
	
	
	p.request_SummaryAnnotation = function(){
		
	};
	
	///COLOR///////
	
	p.set_ColorGroup = function(toolName, plotName, groupName, column){
		var plotterPath = this.weave.path(toolName).pushPlotter(plotName);
		var plotType = plotterPath.getType();
		if (!plotName) plotName = "plot";
		var dynamicColumnPath;
		
		if (plotType == "weave.visualization.plotters::CompoundBarChartPlotter")
		{
			dynamicColumnPath = plotterPath.push("colorColumn", "internalDynamicColumn");
		}
		else
		{
			dynamicColumnPath = plotterPath.push("fill", "color", "internalDynamicColumn");
		}
		
		dynamicColumnPath.vars({name: groupName}).getValue("ColumnUtils.unlinkNestedColumns(this); globalName = name");
		this.weave.path(groupName).getValue("ColumnUtils.hack_findInternalDynamicColumn(this)").setColumn(column.metadata, column.dataSourceName);
	};
	
	p.get_ColorGroups = function(){
		return	this.weave.path().getValue('getNames(ColorColumn)');
	};
	
	/////////////
	//UTILITY
	////////////
	
	p.get_base64_SessionState = function(){
		
		return this.weave.path().getValue("\
		        var e = new 'mx.utils.Base64Encoder'();\
		        e.encodeBytes( Class('weave.Weave').createWeaveFileContent(true) );\
		        return e.drain();\
		    ");
	};
	
	p.set_base64_SessionState = function(){
		
		this.weave.path()
		.vars({encoded: base64encodedstring})
		.getValue("\
	        var d = new 'mx.utils.Base64Decoder'();\
			var decodedStuff = d.decode(encoded);\
			var decodeBytes =  d.toByteArray();\
	      Class('weave.Weave').loadWeaveFileContent(decodeBytes);\
	    ");
	};
	
	p.clear_SessionState = function(){
		this.weave.path().state(['WeaveDataSource']);
	};
	
	p.check_WeaveReady = function(){
		console.log("this",this);
		return this.weave && this.weave.WeavePath && this.weave._jsonCall;
	};
	
	p.generate_UniqueName = function(className, path) {
		if(!this.weave)
			return null;
		return this.weave.path(path || []).getValue('generateUniqueName')(className);
	};
	
	p.get_PathToFilters = function() {
		if(!this.checkWeaveReady())
			return;
		return this.weave.path("scriptKeyFilter").request("KeyFilter").push("filters");//references the Linkableashmap 'filters' in a keyFilter
	};
	
	p.tile_Windows = function() {
		if(!this.checkWeaveReady())
			return;
		this.weave.path()
		.libs("weave.ui.DraggablePanel")
		.exec("DraggablePanel.tileWindows()");
	};
	
	p.fetch_NodePath = function(){
		
	};
	
	p.get_listOfTools = function(){
		
	};
	
	p.remove_Object = function(object_name){
		this.weave.path(object_name).remove();
	};
	
	
	
	//attaching it to the global wa object
	wa.WeaveWrapper = WeaveWrapper;
})();