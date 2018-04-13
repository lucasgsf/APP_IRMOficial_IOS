angular.module('app.controllers', [])
  
.controller('menuCtrl', ['$scope', '$state', '$stateParams', '$window', '$ionicSideMenuDelegate',
function ($scope, $state, $stateParams, $window, $ionicSideMenuDelegate) {
	$scope.getUsuarioLogado = function(){
		return ($window.localStorage["userData"] != undefined && $window.localStorage["userData"] != null);
	};

	$scope.sair = function(){
		$window.localStorage.clear();
		$ionicSideMenuDelegate.toggleLeft();
	};
}])

.controller('inicioCtrl', ['$scope', '$rootScope', '$state', '$sce', '$ionicPlatform', '$stateParams', '$window', '$timeout', '$ionicPopup', '$filter', 'PostService', 'ConteudoService', 'AcoesPostService', '$cordovaFile', '$cordovaSocialSharing', 'BusyService', 'UsuarioService',
function ($scope, $rootScope, $state, $sce, $ionicPlatform, $stateParams, $window, $timeout, $ionicPopup, $filter, PostService, ConteudoService, AcoesPostService, $cordovaFile, $cordovaSocialSharing, BusyService, UsuarioService) {
	$ionicPlatform.ready(function() {
		$scope.data = new Date();
		$scope.data.setHours(0,0,0,0);
		$scope.dataText = $scope.data.toLocaleDateString();
		$scope.lstConteudos = {};
		$scope.lstPostsFeed = {};
		$scope.usuario = ($window.localStorage["userData"] != undefined) ? JSON.parse($window.localStorage["userData"]) : undefined;
		$scope.playingId = 0;

		$scope.doRefresh = function(){
			$timeout(function() {
			  	loadPage();
		      	$scope.$broadcast('scroll.refreshComplete');
		    }, 1000);
		};

		$scope.setData = function(n){
			$scope.data.setDate($scope.data.getDate() + n);
			$scope.dataText = $scope.data.toLocaleDateString();
			$scope.doRefresh();
		};

		function loadPage(){
			BusyService.show();
			PostService.getFeedResume($scope.data.toLocaleString('en-US')).then(function(response){
				BusyService.hide();
				$scope.lstPostsFeed = response;
			});

			ConteudoService.getConteudo().then(function(response){
				$scope.lstConteudos = response;
				angular.forEach($scope.lstConteudos, function(value, key){
					if(value.DS_LINK != undefined && value.DS_LINK != null && value.DS_LINK != "") value.DS_LINK = $sce.trustAsResourceUrl(value.DS_LINK);
			    });
			});
		}

		$scope.compartilharConteudo = function(imagem){
			$scope.shareContent(null, null, "data:image/png;base64," + imagem, null);
		};

		$scope.shareContent = function(message, subject, url, link){
			$cordovaSocialSharing
		    .share(message, subject, url, link) // Share via native share sheet
		    .then(function(result) {
		      // Success!
		    }, function(err) {
		      // An error occured. Show a message to the user
		    });
		};

		$scope.curtirConteudo = function(item){
			var acoes = [];
			var acaoConteudo = {
				ID_USUARIO: $scope.usuario.ID_USUARIO,
				ID_CONTEUDO: item.ID_CONTEUDO,
				FL_CURTIR: true,
				DT_ACAO_CURTIR: new Date().toLocaleString('en-US')
			};
			if($window.localStorage["acoesConteudo"] != undefined){
				acoes = JSON.parse($window.localStorage["acoesConteudo"]);
				var reg = getByValueConteudo(acoes, item.ID_CONTEUDO);
				if(reg != undefined){
					if(!reg.FL_CURTIR)
						item.NR_CURTIDAS++;
					reg.FL_CURTIR = true;
					reg.DT_ACAO_CURTIR = new Date().toLocaleString('en-US');
					AcoesConteudoService.cadAcoesConteudo(reg).then(function(response){});
					$window.localStorage["acoesConteudo"] = JSON.stringify(acoes);
				}
				else{
					item.NR_CURTIDAS++;
					acoes.push(acaoConteudo);
					AcoesConteudoService.cadAcoesConteudo(acaoConteudo).then(function(response){});
					$window.localStorage["acoesConteudo"] = JSON.stringify(acoes);
				}
			}
			else{
				item.NR_CURTIDAS++;
				acoes.push(acaoConteudo);
				AcoesConteudoService.cadAcoesConteudo(acaoConteudo).then(function(response){});
				$window.localStorage["acoesConteudo"] = JSON.stringify(acoes);
			}
		};

		$scope.getCurtirConteudo = function(item){
			var acoes = [];
			if($window.localStorage["acoesConteudo"] != undefined){
				acoes = JSON.parse($window.localStorage["acoesConteudo"]);
				var reg = getByValueConteudo(acoes, item.ID_CONTEUDO);
				return (reg != undefined && (reg.curtir || reg.FL_CURTIR));
			}
			else{
				return false;
			}
		};

		function getByValueConteudo(arr, value) {
		  var result  = arr.filter(function(o){return o.ID_CONTEUDO == value;} );
		  return result? result[0] : null; // or undefined
		}

		$scope.goToAudio = function(item){
			$rootScope.post = item;
			$state.go('menu.post');
		}

		loadPage();

	    if($window.localStorage["ultimoLogin"] == undefined || $scope.data > JSON.parse($window.localStorage["ultimoLogin"])){
	    	$window.localStorage["ultimoLogin"] = JSON.stringify($scope.data);
	        if(angular.isDefined($scope.usuario) && $scope.usuario.ID_USUARIO){
	          UsuarioService.cadLoginUsuario($scope.usuario).then(function(response){});
	        }
	        else{
	          UsuarioService.cadLoginUsuario({}).then(function(response){});
	        }
	    }
	})
}])
   
