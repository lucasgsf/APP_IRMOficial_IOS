angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  .state('menu', {
    url: '/side-menu',
    templateUrl: 'templates/menu.html',
    controller: 'menuCtrl'
  })

  .state('menu.inicio', {
    url: '/inicio',
    views: {
      'side-menu': {
        templateUrl: 'templates/inicio.html',
        controller: 'inicioCtrl'
      }
    }
  })

  .state('menu.post', {
    url: '/post',
    params: { id: null },
    views: {
      'side-menu': {
        templateUrl: 'templates/post.html',
        controller: 'postCtrl'
      }
    }
  })

  .state('menu.audiosAnteriores', {
    url: '/audiosAnteriores',
    views: {
      'side-menu': {
        templateUrl: 'templates/audiosAnteriores.html',
        controller: 'audiosAnterioresCtrl'
      }
    }
  })

  .state('menu.audiosSalvos', {
    url: '/audiosSalvos',
    views: {
      'side-menu': {
        templateUrl: 'templates/audiosSalvos.html',
        controller: 'audiosSalvosCtrl'
      }
    }
  })

  .state('menu.quemSomos', {
    url: '/quemSomos',
    views: {
      'side-menu': {
        templateUrl: 'templates/quemSomos.html',
        controller: 'quemSomosCtrl'
      }
    }
  })

  .state('menu.contato', {
    url: '/contato',
    views: {
      'side-menu': {
        templateUrl: 'templates/contato.html',
        controller: 'contatoCtrl'
      }
    }
  })

  .state('menu.agenda', {
    url: '/agenda',
    views: {
      'side-menu': {
        templateUrl: 'templates/agenda.html',
        controller: 'agendaCtrl'
      }
    }
  })

  .state('menu.documento', {
    url: '/documento',
    views: {
      'side-menu': {
        templateUrl: 'templates/documento.html',
        controller: 'documentoCtrl'
      }
    }
  })

  .state('menu.perfil', {
    url: '/perfil',
    views: {
      'side-menu': {
        templateUrl: 'templates/perfil.html',
        controller: 'perfilCtrl'
      }
    },
    resolve: {
      loadMyCtrl: ['$ocLazyLoad', function($ocLazyLoad) {
        return $ocLazyLoad.load('js/google-searchbox.js');
      }]
    }
  })

  .state('menu.cadastro', {
    url: '/cadastro',
    views: {
      'side-menu': {
        templateUrl: 'templates/cadastro.html',
        controller: 'cadastroCtrl'
      }
    },
    resolve: {
      loadMyCtrl: ['$ocLazyLoad', function($ocLazyLoad) {
        return $ocLazyLoad.load('js/google-searchbox.js');
      }]
    }
  })

  /*.state('cadastro', {
    url: '/cadastro',
    templateUrl: 'templates/cadastro.html',
    controller: 'cadastroCtrl',
    resolve: {
      loadMyCtrl: ['$ocLazyLoad', function($ocLazyLoad) {
        return $ocLazyLoad.load('js/google-searchbox.js');
      }]
    }
  })*/

  .state('recuperarSenha', {
    url: '/recuperarSenha',
    templateUrl: 'templates/recuperarSenha.html',
    controller: 'recuperarSenhaCtrl'
  })

  /*.state('login', {
    url: '/login',
    params: { email: null },
    templateUrl: 'templates/login.html',
    controller: 'loginCtrl'
  })*/

  .state('menu.login', {
    url: '/login',
    params: { email: null },
    views: {
      'side-menu': {
        templateUrl: 'templates/login.html',
        controller: 'loginCtrl'
      }
    }
  })

$urlRouterProvider.otherwise('/side-menu/inicio')

});