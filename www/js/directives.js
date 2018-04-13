angular.module('app.directives', [])

.directive('blankDirective', [function(){

}])

.directive("passwordVerify", function() {
   return {
      require: "ngModel",
      scope: {
        passwordVerify: '='
      },
      link: function(scope, element, attrs, ctrl) {
        scope.$watch(function() {
            var combined;

            if (scope.passwordVerify || ctrl.$viewValue) {
               combined = scope.passwordVerify + '_' + ctrl.$viewValue; 
            }                    
            return combined;
        }, function(value) {
            if (value) {
                ctrl.$parsers.unshift(function(viewValue) {
                    var origin = scope.passwordVerify;
                    if (origin !== viewValue) {
                        ctrl.$setValidity("passwordVerify", false);
                        return undefined;
                    } else {
                        ctrl.$setValidity("passwordVerify", true);
                        return viewValue;
                    }
                });
            }
        });
     }
   };
})

.factory('BusyService', ['$ionicLoading', function($ionicLoading) {
  var busy = null;

  return {

    show: function() {
      $ionicLoading.show({
        content: '<h1><i class="icon ion-reloading"></i></h1>',
        animation: 'fade-in',
        showBackdrop: true,
        maxWidth: 93,
        delay: 100
      });
    },

    showText: function(text) {
      $ionicLoading.show({
        template: text,
        animation: 'fade-in',
        showBackdrop: true,
        maxWidth: 100,
        delay: 100,
        duration: 3000
      });
    },

    hide: function() {
       $ionicLoading.hide({
        showDelay: 300
       });
    }

  };
}]);