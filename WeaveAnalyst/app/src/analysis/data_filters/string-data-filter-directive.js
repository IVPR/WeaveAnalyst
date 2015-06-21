AnalysisModule.directive('stringDataFilter', function(WeaveService) {
	
	function link($scope, element, attrs, ngModelCtrl) {
//		element.draggable({ containment: "parent" }).resizable({
//			 //maxHeight: 150,
//		     maxWidth: 250,
//		     minHeight: 100,
//		     minWidth: 180
//		});
		element.addClass('databox');
		element.width(180);
	}

	return {

		restrict : 'E',
		transclude : true,
		templateUrl : 'src/analysis/data_filters/string_data_filter.tpl.html',
		link : link,
		require : 'ngModel',
		scope : {
			columns : '=',
			ngModel : '='
		},
		controller : function($scope, $filter) {
			
			var filterName = $scope.$parent.filterName;
			
			var getFilterType = function (length) {
				if(length < 9)
					return "checklist";
				else
					return "combobox";
			};
			
			
			var pathToFilters = WeaveService.getPathToFilters();
			
			pathToFilters.push(filterName).request("StringDataFilter").addCallback(function() {
				var column = $scope.ngModel.column;
				
				if(column) {
					// if the column has metadata, just use the metadata
					if(column.metadata &&
					   column.metadata.aws_metadata && 
					   angular.fromJson(column.metadata.aws_metadata).varValues) {
						
						var varValues = angular.fromJson(column.metadata.aws_metadata).varValues;
						$scope.filterOptions = varValues || [];
						
					} 
					// otherwise use the column values
					else {
						var choices = this.getValue("StringDataFilterEditor.getChoices(column)") || [];
						if(this.getValue("linkableObjectIsBusy(this)"))
							return;
						
						$scope.filterOptions = choices.map(function(option){
							return { value : option, label : option };
						});
					}
					
					$scope.ngModel.selectedFilterStyle = getFilterType($scope.filterOptions.length);
					$scope.$apply();
				}
			});
			
			$scope.$watch('ngModel.selectedFilterStyle', function(selectedFilterStyle) {
				if(selectedFilterStyle == "checklist")
				{
					$scope.ngModel.comboboxModel = [];
				} else if(selectedFilterStyle == "combobox")
				{
					$scope.ngModel.checklistModel = {};
				}
			});
			
			$scope.$watch('ngModel.column', function(column) {
				$scope.filterOptions = '';
				if(column)
				{
					var pathToFilters = WeaveService.getPathToFilters();
					
					if(pathToFilters) {
						pathToFilters.push(filterName).request("StringDataFilter").push("column").setColumn(column.metadata, column.dataSourceName);
					}
				} else {
					$scope.ngModel.stringValues = [];
					$scope.ngModel.comboboxModel = [];
					$scope.ngModel.checklistModel = {};
				}
			});
			
			$scope.$watch('ngModel.checklistModel', function(checklistModel) {
				$scope.ngModel.stringValues = [];
				for(value in checklistModel) {
					if(checklistModel[value])
					{
						$scope.ngModel.stringValues.push(value);
					}
				}
			}, true);
			
			$scope.$watch('ngModel.comboboxModel', function(comboboxModel) {
				$scope.ngModel.stringValues = comboboxModel.map(function(obj) {
					return obj.value;
				});
			}, true);
			
			$scope.$watch("ngModel.stringValues", function () {
				var pathToFilters = WeaveService.getPathToFilters();
				if(pathToFilters)
					pathToFilters.push(filterName).request("StringDataFilter").push("stringValues").state($scope.ngModel.stringValues);
			}, true);
		}
	};
});