.controller('audiosAnterioresCtrl', ['$scope', '$state', '$ionicPlatform', '$stateParams', '$window', '$timeout', '$ionicPopup', '$filter', 'PostService', 'AcoesPostService', 'angularPlayer', '$cordovaFile', '$cordovaSocialSharing', 'BusyService',
function ($scope, $state, $ionicPlatform, $stateParams, $window, $timeout, $ionicPopup, $filter, PostService, AcoesPostService, angularPlayer, $cordovaFile, $cordovaSocialSharing, BusyService) {
	$ionicPlatform.ready(function() {
		$scope.lstPostsFeed = {};
		$scope.playingId = 0;
		$scope.usuario = ($window.localStorage["userData"] != undefined) ? JSON.parse($window.localStorage["userData"]) : undefined;

		$scope.buscaPosts = function(dataBusca){
			$scope.lstPostsFeed = {};
			BusyService.show();
			var data = new Date(dataBusca);
			PostService.getFeedResume(data.toLocaleString('en-US')).then(function(response){
				BusyService.hide();
				$scope.lstPostsFeed = response;
				angular.forEach($scope.lstPostsFeed, function(value, key){
					PostService.getAudioPost(value.ID_POST).then(function(response){
			    		value.id = value.ID_POST;
			    		value.title = value.DS_TITULO;
			    		value.artist = value.DS_TIPO_POST + " - IRM Oficial";
			    		value.url = "data:audio/mp3;base64," + response;
					});
			    });
			});
		};

		$scope.playAudioPost = function(item){
			if(item.ID_POST != $scope.playingId){
				$scope.pause = false;
				$scope.playingId = item.ID_POST;
				$timeout(function() {
				   angularPlayer.clearPlaylist(function(response){
				   		// Playlist limpa
				   });
				   angularPlayer.addTrack(item);
				   angularPlayer.playTrack(item.ID_POST);
				}, 0);
				// Salva Estatística
				var acoes = [];
				var acaoPost = {
					ID_USUARIO: ($scope.usuario != undefined) ? $scope.usuario.ID_USUARIO : null,
					ID_POST: item.ID_POST,
					FL_PLAY: true,
					DT_ACAO_PLAY: new Date().toLocaleString('en-US')
				};
				if($window.localStorage["acoes"] != undefined){
					acoes = JSON.parse($window.localStorage["acoes"]);
					var reg = getByValue(acoes, item.ID_POST);
					if(reg != undefined){
						reg.FL_PLAY = true;
						reg.DT_ACAO_PLAY = new Date().toLocaleString('en-US');
						AcoesPostService.cadAcoesPost(reg).then(function(response){});
						$window.localStorage["acoes"] = JSON.stringify(acoes);
					}
					else{
						acoes.push(acaoPost);
						AcoesPostService.cadAcoesPost(acaoPost).then(function(response){});
						$window.localStorage["acoes"] = JSON.stringify(acoes);
					}
				}
				else{
					acoes.push(acaoPost);
					AcoesPostService.cadAcoesPost(acaoPost).then(function(response){});
					$window.localStorage["acoes"] = JSON.stringify(acoes);
				}
			}
			else{
				$timeout(function() {
					if(angularPlayer.isPlayingStatus()){
			        	angularPlayer.pause();
			        	$scope.pause = true;
					}
			        else{
			            angularPlayer.play();
			        	$scope.pause = false;
			        }
				}, 0);
			}
		};

		function b64toBlob(b64Data, contentType, sliceSize) {
	        contentType = contentType || '';
	        sliceSize = sliceSize || 512;

	        var byteCharacters = atob(b64Data);
	        var byteArrays = [];

	        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
	            var slice = byteCharacters.slice(offset, offset + sliceSize);

	            var byteNumbers = new Array(slice.length);
	            for (var i = 0; i < slice.length; i++) {
	                byteNumbers[i] = slice.charCodeAt(i);
	            }

	            var byteArray = new Uint8Array(byteNumbers);

	            byteArrays.push(byteArray);
	        }

	      var blob = new Blob(byteArrays, {type: contentType});
	      return blob;
		}

		function verificarPostSalvo(item){
			var posts = [];
			if($window.localStorage["posts"] != undefined){
				posts = JSON.parse($window.localStorage["posts"]);
				var reg = getByValue(posts, item.ID_POST);
				return ((reg == undefined) || !(reg.ID_POST) || !(reg.ID_POST != 0));
			}
			else{
				return true;
			}
		}

		function saveFile(dadosPost, folderPath, fileData, fileName) {
			var posts = [{}];
			posts.splice(0,1);

			$cordovaFile.writeFile(folderPath, fileName, b64toBlob(fileData), true)
		    .then(function (success) {
				if($window.localStorage["posts"] != undefined){
					posts = JSON.parse($window.localStorage["posts"]);
					var reg = getByValue(posts, dadosPost.ID_POST);
					posts.push(dadosPost);
				}
				else{
					posts.push(dadosPost);
				}
				$window.localStorage["posts"] = JSON.stringify(posts);
				BusyService.showText("Salvo!");
		    }, function (error) {
		        BusyService.showText("Não salvo!");
		    });
		}

		$scope.salvarAudioPost = function(item){
			$ionicPlatform.ready(function() {
				if(verificarPostSalvo(item)){
					var folderPath = cordova.file.externalRootDirectory + "IRMOficial/";
					var fileName =  item.ID_POST + "_" + item.DS_TITULO + ".mp3";
					var dadosPost = {
						ID_POST: item.ID_POST,
						DS_POST: item.DS_POST,
						ID_TIPO_POST: item.ID_TIPO_POST,
						DS_TIPO_POST: item.DS_TIPO_POST,
						DS_IDIOMA: item.DS_IDIOMA,
						PATH: folderPath,
						FILENAME: fileName
					};

				  	$cordovaFile.createDir(folderPath, "IRMOficial", false).then(function (success) {
				  		saveFile(dadosPost, folderPath, item.IM_AUDIO, fileName);
				    }, function (error) {
				    	saveFile(dadosPost, folderPath, item.IM_AUDIO, fileName);
				    });
				}
				else
					BusyService.showText("Este post já foi salvo!");
		  	});
		};

		function salvarCompartilhamento(item){
			// Salva Estatística
			var acoes = [];
			var acaoPost = {
				ID_USUARIO: ($scope.usuario != undefined) ? $scope.usuario.ID_USUARIO : null,
				ID_POST: item.ID_POST,
				FL_COMPARTILHAR: true,
				DT_ACAO_COMPARTILHAR: new Date().toLocaleString('en-US')
			};
			if($window.localStorage["acoes"] != undefined){
				acoes = JSON.parse($window.localStorage["acoes"]);
				var reg = getByValue(acoes, item.ID_POST);
				if(reg != undefined){
					reg.FL_COMPARTILHAR = true;
					reg.DT_ACAO_COMPARTILHAR = new Date().toLocaleString('en-US');
					AcoesPostService.cadAcoesPost(reg).then(function(response){});
					$window.localStorage["acoes"] = JSON.stringify(acoes);
				}
				else{
					item.NR_COMPARTILHAMENTOS++;
					acoes.push(acaoPost);
					AcoesPostService.cadAcoesPost(acaoPost).then(function(response){});
					$window.localStorage["acoes"] = JSON.stringify(acoes);
				}
			}
			else{
					item.NR_COMPARTILHAMENTOS++;
				acoes.push(acaoPost);
				AcoesPostService.cadAcoesPost(acaoPost).then(function(response){});
				$window.localStorage["acoes"] = JSON.stringify(acoes);
			}
		}

		$scope.compartilharPost = function(item){
		    var myPopup = $ionicPopup.show({
			    template: '<button class="button button-positive button-block" ng-click="shareAudio(' + item.ID_POST + ')">Áudio</button><br>' +
			    		  '<button class="button button-positive button-block" ng-click="shareImage(' + item.ID_POST + ')">Imagem</button><br>' +
			    		  '<button class="button button-positive button-block" ng-click="shareText(' + item.ID_POST + ')">Texto</button><br>',
			    title: 'Compartilhar',
			    scope: $scope,
			    buttons: [
			      { text: 'Fechar' },
			    ]
			  });
		};

		$scope.shareAudio = function(idPost){
			var item = $filter('filter')($scope.lstPostsFeed, { ID_POST: idPost }, true)[0];
			$scope.shareContent(null, null, item.url, null);
		};

		$scope.shareImage = function(idPost){
			var item = $filter('filter')($scope.lstPostsFeed, { ID_POST: idPost }, true)[0];
			$scope.shareContent(null, null, "data:image/png;base64," + item.IM_IMAGEM, null);
		};

		$scope.shareText = function(idPost){
			var item = $filter('filter')($scope.lstPostsFeed, { ID_POST: idPost }, true)[0];
			$scope.shareContent(item.DS_TITULO + "\n\n" + item.DS_POST, null, null, null);
		};

		$scope.shareContent = function(message, subject, url, link){
			$cordovaSocialSharing
		    .share(message, subject, url, link) // Share via native share sheet
		    .then(function(result) {
		      // Success!
		    }, function(err) {
		      // An error occured. Show a message to the user
		    });
		};

		$scope.curtirPost = function(item){
			var acoes = [];
			var acaoPost = {
				ID_USUARIO: ($scope.usuario != undefined) ? $scope.usuario.ID_USUARIO : null,
				ID_POST: item.ID_POST,
				FL_CURTIR: true,
				FL_NAO_CURTIR: false,
				DT_ACAO_CURTIR: new Date().toLocaleString('en-US')
			};
			if($window.localStorage["acoes"] != undefined){
				acoes = JSON.parse($window.localStorage["acoes"]);
				var reg = getByValue(acoes, item.ID_POST);
				if(reg != undefined){
					reg.FL_CURTIR = true;
					reg.DT_ACAO_CURTIR = new Date().toLocaleString('en-US');
					AcoesPostService.cadAcoesPost(reg).then(function(response){});
					$window.localStorage["acoes"] = JSON.stringify(acoes);
				}
				else{
					item.NR_CURTIDAS++;
					acoes.push(acaoPost);
					AcoesPostService.cadAcoesPost(acaoPost).then(function(response){});
					$window.localStorage["acoes"] = JSON.stringify(acoes);
				}
			}
			else{
				item.NR_CURTIDAS++;
				acoes.push(acaoPost);
				AcoesPostService.cadAcoesPost(acaoPost).then(function(response){});
				$window.localStorage["acoes"] = JSON.stringify(acoes);
			}
		};

		$scope.naoCurtirPost = function(item){
			var acoes = [];
			var acaoPost = {
				ID_USUARIO: ($scope.usuario != undefined) ? $scope.usuario.ID_USUARIO : null,
				ID_POST: item.ID_POST,
				FL_CURTIR: false,
				FL_NAO_CURTIR: true,
			};
			AcoesPostService.cadAcoesPost(acaoPost).then(function(response){
				
			});
			if($window.localStorage["acoes"] != undefined){
				acoes = JSON.parse($window.localStorage["acoes"]);
				var reg = getByValue(acoes, item.ID_POST);
				if(reg != undefined){
					reg.curtir = false;
					reg.naocurtir = true;
				}
				else{
					acoes.push({
						ID_POST: item.ID_POST,
						curtir: false,
						naocurtir: true
					});
				}
			}
			else{
				acoes.push({
					ID_POST: item.ID_POST,
					curtir: false,
					naocurtir: true
				});
			}
			$window.localStorage["acoes"] = JSON.stringify(acoes);
		}

		$scope.getSalvo = function(item){
			var posts = [];
			if($window.localStorage["posts"] != undefined){
				posts = JSON.parse($window.localStorage["posts"]);
				var reg = getByValue(posts, item.ID_POST);
				return (reg != undefined);
			}
			else{
				return false;
			}
		};

		$scope.getCurtirPost = function(item){
			var acoes = [];
			if($window.localStorage["acoes"] != undefined){
				acoes = JSON.parse($window.localStorage["acoes"]);
				var reg = getByValue(acoes, item.ID_POST);
				return (reg != undefined && reg.curtir);
			}
			else{
				return false;
			}
		};

		$scope.getCompartilharPost = function(item){
			var acoes = [];
			if($window.localStorage["acoes"] != undefined){
				acoes = JSON.parse($window.localStorage["acoes"]);
				var reg = getByValue(acoes, item.ID_POST);
				return (reg != undefined && reg.FL_COMPARTILHAR);
			}
			else{
				return false;
			}
		};

		$scope.getNaoCurtirPost = function(item){
			var acoes = [];
			if($window.localStorage["acoes"] != undefined){
				acoes = JSON.parse($window.localStorage["acoes"]);
				var reg = getByValue(acoes, item.ID_POST);
				return (reg != undefined && reg.naocurtir);
			}
			else{
				return false;
			}
		};

		function getByValue(arr, value) {
		  var result  = arr.filter(function(o){return o.ID_POST == value;} );
		  return result? result[0] : null; // or undefined
		}
	})
}])

