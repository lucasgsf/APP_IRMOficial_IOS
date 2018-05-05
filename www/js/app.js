// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('app', 
  ['ionic', 'ionic.native', 'oc.lazyLoad', 'app.controllers', 'app.routes', 'app.directives', 'app.services', 'angularSoundManager', 'ngCordova']
)

.config(function($ionicConfigProvider, $sceDelegateProvider,$httpProvider){
  $sceDelegateProvider.resourceUrlWhitelist([ 'self','*://www.youtube.com/**', '*://player.vimeo.com/video/**']);
})

.run(function($ionicPlatform,$cordovaDeeplinks,$window,$state,$timeout) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    var notificationOpenedCallback = function(jsonData) {
      console.log('notificationOpenedCallback: ' + JSON.stringify(jsonData));
    };

    window.plugins.OneSignal
      .startInit("7359d66e-8386-4f19-a426-083a6cff8081")
      .handleNotificationOpened(notificationOpenedCallback)
      .inFocusDisplaying(window.plugins.OneSignal.OSInFocusDisplayOption.Notification)
      .endInit();

    // Note: route's first argument can take any kind of object as its data,
    // and will send along the matching object if the route matches the deeplink
    $cordovaDeeplinks.route({
      '/pilula/:id': {
        target: 'menu.post',
        parent: 'menu.inicio'
      }
    }).subscribe(function(match) {
      // One of our routes matched, we will quickly navigate to our parent
      // view to give the user a natural back button flow
      $timeout(function() {
        $state.go(match.$route.parent, match.$args);

        // Finally, we will navigate to the deeplink page. Now the user has
        // the 'product' view visibile, and the back button goes back to the
        // 'products' view.
        $timeout(function() {
          $state.go(match.$route.target, match.$args);
        }, 800);
      }, 100); // Timeouts can be tweaked to customize the feel of the deeplink
    }, function(nomatch) {
      console.warn('No match', nomatch);
    });
  })
})

/*
  This directive is used to disable the "drag to open" functionality of the Side-Menu
  when you are dragging a Slider component.
*/
.directive('disableSideMenuDrag', ['$ionicSideMenuDelegate', '$rootScope', function($ionicSideMenuDelegate, $rootScope) {
    return {
        restrict: "A",  
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {

            function stopDrag(){
              $ionicSideMenuDelegate.canDragContent(false);
            }

            function allowDrag(){
              $ionicSideMenuDelegate.canDragContent(true);
            }

            $rootScope.$on('$ionicSlides.slideChangeEnd', allowDrag);
            $element.on('touchstart', stopDrag);
            $element.on('touchend', allowDrag);
            $element.on('mousedown', stopDrag);
            $element.on('mouseup', allowDrag);

        }]
    };
}])

/*
  This directive is used to open regular and dynamic href links inside of inappbrowser.
*/
.directive('hrefInappbrowser', function() {
  return {
    restrict: 'A',
    replace: false,
    transclude: false,
    link: function(scope, element, attrs) {
      var href = attrs['hrefInappbrowser'];

      attrs.$observe('hrefInappbrowser', function(val){
        href = val;
      });
      
      element.bind('click', function (event) {

        window.open(href, '_system', 'location=yes');

        event.preventDefault();
        event.stopPropagation();

      });
    }
  };
});