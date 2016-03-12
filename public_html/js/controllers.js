var app = angular.module('statelessApp', []).factory('TokenStorage', function () {
    var storageKey = 'auth_token';
    return {
        store: function (token) {
            return localStorage.setItem(storageKey, token);
        },
        retrieve: function () {
            return localStorage.getItem(storageKey);
        },
        clear: function () {
            return localStorage.removeItem(storageKey);
        }
    };
}).factory('TokenAuthInterceptor', function ($q, TokenStorage) {
    return {
        request: function (config) {
            var authToken = TokenStorage.retrieve();
            if (authToken) {
                config.headers['X-AUTH-TOKEN'] = authToken;
            }
            return config;
        },
        responseError: function (error) {
            if (error.status === 401 || error.status === 403) {
                TokenStorage.clear();
            }
            return $q.reject(error);
        }
    };
}).config(function ($httpProvider) {
    $httpProvider.interceptors.push('TokenAuthInterceptor');
    $httpProvider.defaults.withCredentials = true;
    $httpProvider.defaults.useXDomain = true;
});

app.controller('AuthCtrl', function ($scope, $http, TokenStorage) {
    $scope.authenticated = false;
    $scope.token;
    $scope.login = function () {
        $http.post("http://localhost:8081/cynosure_jwt_server/api/login",
                {username: $scope.username, password: $scope.password}, {
            headers: {
                'Content-Type': 'text/plain'
            }
        })
                .success(function (result, status, headers) {
                    $scope.authenticated = true;
                    alert(headers('X-AUTH-TOKEN'))
                    TokenStorage.store(headers('X-AUTH-TOKEN'));
                    // For display purposes only
                    $scope.token = JSON.parse(atob(TokenStorage.retrieve().split('.')[0]));
                    alert("login success")
                })
                .error(function (error) {
                    alert("login error: " + JSON.stringify(error))
                });
    };

    $scope.checkExpiry = function () {
        //now try to hit admin page
        $http.get('http://localhost:8081/cynosure_jwt_server/admin/home', {},
                {headers: {'Content-Type': 'text/plain'}})
                .success(function (data) {
                    alert("admin home " + data);
                }).error(function () {
            alert("some error in get")
        })
    }



    $scope.logout = function () {
        // Just clear the local storage
        TokenStorage.clear();
        $scope.authenticated = false;
    };
});