.controller('postCtrl', ['$scope', '$rootScope', '$sce', '$ionicPlatform', '$stateParams', '$window', '$timeout', '$ionicPopup', '$filter', 'PostService', 'ConteudoService', 'AcoesPostService', 'angularPlayer', '$cordovaFile', '$cordovaSocialSharing', 'BusyService', 'UsuarioService', '$cordovaMedia',
function ($scope, $rootScope, $sce, $ionicPlatform, $stateParams, $window, $timeout, $ionicPopup, $filter, PostService, ConteudoService, AcoesPostService, angularPlayer, $cordovaFile, $cordovaSocialSharing, BusyService, UsuarioService, $cordovaMedia) {
	$ionicPlatform.ready(function() {
		$scope.data = new Date();
		$scope.data.setHours(0,0,0,0);
		$scope.post = undefined;
		$scope.media = undefined;
		$scope.dataText = $scope.data.toLocaleDateString();
		$scope.usuario = ($window.localStorage["userData"] != undefined) ? JSON.parse($window.localStorage["userData"]) : undefined;
		$scope.playing = false;

		$rootScope.$watch('post', function(newValue) {
		    $scope.post = newValue;
			$scope.media = $cordovaMedia.newMedia("http://irmoficial.azurewebsites.net/posts/" + $scope.post.ID_POST + "/audio.mp3");
		});

		$scope.playAudioPost = function(item){
			// Reproduz o áudio
			$scope.media.play();
			$scope.playing = true;

			// Salva Estatística
			var acoes = [];
			var acaoPost = {
				ID_USUARIO: ($scope.usuario != undefined) ? $scope.usuario.ID_USUARIO : null,
				ID_POST: item.ID_POST,
				FL_PLAY: true,
				DT_ACAO_PLAY: new Date().toLocaleString('en-US')
			};
			if($window.localStorage["acoes"] != undefined){
				acoes = JSON.parse($window.localStorage["acoes"]);
				var reg = getByValue(acoes, item.ID_POST);
				if(reg != undefined){
					reg.FL_PLAY = true;
					reg.DT_ACAO_PLAY = new Date().toLocaleString('en-US');
					AcoesPostService.cadAcoesPost(reg).then(function(response){});
					$window.localStorage["acoes"] = JSON.stringify(acoes);
				}
				else{
					acoes.push(acaoPost);
					AcoesPostService.cadAcoesPost(acaoPost).then(function(response){});
					$window.localStorage["acoes"] = JSON.stringify(acoes);
				}
			}
			else{
				acoes.push(acaoPost);
				AcoesPostService.cadAcoesPost(acaoPost).then(function(response){});
				$window.localStorage["acoes"] = JSON.stringify(acoes);
			}
		};

		$scope.pauseAudioPost = function(){
			$scope.media.pause();
			$scope.playing = false;
		};

		function salvarCompartilhamento(item){
			// Salva Estatística
			var acoes = [];
			var acaoPost = {
				ID_USUARIO: ($scope.usuario != undefined) ? $scope.usuario.ID_USUARIO : null,
				ID_POST: item.ID_POST,
				FL_COMPARTILHAR: true,
				DT_ACAO_COMPARTILHAR: new Date().toLocaleString('en-US')
			};
			if($window.localStorage["acoes"] != undefined){
				acoes = JSON.parse($window.localStorage["acoes"]);
				var reg = getByValue(acoes, item.ID_POST);
				if(reg != undefined){
					if(!reg.FL_COMPARTILHAR)
						item.NR_COMPARTILHAMENTOS++;
					reg.FL_COMPARTILHAR = true;
					reg.DT_ACAO_COMPARTILHAR = new Date().toLocaleString('en-US');
					AcoesPostService.cadAcoesPost(reg).then(function(response){});
					$window.localStorage["acoes"] = JSON.stringify(acoes);
				}
				else{
					item.NR_COMPARTILHAMENTOS++;
					acoes.push(acaoPost);
					AcoesPostService.cadAcoesPost(acaoPost).then(function(response){});
					$window.localStorage["acoes"] = JSON.stringify(acoes);
				}
			}
			else{
				item.NR_COMPARTILHAMENTOS++;
				acoes.push(acaoPost);
				AcoesPostService.cadAcoesPost(acaoPost).then(function(response){});
				$window.localStorage["acoes"] = JSON.stringify(acoes);
			}
		}

		$scope.compartilharPost = function(item){
		    var myPopup = $ionicPopup.show({
			    template: '<button class="button button-positive button-block" ng-click="shareAudio(' + item.ID_POST + ')">Áudio</button><br>' +
			    		  '<button class="button button-positive button-block" ng-click="shareImage(' + item.ID_POST + ')">Imagem</button><br>' +
			    		  '<button class="button button-positive button-block" ng-click="shareText(' + item.ID_POST + ')">Texto</button><br>',
			    title: 'Compartilhar',
			    scope: $scope,
			    buttons: [
			      { text: 'Fechar' },
			    ]
			  });
		};

		$scope.shareAudio = function(idPost){
			var link = "http://irmoficial.azurewebsites.net/posts/" + idPost + "/audio.mp3";
			$scope.shareContent(null, null, link, null);
			salvarCompartilhamento(item);
		};

		$scope.shareImage = function(idPost){
			var item = $filter('filter')($scope.lstPostsFeed, { ID_POST: idPost }, true)[0];
			$scope.shareContent(null, null, "data:image/png;base64," + item.IM_IMAGEM, null);
			salvarCompartilhamento(item);
		};

		$scope.shareText = function(idPost){
			var item = $filter('filter')($scope.lstPostsFeed, { ID_POST: idPost }, true)[0];
			$scope.shareContent(item.DS_TITULO + "\n\n" + item.DS_POST, null, null, null);
			salvarCompartilhamento(item);
		};

		$scope.shareContent = function(message, subject, url, link){
			$cordovaSocialSharing
		    .share(message, subject, url, link) // Share via native share sheet
		    .then(function(result) {
		      // Success!
		    }, function(err) {
		      // An error occured. Show a message to the user
		    });
		};

		$scope.curtirPost = function(item){
			var acoes = [];
			var acaoPost = {
				ID_USUARIO: ($scope.usuario != undefined) ? $scope.usuario.ID_USUARIO : null,
				ID_POST: item.ID_POST,
				FL_CURTIR: true,
				FL_NAO_CURTIR: false,
				DT_ACAO_CURTIR: new Date().toLocaleString('en-US')
			};
			if($window.localStorage["acoes"] != undefined){
				acoes = JSON.parse($window.localStorage["acoes"]);
				var reg = getByValue(acoes, item.ID_POST);
				if(reg != undefined){
					if(!reg.FL_CURTIR)
						item.NR_CURTIDAS++;
					reg.FL_CURTIR = true;
					reg.DT_ACAO_CURTIR = new Date().toLocaleString('en-US');
					AcoesPostService.cadAcoesPost(reg).then(function(response){});
					$window.localStorage["acoes"] = JSON.stringify(acoes);
				}
				else{
					item.NR_CURTIDAS++;
					acoes.push(acaoPost);
					AcoesPostService.cadAcoesPost(acaoPost).then(function(response){});
					$window.localStorage["acoes"] = JSON.stringify(acoes);
				}
			}
			else{
				item.NR_CURTIDAS++;
				acoes.push(acaoPost);
				AcoesPostService.cadAcoesPost(acaoPost).then(function(response){});
				$window.localStorage["acoes"] = JSON.stringify(acoes);
			}
		};

		$scope.getCompartilharPost = function(item){
			var acoes = [];
			if($window.localStorage["acoes"] != undefined){
				acoes = JSON.parse($window.localStorage["acoes"]);
				var reg = getByValue(acoes, item.ID_POST);
				return (reg != undefined && reg.FL_COMPARTILHAR);
			}
			else{
				return false;
			}
		};

		$scope.getCurtirPost = function(item){
			var acoes = [];
			if($window.localStorage["acoes"] != undefined){
				acoes = JSON.parse($window.localStorage["acoes"]);
				var reg = getByValue(acoes, item.ID_POST);
				return (reg != undefined && (reg.curtir || reg.FL_CURTIR));
			}
			else{
				return false;
			}
		};

		function getByValue(arr, value) {
		  var result  = arr.filter(function(o){return o.ID_POST == value;} );
		  return result? result[0] : null; // or undefined
		}
	})
}])

