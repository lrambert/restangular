(function() {

var module = angular.module('restangular', []);

module.provider('Restangular', function() {
        // Configuration
        var Configurer = {};
        Configurer.init = function(object, config) {
            /**
             * Those are HTTP safe methods for which there is no need to pass any data with the request.
             */

            object.configuration = config;

            var safeMethods= ["get", "head", "options", "trace", "getlist"];
            config.isSafe = function(operation) {
              return -1 !== safeMethods.indexOf(operation.toLowerCase());
            };

            var absolutePattern = /^https?:\/\//i;
            config.isAbsoluteUrl = function(string) {
              return angular.isUndefined(config.absoluteUrl) || null === config.absoluteUrl ? 
                      string && absolutePattern.test(string) :
                      config.absoluteUrl;
            };
            
            config.absoluteUrl = angular.isUndefined(config.absoluteUrl) ? false : true;
            object.setSelfLinkAbsoluteUrl = function(value) {
                config.absoluteUrl = value;
            };
            /**
             * This is the BaseURL to be used with Restangular
             */
            config.baseUrl = angular.isUndefined(config.baseUrl) ? "" : config.baseUrl;
            object.setBaseUrl = function(newBaseUrl) {
                config.baseUrl = /\/$/.test(newBaseUrl)
                  ? newBaseUrl.substring(0, newBaseUrl.length-1)
                  : newBaseUrl;
                return this;
            };

            /**
             * Sets the extra fields to keep from the parents
             */
            config.extraFields = config.extraFields || [];
            object.setExtraFields = function(newExtraFields) {
              config.extraFields = newExtraFields;
              return this;
            };

            /**
             * Some default $http parameter to be used in EVERY call
            **/
            config.defaultHttpFields = config.defaultHttpFields || {};
            object.setDefaultHttpFields = function(values) {
              config.defaultHttpFields = values;
              return this;
            };

            config.withHttpValues = function(httpLocalConfig, obj) {
              return angular.extend({}, config.defaultHttpFields, httpLocalConfig, obj || {});
            };

            config.encodeIds = angular.isUndefined(config.encodeIds) ? true : config.encodeIds;
            object.setEncodeIds = function(encode) {
                config.encodeIds = encode;
            };

            config.defaultRequestParams = config.defaultRequestParams || {
                get: {},
                post: {},
                put: {},
                remove: {},
                common: {}
            };

            object.setDefaultRequestParams = function(param1, param2) {
              var methods = [],
                  params = param2 || param1;
              if (!angular.isUndefined(param2)) {
                if (angular.isArray(param1)) {
                  methods = param1;
                } else {
                  methods.push(param1);
                }
              } else {
                methods.push('common');
              }

              angular.forEach(methods, function (method) {
                config.defaultRequestParams[method] = params;
              });
              return this;
            };

            object.requestParams = config.defaultRequestParams;


            config.defaultHeaders = config.defaultHeaders || {};
            object.setDefaultHeaders = function(headers) {
              config.defaultHeaders = headers;
              object.defaultHeaders = config.defaultHeaders;
              return this;
            };

            object.defaultHeaders = config.defaultHeaders;

            /**
             * Method overriders will set which methods are sent via POST with an X-HTTP-Method-Override
             **/
            config.methodOverriders = config.methodOverriders || [];
            object.setMethodOverriders = function(values) {
              var overriders = angular.extend([], values);
              if (config.isOverridenMethod('delete', overriders)) {
                overriders.push("remove");
              }
              config.methodOverriders = overriders;
              return this;
            };

            config.isOverridenMethod = function(method, values) {
              var search = values || config.methodOverriders;
              for (var i=0,len=search.length; i<len; i++) {
                if (search[i].toLowerCase() === method.toLowerCase()) {
                  return true;
                }
              }
              return false;
            };

            /**
             * Sets the URL creator type. For now, only Path is created. In the future we'll have queryParams
            **/
            config.urlCreator = config.urlCreator || "path";
            object.setUrlCreator = function(name) {
              if (!config.urlCreatorFactory || !config.urlCreatorFactor.hasOwnProperty(name)) {
                  throw new Error("URL Path selected isn't valid");
              }

              config.urlCreator = name;
              return this;
            };

            /**
             * You can set the restangular fields here. The 3 required fields for Restangular are:
             *
             * id: Id of the element
             * route: name of the route of this element
             * parentResource: the reference to the parent resource
             *
             *  All of this fields except for id, are handled (and created) by Restangular. By default,
             *  the field values will be id, route and parentResource respectively
             */
            config.restangularFields = config.restangularFields || {
                id: "id",
                route: "route",
                parentResource: "parentResource",
                restangularCollection: "restangularCollection",
                cannonicalId: "__cannonicalId",
                etag: "restangularEtag",
                selfLink: "href",
                get: "get",
                getList: "getList",
                put: "put",
                post: "post",
                remove: "remove",
                head: "head",
                trace: "trace",
                options: "options",
                patch: "patch",
                getRestangularUrl: "getRestangularUrl",
                getRequestedUrl: "getRequestedUrl",
                putElement: "putElement",
                addRestangularMethod: "addRestangularMethod",
                getParentList: "getParentList",
                clone: "clone",
                ids: "ids",
                httpConfig: '_$httpConfig',
                reqParams: 'reqParams',
                one: 'one',
                all: 'all',
                several: 'several',
                oneUrl: 'oneUrl',
                allUrl: 'allUrl',
                customPUT: 'customPUT',
                customPOST: 'customPOST',
                customDELETE: 'customDELETE',
                customGET: 'customGET',
                doPUT: 'doPUT',
                doPOST: 'doPOST',
                doDELETE: 'doDELETE',
                doGET: 'doGET'
                
            };
            object.setRestangularFields = function(resFields) {
                config.restangularFields =
                  angular.extend(config.restangularFields, resFields);
                return this;
            };

            config.isRestangularized = function(obj) {
              return !!obj[config.restangularFields.one] || !!obj[config.restangularFields.all];
            };

            config.setFieldToElem = function(field, elem, value) {
              var properties = field.split('.');
              var lastProperty = properties.pop();
              var idValue = elem;
              angular.forEach(properties, function(prop) {
                idValue[prop] = {};
                idValue = idValue[prop];
              });
              idValue[lastProperty] = value;
              return this;
            };

            config.getFieldFromElem = function(field, elem) {
              var properties = field.split('.');
              var idValue = angular.copy(elem);
              angular.forEach(properties, function(prop) {
                if (idValue) {
                  idValue = idValue[prop];
                }
              });
              return idValue;
            };

            config.setIdToElem = function(elem, id) {
              config.setFieldToElem(config.restangularFields.id, elem, id);
              return this;
            };

            config.getIdFromElem = function(elem) {
              return config.getFieldFromElem(config.restangularFields.id, elem);
            };

            config.isValidId = function(elemId) {
                return "" !== elemId && !angular.isUndefined(elemId) && null !== elemId;
            };

            config.setUrlToElem = function(elem, url) {
              config.setFieldToElem(config.restangularFields.selfLink, elem, url);
              return this;
            };

            config.getUrlFromElem = function(elem) {
              return config.getFieldFromElem(config.restangularFields.selfLink, elem);
            };

            config.useCannonicalId = angular.isUndefined(config.useCannonicalId) ? false : config.useCannonicalId;
            object.setUseCannonicalId = function(value) {
                config.useCannonicalId = value;
                return this;
            };

            config.getCannonicalIdFromElem = function(elem) {
              var cannonicalId = elem[config.restangularFields.cannonicalId];
              var actualId = config.isValidId(cannonicalId) ?
                  cannonicalId : config.getIdFromElem(elem);
              return actualId;
            };

            /**
             * Sets the Response parser. This is used in case your response isn't directly the data.
             * For example if you have a response like {meta: {'meta'}, data: {name: 'Gonto'}}
             * you can extract this data which is the one that needs wrapping
             *
             * The ResponseExtractor is a function that receives the response and the method executed.
             */

            config.responseExtractor = config.responseExtractor || function(data, operation,
                    what, url, response, deferred) {
                return data;
            };

            object.setResponseExtractor = function(extractor) {
              config.responseExtractor = extractor;
              return this;
            };

            object.setResponseInterceptor = object.setResponseExtractor;

            /**
             * Response interceptor is called just before resolving promises.
             */


            /**
             * Request interceptor is called before sending an object to the server.
             */
            config.fullRequestInterceptor = config.fullRequestInterceptor || function(element, operation,
              path, url, headers, params, httpConfig) {
                return {
                  element: element,
                  headers: headers,
                  params: params,
                  httpConfig: httpConfig
                };
            };

            object.setRequestInterceptor = function(interceptor) {
              config.fullRequestInterceptor = function(elem, operation, path, url, headers, params, httpConfig) {
                return {
                  headers: headers,
                  params: params,
                  element: interceptor(elem, operation, path, url),
                  httpConfig: httpConfig
                };
              };
              return this;
            };

            object.setFullRequestInterceptor = function(interceptor) {
              config.fullRequestInterceptor = interceptor;
              return this;
            };

            config.errorInterceptor = config.errorInterceptor || function() {};

            object.setErrorInterceptor = function(interceptor) {
              config.errorInterceptor = interceptor;
              return this;
            };

            config.onBeforeElemRestangularized = config.onBeforeElemRestangularized || function(elem) {
              return elem;
            };
            object.setOnBeforeElemRestangularized = function(post) {
              config.onBeforeElemRestangularized = post;
              return this;
            };

            /**
             * This method is called after an element has been "Restangularized".
             *
             * It receives the element, a boolean indicating if it's an element or a collection
             * and the name of the model
             *
             */
            config.onElemRestangularized = config.onElemRestangularized || function(elem) {
              return elem;
            };
            object.setOnElemRestangularized = function(post) {
              config.onElemRestangularized = post;
              return this;
            };

            /**
             * Depracated. Don't use this!!
             */
            object.setListTypeIsArray = function(val) {

            };

            config.shouldSaveParent = config.shouldSaveParent || function() {
                return true;
            };
            object.setParentless = function(values) {
                if (angular.isArray(values)) {
                    config.shouldSaveParent = function(route) {
                        return -1 === values.indexOf(route);
                    };
                } else if (angular.isBoolean(values)) {
                    config.shouldSaveParent = function() {
                        return !values;
                    };
                }
                return this;
            };

            /**
             * This lets you set a suffix to every request.
             *
             * For example, if your api requires that for JSon requests you do /users/123.json, you can set that
             * in here.
             *
             *
             * By default, the suffix is null
             */
            config.suffix = angular.isUndefined(config.suffix) ? null : config.suffix;
            object.setRequestSuffix = function(newSuffix) {
                config.suffix = newSuffix;
                return this;
            };

            /**
             * Add element transformers for certain routes.
             */
            config.transformers = config.transformers || {};
            object.addElementTransformer = function(type, secondArg, thirdArg) {
                var isCollection = null;
                var transformer = null;
                if (arguments.length === 2) {
                    transformer = secondArg;
                } else {
                    transformer = thirdArg;
                    isCollection = secondArg;
                }

                var typeTransformers = config.transformers[type];
                if (!typeTransformers) {
                    typeTransformers = config.transformers[type] = [];
                }

                typeTransformers.push(function(coll, elem) {
                    if (null === isCollection || (coll === isCollection)) {
                        return transformer(elem);
                    }
                    return elem;
                });
            };

            object.extendCollection = function(route, fn) {
              return object.addElementTransformer(route, true, fn);
            };

            object.extendModel = function(route, fn) {
              return object.addElementTransformer(route, false, fn);
            };

            config.transformElem = function(elem, isCollection, route, Restangular) {
                var typeTransformers = config.transformers[route];
                var changedElem = elem;
                if (typeTransformers) {
                    angular.forEach(typeTransformers, function(transformer) {
                       changedElem = transformer(isCollection, changedElem);
                    });
                }
                return config.onElemRestangularized(changedElem,
                  isCollection, route, Restangular);
            };

            config.fullResponse = angular.isUndefined(config.fullResponse) ? false : config.fullResponse;
            object.setFullResponse = function(full) {
                config.fullResponse = full;
                return this;
            };



            //Internal values and functions
            config.urlCreatorFactory = {};

            /**
             * Base URL Creator. Base prototype for everything related to it
             **/

             var BaseCreator = function() {
             };

             BaseCreator.prototype.setConfig = function(config) {
                 this.config = config;
                 return this;
             };

             BaseCreator.prototype.parentsArray = function(current) {
                var parents = [];
                while(current) {
                    parents.push(current);
                    current = current[this.config.restangularFields.parentResource];
                }
                return parents.reverse();
            };

            function RestangularResource(config, $http, url, configurer) {
              var resource = {};
              angular.forEach(_.keys(configurer), function(key) {
                  var value = configurer[key];

                  // Add default parameters
                  value.params = angular.extend({}, value.params,
                          config.defaultRequestParams[value.method.toLowerCase()]);
                  // We don't want the ? if no params are there
                  if (_.isEmpty(value.params)) {
                    delete value.params;
                  }

                  if (config.isSafe(value.method)) {

                      resource[key] = function() {
                          return $http(angular.extend(value, {
                              url: url
                          }));
                      };

                  } else {

                      resource[key] = function(data) {
                          return $http(angular.extend(value, {
                              url: url,
                              data: data
                          }));
                      };

                  }
              });

              return resource;
            }

            BaseCreator.prototype.resource = function(current, $http, localHttpConfig, callHeaders, callParams, what, etag, operation) {

                var params = angular.extend({}, this.config.defaultRequestParams.common, callParams || {});
                var headers = angular.extend({}, this.config.defaultHeaders, callHeaders || {});

                if (etag) {
                    if (!config.isSafe(operation)) {
                      headers['If-Match'] = etag;
                    } else {
                      headers['If-None-Match'] = etag;
                    }
                }

                var url = this.base(current);

                if (what) {
                  var add = '';
                  if (!/\/$/.test(url)) {
                    add += '/';
                  }
                  add += what;
                  url += add;
                }

                if (this.config.suffix
                  && url.indexOf(this.config.suffix, url.length - this.config.suffix.length) === -1
                  && !this.config.getUrlFromElem(current)) {
                    url += this.config.suffix;
                }

                current[this.config.restangularFields.httpConfig] = undefined;


                return RestangularResource(this.config, $http, url, {
                    getList: this.config.withHttpValues(localHttpConfig,
                      {method: 'GET',
                      params: params,
                      headers: headers}),

                    get: this.config.withHttpValues(localHttpConfig,
                      {method: 'GET',
                      params: params,
                      headers: headers}),

                    put: this.config.withHttpValues(localHttpConfig,
                      {method: 'PUT',
                      params: params,
                      headers: headers}),

                    post: this.config.withHttpValues(localHttpConfig,
                      {method: 'POST',
                      params: params,
                      headers: headers}),

                    remove: this.config.withHttpValues(localHttpConfig,
                      {method: 'DELETE',
                      params: params,
                      headers: headers}),

                    head: this.config.withHttpValues(localHttpConfig,
                      {method: 'HEAD',
                      params: params,
                      headers: headers}),

                    trace: this.config.withHttpValues(localHttpConfig,
                      {method: 'TRACE',
                      params: params,
                      headers: headers}),

                    options: this.config.withHttpValues(localHttpConfig,
                      {method: 'OPTIONS',
                      params: params,
                      headers: headers}),

                    patch: this.config.withHttpValues(localHttpConfig,
                      {method: 'PATCH',
                      params: params,
                      headers: headers})
                });
            };

            /**
             * This is the Path URL creator. It uses Path to show Hierarchy in the Rest API.
             * This means that if you have an Account that then has a set of Buildings, a URL to a building
             * would be /accounts/123/buildings/456
            **/
            var Path = function() {
            };

            Path.prototype = new BaseCreator();

            Path.prototype.base = function(current) {
                var acum = this.config.baseUrl;
                var __this = this;
                angular.forEach(this.parentsArray(current), function(elem) {
                    var elemUrl;
                    var elemSelfLink = __this.config.getUrlFromElem(elem);
                    if (elemSelfLink) {
                      if (__this.config.isAbsoluteUrl(elemSelfLink)) {
                        acum = elemSelfLink;
                        return;
                      } else {
                        elemUrl = elemSelfLink;
                      }
                    } else {
                      elemUrl = elem[__this.config.restangularFields.route];

                      if (elem[__this.config.restangularFields.restangularCollection]) {
                        var ids = elem[__this.config.restangularFields.ids];
                        if (ids) {
                          elemUrl += "/" + ids.join(",");
                        }
                      } else {
                          var elemId;
                          if (__this.config.useCannonicalId) {
                              elemId = __this.config.getCannonicalIdFromElem(elem);
                          } else {
                              elemId = __this.config.getIdFromElem(elem);
                          }

                          if (config.isValidId(elemId)) {
                              elemUrl += "/" + (__this.config.encodeIds ? encodeURIComponent(elemId) : elemId);
                          }
                      }
                    }

                    acum = acum.replace(/\/$/, "") + "/" + elemUrl;

                });
                return acum;
            };



            Path.prototype.fetchUrl = function(current, what) {
                var baseUrl = this.base(current);
                if (what) {
                    baseUrl += "/" + what;
                }
                return baseUrl;
            };

            Path.prototype.fetchRequestedUrl = function(current, what) {
                var url = this.fetchUrl(current, what);
                var params = current[config.restangularFields.reqParams];

                // From here on and until the end of fetchRequestedUrl,
                // the code has been kindly borrowed from angular.js
                // The reason for such code bloating is coherence:
                //   If the user were to use this for cache management, the
                //   serialization of parameters would need to be identical
                //   to the one done by angular for cache keys to match.
                function sortedKeys(obj) {
                  var keys = [];
                  for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                      keys.push(key);
                    }
                  }
                  return keys.sort();
                }

                function forEachSorted(obj, iterator, context) {
                  var keys = sortedKeys(obj);
                  for ( var i = 0; i < keys.length; i++) {
                    iterator.call(context, obj[keys[i]], keys[i]);
                  }
                  return keys;
                }

                function encodeUriQuery(val, pctEncodeSpaces) {
                  return encodeURIComponent(val).
                             replace(/%40/gi, '@').
                             replace(/%3A/gi, ':').
                             replace(/%24/g, '$').
                             replace(/%2C/gi, ',').
                             replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
                }

                if (!params) return url;
                var parts = [];
                forEachSorted(params, function(value, key) {
                  if (value === null || value === undefined) return;
                  if (!angular.isArray(value)) value = [value];

                  angular.forEach(value, function(v) {
                    if (angular.isObject(v)) {
                      v = angular.toJson(v);
                    }
                    parts.push(encodeUriQuery(key) + '=' +
                               encodeUriQuery(v));
                  });
                });
                return url + ((url.indexOf('?') === -1) ? '?' : '&') + parts.join('&');
            };



            config.urlCreatorFactory.path = Path;

        };

        var globalConfiguration = {};

        Configurer.init(this, globalConfiguration);




       this.$get = ['$http', '$q', function($http, $q) {

          function createServiceForConfiguration(config) {
              var service = {};

              var urlHandler = new config.urlCreatorFactory[config.urlCreator]();
              urlHandler.setConfig(config);

              function restangularizeBase(parent, elem, route, reqParams) {
                  elem[config.restangularFields.route] = route;
                  elem[config.restangularFields.getRestangularUrl] = angular.bind(urlHandler, urlHandler.fetchUrl, elem);
                  elem[config.restangularFields.getRequestedUrl] = angular.bind(urlHandler, urlHandler.fetchRequestedUrl, elem);
                  elem[config.restangularFields.addRestangularMethod] = angular.bind(elem, addRestangularMethodFunction);
                  elem[config.restangularFields.clone] = angular.bind(elem, copyRestangularizedElement, elem);
                  elem[config.restangularFields.reqParams] = _.isEmpty(reqParams) ? null : reqParams;
                  elem.withHttpConfig = angular.bind(elem, withHttpConfig);

                  // RequestLess connection
                  elem[config.restangularFields.one] = angular.bind(elem, one, elem);
                  elem[config.restangularFields.all] = angular.bind(elem, all, elem);
                  elem[config.restangularFields.several] = angular.bind(elem, several, elem);
                  elem[config.restangularFields.oneUrl] = angular.bind(elem, oneUrl, elem);
                  elem[config.restangularFields.allUrl] = angular.bind(elem, allUrl, elem);

                  if (parent && config.shouldSaveParent(route)) {
                      var parentId = config.getIdFromElem(parent);
                      var parentUrl = config.getUrlFromElem(parent);

                      var restangularFieldsForParent = [config.restangularFields.route, config.restangularFields.parentResource].concat(config.extraFields);

                      var parentResource = {};
                      angular.forEach(restangularFieldsForParent, function(field) {
                         parentResource[field] = parent[field];
                      });

                      if (config.isValidId(parentId)) {
                          config.setIdToElem(parentResource, parentId);
                      }
                      if (config.isValidId(parentUrl)) {
                          config.setUrlToElem(parentResource, parentUrl);
                      }

                      elem[config.restangularFields.parentResource] = parentResource;
                  } else {
                    elem[config.restangularFields.parentResource] = null;
                  }
                  return elem;
              }



              function one(parent, route, id) {
                  var elem = {};
                  config.setIdToElem(elem, id);
                  return restangularizeElem(parent, elem , route);
              }


              function all(parent, route) {
                  return restangularizeCollection(parent, [] , route, true);
              }

              function several(parent, route, ids) {
                var collection = [];
                collection[config.restangularFields.ids] =
                  Array.prototype.splice.call(arguments, 2);
                return restangularizeCollection(parent, collection , route, true);
              }

              function oneUrl(parent, route, url) {
                  var elem = {};
                  config.setUrlToElem(elem, url);
                  return restangularizeElem(parent, elem , route);
              }


              function allUrl(parent, route, url) {
                  var elem = {};
                  config.setUrlToElem(elem, url);
                  return restangularizeCollection(parent, elem , route, true);
              }
              // Promises
              function restangularizePromise(promise, isCollection, valueToFill) {
                  promise.call = angular.bind(promise, promiseCall);
                  promise.get = angular.bind(promise, promiseGet);
                  promise[config.restangularFields.restangularCollection] = isCollection;
                  if (isCollection) {
                      promise.push = angular.bind(promise, promiseCall, "push");
                  }
                  promise.$object = valueToFill;
                  return promise;
              }

              function promiseCall(method) {
                  var deferred = $q.defer();
                  var callArgs = arguments;
                  var filledValue = {};
                  this.then(function(val) {
                      var params = Array.prototype.slice.call(callArgs, 1);
                      var func = val[method];
                      func.apply(val, params);
                      filledValue = val;
                      deferred.resolve(val);
                  });
                  return restangularizePromise(deferred.promise, this[config.restangularFields.restangularCollection], filledValue);
              }

              function promiseGet(what) {
                  var deferred = $q.defer();
                  var filledValue = {};
                  this.then(function(val) {
                      filledValue = val[what];
                      deferred.resolve(filledValue);
                  });
                  return restangularizePromise(deferred.promise, this[config.restangularFields.restangularCollection], filledValue);
              }

              function resolvePromise(deferred, response, data, filledValue) {

                angular.extend(filledValue, data);
                
                // Trigger the full response interceptor.
                if (config.fullResponse) {
                  return deferred.resolve(angular.extend(response, {
                    data: data
                  }));
                } else {
                  deferred.resolve(data);
                }
              }


              // Elements

              function stripRestangular(elem) {
                if (angular.isArray(elem)) {
                    var array = [];
                    angular.forEach(elem, function(value) {
                        array.push(stripRestangular(value));
                    });
                    return array;
                } else {
                    var stripped = angular.copy(elem);
                    angular.forEach(config.restangularFields, function(fieldVal, fieldKey) {
                        if ('id' !== fieldKey) {
                            delete stripped[fieldVal];
                        }
                    });
                    return stripped;
                }
                        
                        
              }

              function addCustomOperation(elem) {
                  elem.customOperation = angular.bind(elem, customFunction);
                  angular.forEach(["put", "post", "get", "delete"], function(oper) {
                      angular.forEach(["do", "custom"], function(alias) {
                          var callOperation = oper === 'delete' ? 'remove' : oper;
                          var name = alias + oper.toUpperCase();
                          var callFunction;

                          if (callOperation !== 'put' && callOperation !== 'post') {
                              callFunction = customFunction;
                          } else {
                              callFunction = function(operation, elem, path, params, headers) {
                                return angular.bind(this, customFunction)(operation, path, params, headers, elem);
                              };
                          }
                          elem[name] = angular.bind(elem, callFunction, callOperation);
                      });
                  });
                  elem.customGETLIST = angular.bind(elem, fetchFunction);
                  elem.doGETLIST = elem.customGETLIST;
              }

              function copyRestangularizedElement(fromElement) {
                  var copiedElement = angular.copy(fromElement);
                  return restangularizeElem(copiedElement[config.restangularFields.parentResource],
                          copiedElement, copiedElement[config.restangularFields.route]);
              }

              function restangularizeElem(parent, element, route, collection, reqParams) {
                  var elem = config.onBeforeElemRestangularized(element, false, route);

                  var localElem = restangularizeBase(parent, elem, route, reqParams);

                  if (config.useCannonicalId) {
                      localElem[config.restangularFields.cannonicalId] = config.getIdFromElem(localElem);
                  }

                  if (collection) {
                      localElem[config.restangularFields.getParentList] = function() {
                          return collection;
                      };
                  }

                  localElem[config.restangularFields.restangularCollection] = false;
                  localElem[config.restangularFields.get] = angular.bind(localElem, getFunction);
                  localElem[config.restangularFields.getList] = angular.bind(localElem, fetchFunction);
                  localElem[config.restangularFields.put] = angular.bind(localElem, putFunction);
                  localElem[config.restangularFields.post] = angular.bind(localElem, postFunction);
                  localElem[config.restangularFields.remove] = angular.bind(localElem, deleteFunction);
                  localElem[config.restangularFields.head] = angular.bind(localElem, headFunction);
                  localElem[config.restangularFields.trace] = angular.bind(localElem, traceFunction);
                  localElem[config.restangularFields.options] = angular.bind(localElem, optionsFunction);
                  localElem[config.restangularFields.patch] = angular.bind(localElem, patchFunction);

                  addCustomOperation(localElem);
                  return config.transformElem(localElem, false, route, service);
              }

              function restangularizeCollection(parent, element, route, reqParams) {
                  var elem = config.onBeforeElemRestangularized(element, true, route);

                  var localElem = restangularizeBase(parent, elem, route, reqParams);
                  localElem[config.restangularFields.restangularCollection] = true;
                  localElem[config.restangularFields.post] = angular.bind(localElem, postFunction, null);
                  localElem[config.restangularFields.remove] = angular.bind(localElem, deleteFunction);
                  localElem[config.restangularFields.head] = angular.bind(localElem, headFunction);
                  localElem[config.restangularFields.trace] = angular.bind(localElem, traceFunction);
                  localElem[config.restangularFields.putElement] = angular.bind(localElem, putElementFunction);
                  localElem[config.restangularFields.options] = angular.bind(localElem, optionsFunction);
                  localElem[config.restangularFields.patch] = angular.bind(localElem, patchFunction);
                  localElem[config.restangularFields.get] = angular.bind(localElem, getById);
                  localElem[config.restangularFields.getList] = angular.bind(localElem, fetchFunction, null);

                  addCustomOperation(localElem);
                  return config.transformElem(localElem, true, route, service);
              }

              function restangularizeCollectionAndElements(parent, element, route) {
                var collection = restangularizeCollection(parent, element, route);
                angular.forEach(collection, function(elem) {
                  restangularizeElem(parent, elem, route);
                });
                return collection;
              }

              function getById(id, reqParams, headers){
                  return this.customGET(id.toString(), reqParams, headers);
              }

              function putElementFunction(idx, params, headers) {
                  var __this = this;
                  var elemToPut = this[idx];
                  var deferred = $q.defer();
                  var filledArray = [];
                  elemToPut.put(params, headers).then(function(serverElem) {
                      var newArray = copyRestangularizedElement(__this);
                      newArray[idx] = serverElem;
                      filledArray = newArray;
                      deferred.resolve(newArray);
                  }, function(response) {
                      deferred.reject(response);
                  });

                  return restangularizePromise(deferred.promise, true, filledArray);
              }

              function parseResponse(resData, operation, route, fetchUrl, response, deferred) {
                  var data = config.responseExtractor(resData, operation, route, fetchUrl, response, deferred);
                  var etag = response.headers("ETag");
                  if (data && etag) {
                      data[config.restangularFields.etag] = etag;
                  }
                  return data;
              }


              function fetchFunction(what, reqParams, headers) {
                  var __this = this;
                  var deferred = $q.defer();
                  var operation = 'getList';
                  var url = urlHandler.fetchUrl(this, what);
                  var whatFetched = what || __this[config.restangularFields.route];

                  var request = config.fullRequestInterceptor(null, operation,
                      whatFetched, url, headers || {}, reqParams || {}, this[config.restangularFields.httpConfig] || {});

                  var filledArray = [];

                  urlHandler.resource(this, $http, request.httpConfig, request.headers, request.params, what,
                          this[config.restangularFields.etag], operation).getList().then(function(response) {
                      var resData = response.data;
                      var fullParams = response.config.params;
                      var data = parseResponse(resData, operation, whatFetched, url, response, deferred);
                      var processedData = [];
                      angular.forEach(data, function(elem) {
                          var val;
                          if (!__this[config.restangularFields.restangularCollection]) {
                              val = restangularizeElem(__this, elem, what, data);
                          } else {
                              val = restangularizeElem(__this[config.restangularFields.parentResource],
                                elem, __this[config.restangularFields.route], data);
                          }
                          processedData.push(val);
                      });

                      processedData = angular.extend(data, processedData);

                      if (!__this[config.restangularFields.restangularCollection]) {
                          resolvePromise(deferred, response, restangularizeCollection(__this, processedData, what, fullParams), filledArray);
                      } else {
                          resolvePromise(deferred, response, restangularizeCollection(__this[config.restangularFields.parentResource], processedData, __this[config.restangularFields.route], fullParams), filledArray);
                      }
                  }, function error(response) {
                      if ( config.errorInterceptor(response) !== false ) {
                          deferred.reject(response);
                      }
                  });

                  return restangularizePromise(deferred.promise, true, filledArray);
              }

              function withHttpConfig(httpConfig) {
                 this[config.restangularFields.httpConfig] = httpConfig;
                 return this;
              }

              function elemFunction(operation, what, params, obj, headers) {
                  var __this = this;
                  var deferred = $q.defer();
                  var resParams = params || {};
                  var route = what || this[config.restangularFields.route];
                  var fetchUrl = urlHandler.fetchUrl(this, what);

                  var callObj = obj || this;
                  var etag = callObj[config.restangularFields.etag];

                  if (angular.isObject(callObj) && config.isRestangularized(callObj)) {
                      callObj = stripRestangular(callObj);
                  }
                  var request = config.fullRequestInterceptor(callObj, operation, route, fetchUrl,
                    headers || {}, resParams || {}, this[config.restangularFields.httpConfig] || {});

                  var filledObject = {};

                  var okCallback = function(response) {
                      var resData = response.data;
                      var fullParams = response.config.params;
                      var elem = parseResponse(resData, operation, route, fetchUrl, response, deferred);
                      if (elem) {

                        if (operation === "post" && !__this[config.restangularFields.restangularCollection]) {
                          resolvePromise(deferred, response, restangularizeElem(__this, elem, what, fullParams), filledObject);
                        } else {
                          resolvePromise(deferred, response, restangularizeElem(__this[config.restangularFields.parentResource], elem, __this[config.restangularFields.route], fullParams), filledObject);
                        }

                      } else {
                        resolvePromise(deferred, response, undefined, filledObject);
                      }
                  };

                  var errorCallback = function(response) {
                      if ( config.errorInterceptor(response) !== false ) {
                          deferred.reject(response);
                      }
                  };
                  // Overring HTTP Method
                  var callOperation = operation;
                  var callHeaders = angular.extend({}, request.headers);
                  var isOverrideOperation = config.isOverridenMethod(operation);
                  if (isOverrideOperation) {
                    callOperation = 'post';
                    callHeaders = angular.extend(callHeaders, {'X-HTTP-Method-Override': operation === 'remove' ? 'DELETE' : operation});
                  }

                  if (config.isSafe(operation)) {
                    if (isOverrideOperation) {
                      urlHandler.resource(this, $http, request.httpConfig, callHeaders, request.params,
                        what, etag, callOperation)[callOperation]({}).then(okCallback, errorCallback);
                    } else {
                      urlHandler.resource(this, $http, request.httpConfig, callHeaders, request.params,
                        what, etag, callOperation)[callOperation]().then(okCallback, errorCallback);
                    }
                  } else {
                      urlHandler.resource(this, $http, request.httpConfig, callHeaders, request.params,
                        what, etag, callOperation)[callOperation](request.element).then(okCallback, errorCallback);
                  }

                  return restangularizePromise(deferred.promise, false, filledObject);
              }

              function getFunction(params, headers) {
                  return angular.bind(this, elemFunction)("get", undefined, params, undefined, headers);
              }

              function deleteFunction(params, headers) {
                  return angular.bind(this, elemFunction)("remove", undefined, params, undefined, headers);
              }

              function putFunction(params, headers) {
                  return angular.bind(this, elemFunction)("put", undefined, params, undefined, headers);
              }

              function postFunction(what, elem, params, headers) {
                  return angular.bind(this, elemFunction)("post", what, params, elem, headers);
              }

             function headFunction(params, headers) {
               return angular.bind(this, elemFunction)("head", undefined, params, undefined, headers);
             }

             function traceFunction(params, headers) {
               return angular.bind(this, elemFunction)("trace", undefined, params, undefined, headers);
             }

             function optionsFunction(params, headers) {
               return angular.bind(this, elemFunction)("options", undefined, params, undefined, headers);
             }

             function patchFunction(elem, params, headers) {
               return angular.bind(this, elemFunction)("patch", undefined, params, elem, headers);
             }

             function customFunction(operation, path, params, headers, elem) {
                 return angular.bind(this, elemFunction)(operation, path, params, elem, headers);
             }

             function addRestangularMethodFunction(name, operation, path, defaultParams, defaultHeaders, defaultElem) {
                 var bindedFunction;
                 if (operation === 'getList') {
                     bindedFunction = angular.bind(this, fetchFunction, path);
                 } else {
                     bindedFunction = angular.bind(this, customFunction, operation, path);
                 }

                 var createdFunction = function(params, headers, elem) {
                     var callParams = angular.extend({
                         params: defaultParams,
                         headers: defaultHeaders,
                         elem: defaultElem
                     }, {
                         params: params,
                         headers: headers,
                         elem: elem
                     });
                     return bindedFunction(callParams.params, callParams.headers, callParams.elem);
                 };

                 if (config.isSafe(operation)) {
                     this[name] = createdFunction;
                 } else {
                     this[name] = function(elem, params, headers) {
                         return createdFunction(params, headers, elem);
                     };
                 }

             }

             function withConfigurationFunction(configurer) {
                 var newConfig = {};
                 for (var key in config) {
                     if (config.hasOwnProperty(key) && 'configuration' !== key) {
                         var val = config[key];
                         newConfig[key] = angular.isObject(val) ? angular.copy(val) : val;
                     }
                 }
                 Configurer.init(newConfig, newConfig);
                 configurer(newConfig);
                 return createServiceForConfiguration(newConfig);
             }


              Configurer.init(service, config);

              service.copy = angular.bind(service, copyRestangularizedElement);

              service.withConfig = angular.bind(service, withConfigurationFunction);

              service.one = angular.bind(service, one, null);

              service.all = angular.bind(service, all, null);

              service.several = angular.bind(service, several, null);

              service.oneUrl = angular.bind(service, oneUrl, null);

              service.allUrl = angular.bind(service, allUrl, null);

              service.stripRestangular = angular.bind(service, stripRestangular);

              service.restangularizeElement = angular.bind(service, restangularizeElem);

              service.restangularizeCollection = angular.bind(service, restangularizeCollectionAndElements);

              return service;
          }

          return createServiceForConfiguration(globalConfiguration);

        }];
    }
);

})();
