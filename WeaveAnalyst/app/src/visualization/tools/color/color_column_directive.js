/**
 * 
 */
AnalysisModule.directive('colorColumnSelector', ['WeaveService',  function factory(WeaveService){
	
	var directiveDefnObj= {
			restrict: 'E',
			templateUrl: 'src/visualization/tools/color/color_Column_new.html',
			controller : function($scope, WeaveService){

				$scope.colorGroup = {};
				
				$scope.setColorGroup = function(){
					
					if($scope.tool.color.group && $scope.tool.color.column){
						
						WeaveService.setColorGroup($scope.tool.toolName, $scope.tool.color.group, $scope.tool.color.column);
					}
				};
				
				$scope.getColorGroups = function(){
					if(WeaveService.checkWeaveReady()){
						$scope.colorGroups = WeaveService.getColorGroups();
					}
					else{
						setTimeout($scope.getColorGroups, 50, window);
					}
				};
				
				$scope.getColorGroups();
				
			},
			link: function(scope, elem, attrs){
				
								
			}//end of link function
	};
	
	return directiveDefnObj;
}]);