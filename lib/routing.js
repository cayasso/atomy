/**
 * jQuery routing plugin
 * copyright (c) 2012 Lowe's Companies, Inc.
 * license This is licensed only for use in providing the Lowes.com service,
 * or any part thereof, and is subject to the Lowes.com Terms and Conditions.
 * You may not port this file to another platform without Lowes.com's written consent.
 * @version 0.1.0
 * @author Jonathan Brumley
 * Dependencies jquery.ba-hashchange.min.js v1.3
 */
 
/**
 * @name $.route
 * @class
 * The routing plugin is a simple client side routing system that takes a string
 * which contains a state after the hash symbol such as #/summary/123456 and activates a
 * specific piece of code (callback function) which can respond to the request. The
 * plugin also enables the back/forward button and bookmarks support for ajax applications
 * which is the main reason why it was develop.
 *
 * @example
 *
 *  $.route({
 *   '': function (params) {
 *    // Should match #/ , # or no hash like http://example.com/
 *   }
 *
 *   ':nav': function (params) {
 *    // Should match http://example.com/#spaces
 *   },
 *
 *   ':nav/:id': function (params) {
 *    // Should match http://example.com/#spaces/123456
 *   }
 *
 *   ':nav/:id?' function (params) {
 *    // Should match http://example.com/#spaces/
 *    // or http://example.com/#spaces/123456
 *   }
 *
 *   ':nav(summary|items)': function (params) {
 *    // Should match http://example.com/#summary or
 *    // http://example.com/#items but not http://example.com/#spaces
 *   }
 *
 *   ':nav/:id(\\w{3})': function (params) {
 *    // Should match http://example.com/#spaces/123
 *    // but not http://example.com/#spaces/1234
 *   }
 *
 *  });
 *
 *
 *
 * @example
 *
 *  // The first argument params contains the
 *  // matched hash route pair/value.
 *  // Example bellow assuming that we have a hash like
 *  // this http://example.com/#spaces/123
 *
 *  ':nav/:id(\\w{3})': function (params) {
 *   console.log(params.nav + ' and '+ params.id)
 *   // Output => spaces and 123
 *  }
 *
 * @example
 *
 *  // You can also register individual routes in any
 *  // function context, just pass a string to $.route
 *  // instead of a literal object.
 *
 *  function myRoute () {
 *   $.rote(':nav/:id(\\w{3})', function (params) {
 *    console.log(params.nav + ' and '+ params.id)
 *    // Output => spaces and 123
 *   }
 *  }
 *
 *  Then you can call the function to register the route
 *  myRoute();
 */

 var Atomy = Atomy || {};

 (function (Atomy, w) {

    /**
     *  @constructor
     *  @name $.route
     *  @author Jonathan Brumley
     *  @class This is the route class constructor.
     */
    var Route = {
                
        isMatched: false,

        paths: {},
        
        /**
         * This function is executed on hash change and
         * if the path matches a route pattern.
         *
         * @param  {String}   path
         * @param  {Function} fn
         * @return {Object}
         */


        on: function (path, fn) {
            
            var self = this, paths, len = 0;
            
            if (_.isHash(path)) {
                paths = path;
            }

            if (_.isFunction(path)) {
                paths = path.call(self);
            }

            if (!self.paths[path]) {
                $(w).bind('hashchange', function () {
                    if (paths) {
                        _.each.call(self, paths, self.check(self));
                    } else {
                        self.check(self)(path, self.paths[path]);
                    }
                });
            }
            self.paths[path] = fn;
            return self;
        },

        /**
         * Check if a route is valid and
         * execute callback function.
         *
         * @param  {String}   path
         * @param  {Function} fn
         * @return {Boolean}
         */
        check: function (obj) {
            return function check (path, fn) {
                isValid = obj.run(path, obj.hash(), fn);
                if (isValid && _.isHash(partial) && obj.isMatched) {
                    obj.isMatched = false;
                }
                return !isValid;
            };
        },

        /**
         * Check path and execute function if
         * route was matched.
         *
         * @param  {String}   path
         * @param  {String}   hash
         * @param  {Function} fn Callback function
         * @return {Object|False}
         */
        run: function (path, hash, fn) {
            if ((params = this._match(path, hash))) {
                this.isMatched = true;
                fn.call(this, params.obj, params);
                return true;
            }
            return false;
        },
        
        /**
         * Create regular expression to match a
         * given path.
         *
         * @param  {String} path
         * @param  {Array} keys
         * @param  {Boolean} strict
         * @return {RegExp}
         */
        _regex: function (path, keys, strict) {
            path = path
            .concat(strict ? '' : '/?')
            .replace(/\/\(/g, '(?:/')
            .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
                keys.push({ name: key, optional: !! optional });
                slash = slash || '';
                return '' +
                (optional ? '' : slash) + '(?:' +
                (optional ? slash : '') +
                (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' +
                (optional || '');
            })
            .replace(/([\/.])/g, '\\$1')
            .replace(/\*/g, '(.*)');
            return new RegExp('^' + path + '$');
        },

        /**
         * Match an specific route route.
         *
         * @param  {String} path
         * @param  {String} str
         * @return {Array}
         */
        _match: function(path, str){
            var names = [], values = this._regex(path, names).exec(str);
            return (values) ? this._params(names, values) : null;
        },

        /**
         * Create and return a params object.
         *
         * @param  {Array} names
         * @param  {Array} values
         * @return {Object}
         */
        _params: function (names, values) {
            // The result object
            var obj = { path: values[0], names: names, values: values, obj: {} };
            for (var i = 1, len = values.length; i < len; i++) {
                obj.obj[names[i-1].name] = values[i];
            }
            return obj;
        },

        /**
         * Get the url hash.
         *
         * @return {String}
         */
        hash: function () {
            return location.hash.replace(/^[^#]*#?(.*)$/, '$1');
        },

        /**
         * Route to a provided route, this will update the location.hash
         *
         * @param  {String} argument infinite arguments
         * @return {String}
         */
        routeTo: function () {
            var args = Array.prototype.slice.call(arguments, 0);
            location.hash = '#' + args.join('/');
            return location.hash || null;
        }
        
        /**
         * Trigger the hashchange event
         *
         * @return {Object}
         */
        /*trigger: function () {
            $(w).hashchange();
            return this;
        }*/
    };

    Atomy.Route = Route;

    // Expose as plugin to jQuery
    /*$.routing = function (path, fn) {
        return Route.on(path, fn);
    };*/

}).call(this, Atomy, window);










    Atomy.Router = Atomy.Class.extend('Router', 

    /**
     * Static methods
     */
    {
        history: false,
        routes: {}
    }, 

    /**
     * Prototype methods
     */
    {
        init: function (options) {          
            this._ids = {};         
            this._routes = {};          
            this._isMatched = false;
            this._add(this._class.routes);          
        },      

        to: function (id, route, fn) {          
            var routes = this._routes;
            if (_.isFunction(route) || route == null) {
                fn = route;
                route = id;
                id = null;
            }
            if (id) {
                if (path = this._ids[id]) {                 
                    this._run(path, route, fn || routes[path]);
                }
            } else {
                _.each(routes, function (cb, path) {
                    this._run(path, route, fn || cb);
                }, this);
            }
        },

        navigate: function (path, options) {
            Atomy.History.stop();
            (options.replace || false) && Atomy.History.setHash(path) || Atomy.History.replaceHash(path);
            //(options.trigger || false) && this.hasher.setHash(path) || this.hasher.replaceHash(path);                 

            //this.to(path);
            //Atomy.History.init();         
        },      
        
        _watch: function () {
            var self = this;                            
            Atomy.History.init();
            Atomy.History.changed(function (hash) {
                self.to(hash);
            });
        },

        _add: function (routes) {
            _.each(routes, function (cb, path) {
                var p = path.split(' ');
                this._routes[p[0]] = cb;
                if (p[1]) {
                    this._ids[p[1]] = p[0];
                }
            }, this);
            if (this._class.history) {
                this._watch();
            }
        },

        /**
         * Check path and execute function if
         * route was matched.
         *
         * @param  {String}   path
         * @param  {String}   hash
         * @param  {Function} fn Callback function
         * @return {Object|False}
         */
        _run: function (path, hash, fn) {
            if ((params = this._match(path, hash))) {
                this._isMatched = true;
                ( _.isString(fn) && this._class[fn] || fn).call(this, params.obj, params);
                return true;
            }
            return false;
        },
        
        /**
         * Match an specific router route.
         *
         * @param  {String} path
         * @param  {String} str
         * @return {Array}
         */
        _match: function(path, str){
            var names = [], values = this._regex(path, names).exec(str);
            return (values) ? this._params(names, values) : null;
        },

        /**
         * Create regular expression to match a
         * given path.
         *
         * @param  {String} path
         * @param  {Array} keys
         * @param  {Boolean} strict
         * @return {RegExp}
         */
        _regex: function (path, keys, strict) {
            path = path
            .concat(strict ? '' : '/?')
            .replace(/\/\(/g, '(?:/')
            .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
                keys.push({ name: key, optional: !! optional });
                slash = slash || '';
                return '' +
                (optional ? '' : slash) + '(?:' +
                (optional ? slash : '') +
                (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' +
                (optional || '');
            })
            .replace(/([\/.])/g, '\\$1')
            .replace(/\*/g, '(.*)');
            return new RegExp('^' + path + '$');
        },

        /**
         * Create and return a params object.
         *
         * @param  {Array} names
         * @param  {Array} values
         * @return {Object}
         */
        _params: function (names, values) {
            // The result object
            var obj = { path: values[0], names: names, values: values, obj: {} };
            for (var i = 1, len = values.length; i < len; i++) {
                obj.obj[names[i-1].name] = values[i];
            }
            return obj;
        }
    });

    Atomy.History = (function(window){

        //--------------------------------------------------------------------------------------
        // Private Vars
        //--------------------------------------------------------------------------------------

        var

            POOL_INTERVAL = 25,

            // local storage for brevity and better compression --------------------------------

            document = window.document,
            location = window.location,
            history = window.history,
            //Signal = signals.Signal,

            // local vars ----------------------------------------------------------------------

            hasher,
            _hash,
            _checkInterval,
            _isActive,
            _frame, //iframe used for legacy IE (6-7)
            _checkHistory,
            _hashValRegexp = /#(.*)$/,
            _baseUrlRegexp = /(\?.*)|(\#.*)/,
            _hashRegexp = /^\#/,

            // sniffing/feature detection -------------------------------------------------------

            _isIE = (!+"\v1"), //hack based on this: http://webreflection.blogspot.com/2009/01/32-bytes-to-know-if-your-browser-is-ie.html
            _isHashChangeSupported = ('onhashchange' in window), // FF3.6+, IE8+, Chrome 5+, Safari 5+
            _isLegacyIE = _isIE && !_isHashChangeSupported, //check if is IE6-7 since hash change is only supported on IE8+ and changing hash value on IE6-7 doesn't generate history record.
            _isLocal = (location.protocol === 'file:');


        //--------------------------------------------------------------------------------------
        // Private Methods
        //--------------------------------------------------------------------------------------

        function _trimHash(hash){
            if(! hash) return '';
            var regexp = new RegExp('^\\'+ hasher.prependHash +'|\\'+ hasher.appendHash +'$', 'g');
            return hash.replace(regexp, '');
        }

        function _getWindowHash(){
            //parsed full URL instead of getting location.hash because Firefox decode hash value (and all the other browsers don't)
            //also because of IE8 bug with hash query in local file [issue #6]
            var result = _hashValRegexp.exec( hasher.getURL() );
            return (result && result[1])? decodeURIComponent(result[1]) : '';
        }

        function _getFrameHash(){
            return (_frame)? _frame.contentWindow.frameHash : null;
        }

        function _createFrame(){
            _frame = document.createElement('iframe');
            _frame.src = 'about:blank';
            _frame.style.display = 'none';
            document.body.appendChild(_frame);
        }

        function _updateFrame(){
            if(_frame && _hash !== _getFrameHash()){
                var frameDoc = _frame.contentWindow.document;
                frameDoc.open();
                //update iframe content to force new history record.
                //based on Really Simple History, SWFAddress and YUI.history.
                frameDoc.write('<html><head><title>' + document.title + '</title><script type="text/javascript">var frameHash="' + _hash + '";</script></head><body>&nbsp;</body></html>');
                frameDoc.close();
            }
        }

        function _registerChange(newHash, isReplace){
            newHash = decodeURIComponent(newHash); //fix IE8 while offline
            if(_hash !== newHash){
                var oldHash = _hash;
                _hash = newHash; //should come before event dispatch to make sure user can get proper value inside event handler
                if(_isLegacyIE){
                    if(!isReplace){
                        _updateFrame();
                    } else {
                        _frame.contentWindow.frameHash = newHash;
                    }
                }
                hasher.trigger('hashchange', _trimHash(newHash), _trimHash(oldHash));
            }
        }

        if (_isLegacyIE) {
            _checkHistory = function(){
                var windowHash = _getWindowHash(),
                    frameHash = _getFrameHash();
                if(frameHash !== _hash && frameHash !== windowHash){
                    //detect changes made pressing browser history buttons.
                    //Workaround since history.back() and history.forward() doesn't
                    //update hash value on IE6/7 but updates content of the iframe.
                    //needs to trim hash since value stored already have
                    //prependHash + appendHash for fast check.
                    hasher.setHash(_trimHash(frameHash));
                } else if (windowHash !== _hash){
                    //detect if hash changed (manually or using setHash)
                    _registerChange(windowHash);
                }
            };
        } else {
            _checkHistory = function(){
                var windowHash = _getWindowHash();
                if(windowHash !== _hash){
                    _registerChange(windowHash);
                }
            };
        }

        function _addListener(elm, eType, fn){
            if(elm.addEventListener){
                elm.addEventListener(eType, fn, false);
            } else if (elm.attachEvent){
                elm.attachEvent('on' + eType, fn);
            }
        }

        function _removeListener(elm, eType, fn){
            if(elm.removeEventListener){
                elm.removeEventListener(eType, fn, false);
            } else if (elm.detachEvent){
                elm.detachEvent('on' + eType, fn);
            }
        }

        function _makePath(paths){
            paths = Array.prototype.slice.call(arguments);

            var path = paths.join(hasher.separator);
            path = path? hasher.prependHash + path.replace(_hashRegexp, '') + hasher.appendHash : path;

            if(_isIE && _isLocal){
                path = path.replace(/\?/, '%3F'); //fix IE8 local file bug [issue #6]
            }
            return path;
        }

        //--------------------------------------------------------------------------------------
        // Public (API)
        //--------------------------------------------------------------------------------------

        hasher = /** @lends hasher */ {

            /**
             * hasher Version Number
             * @type string
             * @constant
             */
            VERSION : '1.1.0',

            /**
             * String that should always be added to the end of Hash value.
             * <ul>
             * <li>default value: '';</li>
             * <li>will be automatically removed from `hasher.getHash()`</li>
             * <li>avoid conflicts with elements that contain ID equal to hash value;</li>
             * </ul>
             * @type string
             */
            appendHash : '',

            /**
             * String that should always be added to the beginning of Hash value.
             * <ul>
             * <li>default value: '/';</li>
             * <li>will be automatically removed from `hasher.getHash()`</li>
             * <li>avoid conflicts with elements that contain ID equal to hash value;</li>
             * </ul>
             * @type string
             */
            prependHash : '/',

            /**
             * String used to split hash paths; used by `hasher.getHashAsArray()` to split paths.
             * <ul>
             * <li>default value: '/';</li>
             * </ul>
             * @type string
             */
            separator : '/',

            /**
             * Signal dispatched when hash value changes.
             * - pass current hash as 1st parameter to listeners and previous hash value as 2nd parameter.
             * @type signals.Signal
             */
            changed: function (fn) {
                this.on('hashchange', fn);
            },

            /**
             * Signal dispatched when hasher is stopped.
             * -  pass current hash as first parameter to listeners
             * @type signals.Signal
             */
            stopped: function (fn) {
                this.on('hashstopped', fn);
            },

            /**
             * Signal dispatched when hasher is initialized.
             * - pass current hash as first parameter to listeners.
             * @type signals.Signal
             */
            initialized: function (fn) {
                this.on('hashinitialized', fn);
            },

            /**
             * Start listening/dispatching changes in the hash/history.
             * <ul>
             *   <li>hasher won't dispatch CHANGE events by manually typing a new value or pressing the back/forward buttons before calling this method.</li>
             * </ul>
             */
            init : function(){
                if(_isActive) return;

                _hash = _getWindowHash();

                //thought about branching/overloading hasher.init() to avoid checking multiple times but
                //don't think worth doing it since it probably won't be called multiple times.
                if(_isHashChangeSupported){
                    _addListener(window, 'hashchange', _checkHistory);
                }else {
                    if(_isLegacyIE){
                        if(! _frame){
                            _createFrame();
                        }
                        _updateFrame();
                    }
                    _checkInterval = setInterval(_checkHistory, POOL_INTERVAL);
                }

                _isActive = true;
                this.trigger('hashinitialized', _trimHash(_hash));
            },

            /**
             * Stop listening/dispatching changes in the hash/history.
             * <ul>
             *   <li>hasher won't dispatch CHANGE events by manually typing a new value or pressing the back/forward buttons after calling this method, unless you call hasher.init() again.</li>
             *   <li>hasher will still dispatch changes made programatically by calling hasher.setHash();</li>
             * </ul>
             */
            stop : function(){
                if(! _isActive) return;

                if(_isHashChangeSupported){
                    _removeListener(window, 'hashchange', _checkHistory);
                }else{
                    clearInterval(_checkInterval);
                    _checkInterval = null;
                }

                _isActive = false;
                this.trigger('hashstopped', _trimHash(_hash));
            },

            /**
             * @return {boolean}    If hasher is listening to changes on the browser history and/or hash value.
             */
            isActive : function(){
                return _isActive;
            },

            /**
             * @return {string} Full URL.
             */
            getURL : function(){
                return location.href;
            },

            /**
             * @return {string} Retrieve URL without query string and hash.
             */
            getBaseURL : function(){
                return hasher.getURL().replace(_baseUrlRegexp, ''); //removes everything after '?' and/or '#'
            },

            /**
             * Set Hash value, generating a new history record.
             * @param {...string} path    Hash value without '#'. Hasher will join
             * path segments using `hasher.separator` and prepend/append hash value
             * with `hasher.appendHash` and `hasher.prependHash`
             * @example hasher.setHash('lorem', 'ipsum', 'dolor') -> '#/lorem/ipsum/dolor'
             */
            setHash : function(path){
                path = _makePath.apply(null, arguments);
                if(path !== _hash){
                    _registerChange(path); //avoid breaking the application if for some reason `location.hash` don't change
                    location.hash = '#'+ encodeURI(path); //used encodeURI instead of encodeURIComponent to preserve '?', '/', '#'. Fixes Safari bug [issue #8]
                }
            },

            /**
             * Set Hash value without keeping previous hash on the history record.
             * Similar to calling `location.replace("#/hash")` but will also work on IE6-7.
             * @param {...string} path    Hash value without '#'. Hasher will join
             * path segments using `hasher.separator` and prepend/append hash value
             * with `hasher.appendHash` and `hasher.prependHash`
             * @example hasher.replaceHash('lorem', 'ipsum', 'dolor') -> '#/lorem/ipsum/dolor'
             */
            replaceHash : function(path){
                path = _makePath.apply(null, arguments);
                if(path !== _hash){
                    _registerChange(path, true);
                    location.replace('#'+ encodeURI(path));
                }
            },

            /**
             * @return {string} Hash value without '#', `hasher.appendHash` and `hasher.prependHash`.
             */
            getHash : function(){
                //didn't used actual value of the `location.hash` to avoid breaking the application in case `location.hash` isn't available and also because value should always be synched.
                return _trimHash(_hash);
            },

            /**
             * @return {Array.<string>} Hash value split into an Array.
             */
            getHashAsArray : function(){
                return hasher.getHash().split(hasher.separator);
            },

            /**
             * Removes all event listeners, stops hasher and destroy hasher object.
             * - IMPORTANT: hasher won't work after calling this method, hasher Object will be deleted.
             */
            dispose : function(){
                hasher.stop();
                this.off('hashinitialized');
                this.off('hashstopped');
                this.off('hashchange');
                _frame = hasher = window.hasher = null;
            },

            /**
             * @return {string} A string representation of the object.
             */
            toString : function(){
                return '[hasher version="'+ hasher.VERSION +'" hash="'+ hasher.getHash() +'"]';
            }

        };

        
        //hasher.initialized.memorize = true; //see #33

        return hasher;

    }(window));;