.controller('audiosSalvosCtrl', ['$scope', '$ionicPlatform', '$stateParams', '$window', '$timeout', 'angularPlayer', '$cordovaFile', 'BusyService',
function ($scope, $ionicPlatform, $stateParams, $window, $timeout, angularPlayer, $cordovaFile, BusyService) {
	$ionicPlatform.ready(function() {
		$scope.lstPostsFeed = {};
		$scope.playingId = 0;

		function getPostsSalvos(){
			BusyService.show();
			$scope.lstPostsFeed = [];
			if($window.localStorage["posts"] != undefined){
				$scope.lstPostsFeed = JSON.parse($window.localStorage["posts"]);
				angular.forEach($scope.lstPostsFeed, function(value, key){
			    	value.id = value.ID_POST;
			    	value.title = value.DS_TITULO;
			    	value.artist = value.DS_TIPO_POST + " - IRM Oficial";
			    	value.url = value.PATH + "/" + value.FILENAME;
			    });
				BusyService.hide();
			}
			else{
				BusyService.hide();
			}
		}

		$scope.playAudioPost = function(item){
			if(item.ID_POST != $scope.playingId){
				$scope.playingId = item.ID_POST;
				$timeout(function() {
				   angularPlayer.clearPlaylist(function(response){
				   	// Clear!
				   });
				   angularPlayer.addTrack(item);
				   angularPlayer.playTrack(item.ID_POST);
				}, 0);
			}
			else{
				$timeout(function() {
					if(angularPlayer.isPlayingStatus()){
			        	angularPlayer.pause();
			        	$scope.pause = true;
					}
			        else{
			            angularPlayer.play();
			        	$scope.pause = false;
			        }
				}, 0);
			}
		};

		$scope.excluirPost = function(item, index){
			var posts = [];
			if($window.localStorage["posts"] != undefined){
				posts = JSON.parse($window.localStorage["posts"]);
				if(posts.length == 1){
					$window.localStorage.removeItem("posts");
				}
				else{
					posts = posts.splice(index, 1);
					$window.localStorage["posts"] = JSON.stringify(posts);
				}
			}
			$scope.lstPostsFeed.splice(index, 1);
		};

		function getByValue(arr, value) {
		  var result  = arr.filter(function(o){return o.ID_POST == value;} );
		  return result? result[0] : null; // or undefined
		}

		getPostsSalvos();
	})
}])

