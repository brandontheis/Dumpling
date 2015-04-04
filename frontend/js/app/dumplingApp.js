var dumplingApp = angular.module('dumplingApp',['ngAnimate']);


dumplingApp.service('solrQueryService',function($http,$sce, $q){
	this.getSolrData = function (solrUrl, query){
		 var docs=[];
		 var defer = $q.defer();
		 $http(
		            {method: 'JSONP',
		             url: solrUrl,
		             params:{
		            	 	'q': 'docContent:'+query,
		            	    'json.wrf': 'JSON_CALLBACK',
		                    'wt':'json',
		                    'hl':true,
		                    'hl.fl':'*',
		                    'hl.simple.pre':'<div class="highlight">',
		                    'hl.simple.post':'</div>'
		                    }
		            })
		            .success(function(data) {
		            	docs= data.response.docs;
		              	for (var prop in  data.highlighting) {
		            	  	for (var doc in docs){
		            		  	if (docs[doc].TRECId==prop){
		            			  	docs[doc].highlighting=data.highlighting[prop].docContent[0];
		            		  	}
		            	  	}
		              	}
		              	for (var i in docs) {
		      				// Convert NULL title to "No Title"
		      				if (docs[i].title==null ||docs[i].title=="") {
		      					docs[i].title="No Title";
		      				}
		      			
		      				// Unescape highlights' HTML 
		      				try{
		      					docs[i].highlighting=$sce.trustAsHtml(docs[i].highlighting.trim());
		      				} catch (err){
		      				}
		      				
		      				docs[i].upVote=null;
		      				docs[i].downVote=null;
		      			}
		              	defer.resolve(docs);
		            }).error(function() {
		            	defer.reject('Can not get data from Solr');
		 });
		 return defer.promise;;
	}
});

// Search controller
dumplingApp.controller('searchBoxController', function($rootScope, $scope, $sce, solrQueryService) {
	$scope.clickSubmit=function(){
		$rootScope.$broadcast('sendQuery',{query:$scope.query});
		$rootScope.$broadcast('interactionEmit',{title:"New query sent", detail:"Query: "+$scope.query});
	};
});

// Dynamic result controller
dumplingApp.controller('dynamicController', function($scope, $rootScope, $sce, solrQueryService) {
	$scope.solrUrl='http://10.176.1.0:8983/solr/cmu/select';
	
	// Click doc content
	$scope.clickContent=function(doc){
		$rootScope.$broadcast('overlayDisplay',{part1:doc.title, part2:doc.docContent});
	};

	// Click up vote button
	$scope.clickUpVote=function(event, doc){
		$rootScope.$broadcast('upVote',doc);
		doc.upVote="checked";
		doc.downVote=null;
		event.stopPropagation();
	};
	
	// Click down vote button
	$scope.clickDownVote=function(event, doc){
		$rootScope.$broadcast('downVote',doc);
		doc.downVote="checked";
		doc.upVote=null;
		event.stopPropagation();
	};
	
	// Debug
	solrQueryService.getSolrData($scope.solrUrl,"aa").then(function (docs){
		$scope.docs = docs;
		$rootScope.stateHistory.push({query:"aa", transition:"no relevant doc;next topic,0.533"});
	});
	
	// When user send a new query.
	$scope.$on('sendQuery',function(event, args){
		solrQueryService.getSolrData($scope.solrUrl,args.query).then(function (docs){
			$scope.docs = docs;
			$rootScope.stateHistory.push({query:args.query, transition:"no relevant doc;next topic,0.533"});
		});
	});
});

// User state track controller
dumplingApp.controller('userStateController', function($scope, $rootScope) {
	$rootScope.stateHistory=[];
	
	// Scroll down to button
	$rootScope.$watch("stateHistory",function(){
		$('#userStateController').animate({scrollTop:$('#userStateController')[0].scrollHeight}, '600');
	},true);
});

// User interaction track controller
dumplingApp.controller('userInteractionController', function($scope, $rootScope) {
	$scope.interactionHistory=[];
	
	// Other controllers emit interactions, and this controller will catch them.
	$scope.$on('interactionEmit',function(event, args){
		$scope.interactionHistory.push(args);
		var h=$("#userInteractionList").children().first().height();
		$("#userInteractionList").css('margin-top',-h);
		$( "#userInteractionList" ).animate({"margin-top": "0px"}, 300);
	});
});

// Preference controller
dumplingApp.controller('preferenceController', function($scope, $rootScope) {
	$rootScope.preference = {};
	//$rootScope.preference.userStatePanelDisplay="checked";
	$scope.switchCheckbox=function(event,item){
		if ($rootScope.preference[item] == "checked") {
			$rootScope.preference[item] = null;
		} else {
			$rootScope.preference[item] = "checked";
		}
		event.stopPropagation();
	};
});

// Overlay controller
dumplingApp.controller('overlayController', function($scope, $rootScope) {
	$rootScope.$on('overlayDisplay',function(event, args){
		$scope.overlayContent=args;
		$(".jie-overlay").trigger('jie_overlay_show');
	});
});
