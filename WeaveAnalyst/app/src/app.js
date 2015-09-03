'use strict';
//                                 
//                                 'ui.sortable',
//Using IIFEs
var tt; 
(function($stateProvider, $urlRouterProvider, $rootScope){

	angular.module('weaveAnalyst',['ui.router',
	                               'ui.grid',
	                               'ui.grid.treeView',
	                               'ui.grid.expandable',
	                               'ui.grid.pinning',
	                               'ui.grid.selection',
	                               'ui.layout',
	                               'ui.select',
	                               'ui.tree', 
	                               'mk.editablespan',
	                               'ngAnimate',
	                               'mgcrea.ngStrap',
	                               'ui.bootstrap',
	                               'angularSpinner',
	                               'ngSanitize',
	                               'weaveAnalyst.utils',
	                               'weaveAnalyst.configure',
	                               'weaveAnalyst.dataStatistics',
	                               'weaveAnalyst.queryObjectEditor', 
	                               'weaveAnalyst.project',
	                               'weaveAnalyst.errorLog',
	                               'weaveAnalyst.nested_qo',
	                               'weaveAnalyst.AnalysisModule',
	                               'weaveAnalyst.WeaveModule',
	                               'weaveAnalyst.run']);

	
	angular.module('weaveAnalyst.configure', ['weaveAnalyst.configure.auth',
	                                          'weaveAnalyst.configure.metadata',
	                                          'weaveAnalyst.configure.script']);
	
//	angular.module('weaveAnalyst').run(['$rootScope', function($rootScope){
//		$rootScope.$safeApply = function(fn, $scope) {
//				if($scope == undefined){
//					$scope = $rootScope;
//				}
//				fn = fn || function() {};
//				if ( !$scope.$$phase ) {
//	        	$scope.$apply( fn );
//	    	}
//	    	else {
//	        	fn();
//	    	}
//		};
//	}]);
	angular.module('weaveAnalyst').config(function($stateProvider, $urlRouterProvider) {
	
	//$parseProvider.unwrapPromises(true);
	
	$urlRouterProvider.otherwise('/index');
	
	$stateProvider
		.state('index', {
			url:'/projects',//projects is the entry point into the app
	    	templateUrl : 'src/project/projectManagementPanel.html',
	    	controller : 'ProjectManagementController',
	    	controllerAs : 'prjtCtrl',
	    	data: {
	    		activetab : 'project'
	    	}
		})
		.state('metadata', {
			url:'/metadata',
			templateUrl : 'src/configure/metadata/metadataManager.html',
			controller: 'MetadataManagerController',
			controllerAs : 'mDataCtrl',
			data : {
				activetab : 'metadata'
			}
		})
	    .state('script_management', {
	    	url:'/scripts',
	    	templateUrl : 'src/configure/script/scriptManager.html',
	    	//controller : 'ScriptManagerCtrl',
	    	data:{
	    		activetab : 'script_management'
	    	}
	    })
	    .state('analysis', {
	    	url:'/analysis',
	    	templateUrl : 'src/analysis/analysis.tpl.html',
	    	controller: 'AnalysisController',
	    	controllerAs : 'anaCtrl',
	    	data : {
	    		activetab : 'analysis'
	    	}
	    })
	    .state('project', {
	    	url:'/projects',
	    	templateUrl : 'src/project/projectManagementPanel.html',
	    	controller : 'ProjectManagementController',
	    	controllerAs : 'prjtCtrl',
	    	data: {
	    		activetab : 'project'
	    	}
	    })
	    .state('cross_tab',{
	    	url:'/cross_tab',
	    	templateUrl: 'src/analysis/crosstab/cross_tab.tpl.html',
	    	data :{
    			activetab : 'cross_tab'
    		}
	    })
	    .state('data_stats',{
	    	url:'/dataStatistics',
	    	templateUrl : 'src/dataStatistics/dataStatisticsMain.tpl.html',
    		controller : 'data_StatisticsController',
    		controllerAs : 'ds_Ctrl',
    		data :{
    			activetab : 'data_stats'
    		}
	    })
	    .state('data_stats.summary_stats',{
	    	url:'/summary_stats',
	    	templateUrl: 'src/dataStatistics/summary_stats.tpl.html',
	    	data :{
    			activetab : 'summary_stats'
    		}
	    })
	    .state('data_stats.correlations', {
	    	url:'/correlations',
	    	templateUrl : 'src/dataStatistics/correlation_matrices.tpl.html',
	    	data :{
    			activetab : 'correlations'
    		}
	    })
	    .state('data_stats.regression', {
	    	url:'/regression',
	    	templateUrl :'src/dataStatistics/regression_analysis.tpl.html',
	    	data:{
	    		activetab: 'regression'
	    	}
	    });
		
	    
});
	
	angular.module('weaveAnalyst').controller('weaveAnalystController',weaveAnalystController );
	
	weaveAnalystController.$inject = ['$state','authenticationService'];
	function weaveAnalystController ($state,authenticationService){//treating controllers as a constructor
		
		var wa_main = this;
		
		wa_main.state = $state;
		tt = wa_main;
		wa_main.authenticationService = authenticationService;
	};
	
	
	//using the value provider recipe 
	angular.module('weaveAnalyst').value("dataServiceURL", '/WeaveServices/DataService');
	angular.module('weaveAnalyst').value('adminServiceURL', '/WeaveServices/AdminService');
	angular.module('weaveAnalyst').value('projectManagementURL', '/WeaveAnalystServices/ProjectManagementServlet');
	angular.module('weaveAnalyst').value('scriptManagementURL', '/WeaveAnalystServices/ScriptManagementServlet');
	angular.module('weaveAnalyst').value('computationServiceURL', '/WeaveAnalystServices/ComputationalServlet');
	angular.module('weaveAnalyst').value('WeaveDataSource', 'WeaveDataSource');



})();//end of IIFE