.controller('documentoCtrl', ['$scope', '$sce', '$ionicPlatform', '$stateParams', '$window', '$timeout', '$ionicPopup', '$filter', 'DocumentoService', 'BusyService',
function ($scope, $sce, $ionicPlatform, $stateParams, $window, $timeout, $ionicPopup, $filter, DocumentoService, BusyService) {
	$ionicPlatform.ready(function() {
		$scope.data = new Date();
		$scope.data.setHours(0,0,0,0);
		$scope.lstDocumentos = {};
		$scope.usuario = JSON.parse($window.localStorage["userData"]);

		$scope.doRefresh = function(){
			$timeout(function() {
			  	loadPage();
		      	$scope.$broadcast('scroll.refreshComplete');
		    }, 1000);
		};

		function loadPage(){
			BusyService.show();
			DocumentoService.getDocumentoPorData($scope.data.toLocaleString('en-US')).then(function(response){
				BusyService.hide();
				$scope.lstDocumentos = response;
			});
		}

		$scope.enviarDocumento = function(item){
			DocumentoService.enviarDocumento(item.ID_DOCUMENTO, usuario.DS_EMAIL).then(function(response){
				BusyService.hide();
				$scope.lstDocumentos = response;
			});
		};

		loadPage();
	})
}])

.controller('quemSomosCtrl', ['$scope', '$stateParams',
function ($scope, $stateParams) {
}])
   
.controller('contatoCtrl', ['$scope', '$stateParams',
function ($scope, $stateParams) {
}])
   
.controller('agendaCtrl', ['$scope', '$stateParams',
function ($scope, $stateParams) {
}])
   
.controller('perfilCtrl', ['$scope', '$stateParams', '$state', '$window', 'UsuarioService', 'BusyService',
function ($scope, $stateParams, $state, $window, UsuarioService, BusyService) {
	$scope.altCidade = false;
	$scope.usuario = {};

	if($window.localStorage["userData"] != undefined){
		$scope.usuario = JSON.parse($window.localStorage["userData"]);
	}

	$scope.setAltCidade = function(value){
		$scope.altCidade = value;
	};

	$scope.salvar = function (data) {
		BusyService.show();
	  	var usuario = {};
	  	angular.copy(data, usuario);

	  	var endereco = usuario.DS_PAIS + " " + usuario.DS_ESTADO + " " + usuario.DS_CIDADE;
		var geocoder = new google.maps.Geocoder();
		geocoder.geocode( {address:endereco}, function(results, status) 
		{
		  if (status == google.maps.GeocoderStatus.OK) 
		  {
		  	var place = results[0];
		  	usuario.DS_CIDADE = extractFromAdress(place.address_components, "locality");
	        if (usuario.DS_CIDADE == "")
	            usuario.DS_CIDADE = extractFromAdress(place.address_components, "administrative_area_level_2");
	        usuario.DS_ESTADO = extractFromAdress(place.address_components, "administrative_area_level_1");
	        usuario.DS_PAIS = extractFromAdress(place.address_components, "country");
	        usuario.DS_PAIS_SIGLA = extractFromAdress(place.address_components, "country", true);
		    UsuarioService.altUsuario(usuario).then(function (response) {
		    	BusyService.hide();
			    if (response) {
			      BusyService.showText("Perfil salvo com sucesso!");
			    }
			    else
			      BusyService.showText("Erro!");
			});
		  } else {
		    // Erro
		    BusyService.hide();
		 }
		});
	};

	// Google Maps Search
    $scope.$on('gmPlacesAutocomplete::placeChanged', function () {
        var place = $scope.usuario.DS_ENDERECO.getPlace();
        $scope.usuario.DS_CIDADE = extractFromAdress(place.address_components, "locality");
        if ($scope.usuario.DS_CIDADE == "")
            $scope.usuario.DS_CIDADE = extractFromAdress(place.address_components, "administrative_area_level_2");
        $scope.usuario.DS_ESTADO = extractFromAdress(place.address_components, "administrative_area_level_1");
        $scope.usuario.DS_PAIS = extractFromAdress(place.address_components, "country");
        $scope.usuario.DS_PAIS_SIGLA = extractFromAdress(place.address_components, "country", true);
    });

    // Pesquisa de Lugar
    $scope.pesquisaLugar = function(){
    	var endereco = $scope.usuario.DS_PAIS + " " + $scope.usuario.DS_ESTADO + " " + $scope.usuario.DS_CIDADE;
    	var geocoder = new google.maps.Geocoder();
    	geocoder.geocode( {address:endereco}, function(results, status) 
		{
		  if (status == google.maps.GeocoderStatus.OK) 
		  {
		  	var place = results[0];
		  	$scope.usuario.DS_CIDADE = extractFromAdress(place.address_components, "locality");
	        if ($scope.usuario.DS_CIDADE == "")
	            $scope.usuario.DS_CIDADE = extractFromAdress(place.address_components, "administrative_area_level_2");
	        $scope.usuario.DS_ESTADO = extractFromAdress(place.address_components, "administrative_area_level_1");
	        $scope.usuario.DS_PAIS = extractFromAdress(place.address_components, "country");
	        $scope.usuario.DS_PAIS_SIGLA = extractFromAdress(place.address_components, "country", true);
		  } else {
		    // Erro
		 }
		});
    };

    function extractFromAdress(components, type, long) {
        for (var i = 0; i < components.length; i++)
            for (var j = 0; j < components[i].types.length; j++)
                if (components[i].types[j] == type) return (long) ? components[i].short_name : components[i].long_name;
        return "";
    }
}])

.controller('cadastroCtrl', ['$scope', '$stateParams', '$state', '$window', 'UsuarioService', 'BusyService',
function ($scope, $stateParams, $state, $window, UsuarioService, BusyService) {
	$scope.usuario = { ID_TIPO_USUARIO: 5, TB_ACOES_POST: null, TB_TIPO_USUARIO: null };

	$scope.cadastrar = function (data) {
		BusyService.show();
		var usuario = {};
	  	var hoje = new Date();
	  	angular.copy(data, usuario);

	 	var endereco = usuario.DS_PAIS + " " + usuario.DS_ESTADO + " " + usuario.DS_CIDADE;
		var geocoder = new google.maps.Geocoder();
		geocoder.geocode( {address:endereco}, function(results, status) 
		{
		  if (status == google.maps.GeocoderStatus.OK) 
		  {
		  	var place = results[0];
		  	usuario.DS_CIDADE = extractFromAdress(place.address_components, "locality");
	        if (usuario.DS_CIDADE == "")
	            usuario.DS_CIDADE = extractFromAdress(place.address_components, "administrative_area_level_2");
	        usuario.DS_ESTADO = extractFromAdress(place.address_components, "administrative_area_level_1");
	        usuario.DS_PAIS = extractFromAdress(place.address_components, "country");
	        usuario.DS_PAIS_SIGLA = extractFromAdress(place.address_components, "country", true);

	        usuario.DT_CADASTRO = hoje.toISOString();

		    UsuarioService.cadUsuario(usuario).then(function (response) {
		    	BusyService.hide();
		        if (response) {
			      $state.go("menu.login", { email:usuario.DS_EMAIL });
		          BusyService.showText("Cadastro efetuado com sucesso!");
		        }
		        else
		          BusyService.showText("Erro!");
		    });
		  } else {
		    // Erro
		    BusyService.hide();
		 }
		});
	};

	// Google Maps Search
    $scope.$on('gmPlacesAutocomplete::placeChanged', function () {
        var place = $scope.usuario.DS_ENDERECO.getPlace();
        $scope.usuario.DS_CIDADE = extractFromAdress(place.address_components, "locality");
        if ($scope.usuario.DS_CIDADE == "")
            $scope.usuario.DS_CIDADE = extractFromAdress(place.address_components, "administrative_area_level_2");
        $scope.usuario.DS_ESTADO = extractFromAdress(place.address_components, "administrative_area_level_1");
        $scope.usuario.DS_PAIS = extractFromAdress(place.address_components, "country");
        $scope.usuario.DS_PAIS_SIGLA = extractFromAdress(place.address_components, "country", true);
    });

    // Pesquisa de Lugar
    $scope.pesquisaLugar = function(){
    	
    };

    function extractFromAdress(components, type, short) {
        for (var i = 0; i < components.length; i++)
            for (var j = 0; j < components[i].types.length; j++)
                if (components[i].types[j] == type) return (short) ? components[i].short_name : components[i].long_name;
        return "";
    }
}])

.controller('recuperarSenhaCtrl', ['$scope', '$stateParams', '$state', '$window', 'UsuarioService', 'BusyService',
function ($scope, $stateParams, $state, $window, UsuarioService, BusyService) {
	$scope.usuario = {};

	$scope.recuperarSenha = function (data) {
	  var usuario = {};
	  angular.copy(data, usuario);
	  UsuarioService.recuperarSenha(usuario).then(function (response) {
	      if (response) {
	          BusyService.showText("Um código foi enviado para seu email.");
	      }
	      else
	          BusyService.showText("Erro!");
	  });
	};
}])
   
.controller('loginCtrl', ['$scope', '$stateParams', '$state', '$window', 'UsuarioService', 'BusyService',
function ($scope, $stateParams, $state, $window, UsuarioService, BusyService) {
	$scope.usuario = {};

	if($stateParams && $stateParams.email)
	{
		$scope.usuario.DS_EMAIL = $stateParams.email;
	}

	$scope.logar = function (data) {
	  var usuario = {};
	  angular.copy(data, usuario);
	  UsuarioService.loginUsuario(usuario).then(function (response) {
	      if (response) {
	          $window.localStorage["userData"] = JSON.stringify(response);
	          $state.go('menu.inicio');
	      }
	      else
	      	BusyService.showText("Email e/ou senha incorretos!");
	  });
	};
}])
 