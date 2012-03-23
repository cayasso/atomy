/*!
 * atomy - v0.1.4 -  3/22/2012
 *
 * https://github.com/cayasso/atomy
 * Copyright (c) 2012 Jonathan Brumley <cayasso@gmail.com>
 * Dual licensed under the MIT and GPL licenses.
 * Credits: Jonathan Brumley, John Resig, Jeremy Ashkenas
 */

(function (window, document, undefined) {

	"use strict";
	
	// Constants
	var root = this,
		Atomy,
		DB = {},
		initializing = false,
		instances = {},

		// Quick reference to speed access to core prototypes.
		slice = Array.prototype.slice,
		toString = Object.prototype.toString,
		hasOwn = Object.prototype.hasOwnProperty,
		idCounter = 0,

		// Create quick reference variables for speed access to core prototypes.
		// Function test
		fnTest = /xyz/.test(function () {
			xyz;
		}) ? /\b_super\b/ : /.*/,

		/**
		* Simple JavaScript Inheritance adapted from John Resig
		* http://ejohn.org/blog/simple-javascript-inheritance/
		* because its a very clean and nice code for inheritance
		* license MIT Licensed.
		* class This is the Base Class implementation, its just a class constructor,
		* its the base of the entire model app.
		*/
		Class = function () {};

	if (typeof exports !== 'undefined') {
		Atomy = exports;
	} else {
		Atomy = root.Atomy = {};
	}

	// Current version
	Atomy.VERSION = '0.1.4';

	// Set underscore
	var _ = root._, request = superagent;
	if (!_ && (typeof require !== 'undefined')) { _ = require('underscore'); }
	if (!request && (typeof require !== 'undefined')) { request = require('superagent'); }

	Class.instances = {};
	Class.extend = function extend(className, klass, proto) {
		var prototype,
			_superclass = this,
			_super = this.prototype;
		if (typeof className !== 'string') {
			proto = klass;
			klass = className;
			className = null;
		}
		if (!proto) {
			proto = klass;
			klass = null;
		}
		initializing = true;
		prototype = new this();
		initializing = false;
		function setProps(props, instance, sup) {
			var name;
			for (name in props) {
				instance[name] = typeof props[name] === 'function' &&
				typeof sup[name] === 'function' &&
				fnTest.test(props[name]) ?
				(function (name, fn) {
					return function () {
						var tmp = this._super, ret;
						this._super = sup[name];
						ret = fn.apply(this, arguments);
						this._super = tmp;
						return ret;
					};
				})(name, props[name]) : props[name];
			}
			return instance;
		}
		prototype = setProps(proto, prototype, _super);
		function Class(args) {
			if (this instanceof Class) {
				// All construction is actually done in the init method
				if (!initializing && typeof this.init === 'function') {
					this._className = className;
					this._class = this.constructor;
					this.constructor._name = className.toLowerCase();
					return this.init.apply(this, (args && Class) ? args : arguments);
				}
			} else {
				return new Class(arguments);
			}
		}
		// Populate our constructed prototype object
		Class.prototype = prototype;
		Class.prototype.constructor = Class;
		Class.prototype.supperclass = _superclass;

		for (var n in this) {
			if (hasOwn.call(this, n) && n !== 'prototype') {
				Class[n] = this[n];
			}
		}

		Class = setProps(klass, Class, _superclass);

		// And make this class extendable
		Class.extend = extend;

		if (className) {
			Class.className = className;
			Class._name = className.toLowerCase();
		}

		(_superclass.extended) && _superclass.extended(Class);
		instances[className.toLowerCase()] = Class;
		// Return the class
		return Class;
	};

	Atomy.Class = Class;

	_.mixin({

		cid: function (letter) {
			return letter || 'C' + idCounter++;
		},

		/**
		* Match a single object with search criteria.
		* @hide
		* @param {Object Literal} obj Object to search in.
		* @param {Object} query
		* @return {Object}
		*/
		isMatch: function (obj, query) {
			var count = 0, matched = 0;
			this.each(query, function (q, i) {
				var o = obj[i];
				count += 1;
				if (_.isNumber(o)) {
					if (o === q) { matched += 1; }
				} else if (_.isString(o)) {
					if (o && o.match(new RegExp(q, "i")) !== null) { matched += 1; }
				} else if (o == q) {
					matched += 1;
				}
			});
			return (matched === count);
		},

		// checks if the given value is a hash-like object
		isHash: function (obj) {
			return '[object Object]' === toString.call(obj);
		},

		curry: function (fn, scope) {
			var args = slice.call(arguments, 2);
			return function () {
				fn.apply(scope || this, args.concat(slice.call(arguments, 0)));
			};
		},

		extend: function (target, source, dontOverwrite) {
			var src = source || {}, key;
			for (key in src) {
				if (!dontOverwrite || !hasOwn.call(target, key)) {
					target[key] = src[key];
				}
			}
			return target;
		},

		clone: function (obj) {
			if (Object.create) {
				return Object.create(obj);
			}
			function Clone() {}
			Clone.prototype = obj;
			var c = new Clone();
			c.constructor = Clone;
			return c;
		}
	});

	Atomy.Events = (function (){

		// barrowed from backbone
		function on (events, callback, context) {
			events = events.split(/\s+/);
			var ev, calls = this._callbacks || (this._callbacks = {});
			while (ev = events.shift()) {
				var list  = calls[ev] || (calls[ev] = {}),
					tail = list.tail || (list.tail = list.next = {});
				tail.callback = callback;
				tail.context = context;
				list.tail = tail.next = {};
			}
			return this;
		}

		// barrowed from backbone
		function off (events, callback, context) {
			var ev, calls, node;
			if (!events) {
				delete this._callbacks;
			} else if (calls = this._callbacks) {
				events = events.split(/\s+/);
				while (ev = events.shift()) {
					node = calls[ev];
					delete calls[ev];
					if (!callback || !node) { continue; }
					while ((node = node.next) && node.next) {
						if (node.callback === callback &&
						(!context || node.context === context)) { continue; }
						this.on(ev, node.callback, node.context);
					}
				}
			}
			return this;
		}

		// barrowed from backbone
		function trigger (events) {
			var event, node, calls, tail, args, all, rest;
			if (!(calls = this._callbacks)) { return this; }
			all = calls['all'];
			(events = events.split(/\s+/)).push(null);
			while (event = events.shift()) {
				if (all) { events.push({next: all.next, tail: all.tail, event: event}); }
				if (!(node = calls[event])) { continue; }
				events.push({next: node.next, tail: node.tail});
			}
			rest = slice.call(arguments, 1);
			while (node = events.pop()) {
				tail = node.tail;
				args = node.event ? [node.event].concat(rest) : rest;
				while ((node = node.next) !== tail) {
					node.callback.apply(node.context || this, args);
				}
			}
			return this;
		}

		return function () {
			this.on = on;
			this.off = off;
			this.trigger = trigger;
			return this;
		};

	}());

	Atomy.List = (function () {

		/**
		* @function id
		* Get a model from a collection by `id`.
		*
		*      // Get reminder with id 123
		*      goal.reminders.id(123);
		*
		* @param {Number} id The model id to search for
		* @return {Object}
		*/
		function id (n) {
			return DB[this._name][n] || null;
		}
		
		/**
		* @function index
		* Get a model from a collection by `index`.
		*
		*      // Get reminder with index 3
		*      goal.reminders.idnex(3);
		*
		* @param {Number} index The model index to search for
		* @return {Object}
		*/
		function index (num) {
			var i = 0, records = DB[this._name];
			for (var key in records) {
				if (hasOwn.call(records, key) && i++ === num) {
					return records[key];
				}
			}
		}

		/**
		* @function first
		* Get the first model on a collection.
		*
		*      // Get the first model in reminders collection
		*      goal.reminders.first();
		*
		* @return {Object}
		*/
		function first () {
			return this.index(0);
		}

		/**
		* @function last
		* Get the last model in a collection.
		*
		*      // Get the last model in reminders collection
		*      goal.reminders.last();
		*
		* @return {Object}
		*/
		function last () {
			var records = DB[this._name], count = _.size(records);
			return (count > 0) ? this.index(count - 1) : false;
		}

		return function () {
			this.first = first;
			this.last = last;
			this.iD = id;
			this.index = index;
			return this;
		};

	})();

	Atomy.Model = Atomy.Class.extend('Model',

	/**
	* Static methods
	*/
	{
		_methods: {
			create: 'POST',
			read:   'GET',
			update: 'PUT',
			destroy:'DELETE'
		},

		ajaxProvider: 'superagent',
		
		fakeJSON: false,
		
		fakeHTTP: false,

		_getMethod: function (verb) {			
			if (this.fakeHTTP) {				
				if (verb === 'update' || verb === 'destroy') { return 'POST'};
			}
			return this._methods[verb];
		},

		idAttribute: 'id',
		schema: [],
		connection: {},
		collection: {},
		errors: {},
		initialize: function () {},
				
		find: function (query, fn) { 
			var id;
			if (!_.isHash(query)) {
				id = (query !== 'all') ? query : null;
				query = {};
			}
			return this._crud({
				id: id,
				data: query,
				action: 'read'
			}, fn);
		},

		/**
		 * @function findOnClient
		 * Find objects based on search criteria but on the client local DB.
		 * @hide
		 * @param {Object} options Options to use for finding
		 * @param {Function} fn Callback function
		 * @return {Void}
		 */
		findOnClient: function (query, fn) {
			(!_.isHash(query)) && (query = {id: query});
			var result = [], count = 0, index, key, records = this.records();
			for (key in query) { count += 1; }
			if (_.isEmpty(records)) {
				_.isFunction(fn) && fn([], index);
				return result;
			} else if (query.id === 'all') {
				result = records;
			} else {
				if (!_.isEmpty(query)) {
					for (key in records) {
						var row = records[key];
						if (_.isMatch(row, query)) {
							result.push(row);
							if (count === 1 && !_.isUndefined(query.id)) {
								index = key;
								break;
							}
						}
					}
				} else {
					throw new Error('Atomy.findOnClient: Missing query parameter');
				}
			}
			_.isFunction(fn) && fn(result, index);
			return result;
		},

		create: function (data, fn) {
			return this(data).save(fn);
		},

		/**
		 * @function update
		 * @param {Number} id The id of the model to delete
		 * @param {Object} data the data with updates
		 * @param {optional:Function} fn Callback function
		 * @param {optional:Object} model Record instance but only for internal use
		 * @return {Object}
		 */
		update: function (id, data, fn, model) {
			var key, val; model = this.model || null;
			if (_.isHash(id)) {
				fn = data;
				data = id;
				id = data[this.idAttribute];
			}
			if (model) {
				for (key in data) {
					val = data[key];
					if (model._.data) {
						(model._.data[key] !== val) && (data[key] = val);
					}
				}
			}

			console.log('UPDATE ====> ', this.model);


			return this._crud({
				data: data,
				action: 'update',
				model: model,
				id: id
			}, fn);
		},

		/**
		 * @function destroy
		 * Delete an existing model from the server database.
		 * @param {Number} id the id of the model to delete
		 * @param {optional:Function} fn The callback function
		 * @param {optional:Object} model Record instance but only for internal use
		 * @return {Object}
		 */
		destroy: function (id, fn, model) {
			//(model) && (model._ckey) && Collection.remove(model._ckey);
			return this._crud({
				action: 'destroy',
				model: model,
				id: id
			}, fn);
		},

		sync: function (o, fn) {
			return this.request({
				url: this._getURL(o.id),
				type: this._getMethod(o.action),
				data: !this.fakeHTTP ? (o.data || {}) : _.extend(o.data, {_method: this._getMethod(o.action)}, true),			
				success: _.curry(this._callback, this, o, fn),		
				error: _.curry(this._callback, this, {}, fn),
				dataType: 'json'
			}, this.fakeJSON, o.action);
		},

		request: function (req, fakeJSON, action) {
			var self = this,
				provider = ({ 
					zepto: '$', 
					jquery: '$', 
					superagent: 'superagent'
				})[this.ajaxProvider];
			if (!provider) { throw new Error('Atomy.request: Invalid Ajax provider'); }
			return {
				'superagent': function () {
					return request(req.type, req.url)
					.type( !fakeJSON ? req.dataType : 'form-data')
					.send(req.data).end(req.success);
				},
				'$': function () {					
					req.beforeSend = function(xhr) {					
						fakeJSON && xhr.setRequestHeader('X-HTTP-Method-Override', self._methods[action]);
					}
					return $.ajax(req);
				}				
			}[provider]();
		},

		records: function () {
			return DB[this._name];
		},

		clearRecords: function () {
			delete DB[this._name];
			return DB[this._name] = {};
		},

		/**
		 * @function
		 * Handle a CRUD request, based on the option provided it will
		 * call the right Ajax request and pass the server response to the
		 * callback handler.
		 * @hide
		 * @param {Object} options The request options
		 * @param {Boolean} fn The callback function to execute
		 * @return {Void}
		 */
		_crud: function (o, fn) { 
			var req, errors;
			if (o.model && o.action === 'update') { 
				var diff = {};
				o.model._updateFields('', o.data);
				o.data = diff = o.model._diff(o.model._.data); 
				o.model._updateFields('update', diff);
				o.model.trigger('update', o.model, diff);
			}
			if (o.model && this.validate && (errors = o.model._validate())) {
				var err = { errors: errors, error: true, ok: false };
				o.model.trigger('error', o.model, errors);
				return _.isFunction(fn) && fn.call(this, err) || err;
			}			
			return this.sync(o, fn);
		},

		/**
		 * @function
		 * Execute callback functions.
		 * @hide
		 * @param {Object} options Options for the callback
		 * @param {Function} fn The callback function to execute
		 * @return {Mixed}
		 */
		_callback: function (o, fn, res, text, xhr) {  console.log('_CALLBACK', res);
			var response = {},
				isSupA = (this.ajaxProvider === 'superagent'),
				hasBody = (isSupA && res && res.body),
				isError = (text === 'error'),
				_res = hasBody ? res.body : res;			
			o.model && hasBody && (response = res);
			response.doc = !isError ? (o.model ? _.extend(o.model, _res) : this._toModel(_res)) : {};
			if (hasBody) { delete res.body; }		
			this._sync(o.action, response.doc, o);
			return _.isFunction(fn) && 
			fn.call(this, this._status(response, isSupA || (isError ? xhr.status : res.status))) || response;
		},

		/**
		 * @function
		 * Sync local data with action results, including find, update, save & delete.
		 * @hide
		 * @param {String} action The action CREATE, UPDATE, READ_ALL, READ_ONE, etc
		 * @param {Object} model The model object to sync local data with
		 * @param {Object} options Any additional option to pass
		 * @return {Mixed}
		 */
		_sync: function (action, model, o) {
			var name = this._name, records = (_.isArray(model)) && model, id = o[this.idAttribute] || model[this.idAttribute];
			DB[name] = DB[name] || {};
			if (records) {
				if (action === 'read') {
					_.each(records, function (rec) {
						DB[name][rec[rec.idAttribute]] = rec;
					});
				}
			} else {
				if (action === 'destroy') {
					if (DB[name][id]) {
						delete DB[name][id];
					}
					model.trigger(action, model);
				} else {
					if (this._getMethod(o.action)) {
						DB[name][model[this.idAttribute]] = model;
					}
				}
			}
		},

		/**
		 * @function
		 * Check and bind response status codes.
		 * @hide		 
		 * @param {Object} res Response object
		 * @param {Number} code Status code
		 * @param {optional:String} message Message to bind to response
		 * @return {Object}
		 */
		_status: function (res, status) {
			if (this.ajaxProvider === 'superagent') { return res; }
			var type = status / 100 | 0;
		    res.status = status;
		    res.statusType = type;
		    res.info = 1 == type;
		    res.ok = 2 == type;
		    res.clientError = 4 == type;
		    res.serverError = 5 == type;
		    res.error = 4 == type || 5 == type;
		    res.accepted = 202 == status;
		    res.noContent = 204 == status || 1223 == status;
		    res.badRequest = 400 == status;
		    res.unauthorized = 401 == status;
		    res.notAcceptable = 406 == status;
		    res.notFound = 404 == status;
			return res;
		},

		/**
		 * @function
		 * Get the connection url as it is from the model setup.
		 * @hide
		 * @return {String}
		 */
		_getURL: function (id) {
			return [
				this.connection.host || this._getHost(),
				this.connection.key, id && ('/' + id) || '',
				_.isUndefined(this.connection.ext) ? '' : this.connection.ext
			].join('');
		},

		_getHost: function () {
			return location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '')+'/';
		},

		/**
		 * @function
		 * Convert data to model object.
		 * @hide
		 * @param {Object} data The data for the model
		 * @return {Object}
		 */
		_toModel: function (data) {
			var records = [], i, l;
			if (_.isArray(data)) {
				for (i = 0, l = data.length; i < l; i += 1) {
					records[i] = this._toModel(data[i]);
				}
			} else {
				records = this(data)._loadServerData();
				records._isNew = false;
			}
			return records;
		}
	},

	/**
	 * Prototype methods
	 */
	{
		init: function (data, options) {
			var id = this.idAttribute = this._class.idAttribute;
			this._escapedFields = {};			
			(this._class.schema.indexOf(id) === -1) && this._class.schema.push(id);
			this._ = {data:{}};
			this.connection = this._class.connection;
			this._isNew = true;
			this._name = this._class._name;
			this._class.initialize.call(this, options);
			data && this._updateFields('create', data);
			(!this[id]) && (this[id] = _.cid());
			this._class.model = this;					
			return this;
		},

		save: function (fn) {
			return this[this.isNew() ? 'create' : 'update'](fn, null, this.trigger('save', this)) ;
		},

		create: function (fn) {
			this._loadServerData();
			this._isNew = false;
			return this._class._crud({				
				action: 'create',
				model: this,
				data: this._.data
			}, fn);
		},

		update: function (data, fn) {
			_.isFunction(data) && (fn = data);
			return this._class.update(this[this.idAttribute], data, fn, this);
		},

		destroy: function (fn) {
			return this._class.destroy(this[this.idAttribute], fn, this);
		},

		clone: function () {
			return _.clone(this);
		},

		clear: function () {
			var schema = this._class.schema, key, before, changed = before = {};
			if (schema) {
				for (var i = 0, len = schema.length; i < len; i++) {
					key = schema[i];
					if (this[key] !== undefined) {
						before[key] = this[key];
						changed[key] = undefined;
						delete this[key];
					}
				}
			}
			if (!_.isEmpty(changed)) {
				this.trigger('change', this, before, changed);
			}
			return this;
		},

		/**
		 * @function isNew
		 * @return {Boolean}
		 */
		isNew: function () {
			return this._isNew;
		},
		
		/**
		 * @function isValid
		 * @return {Boolean}
		 */
		isValid: function () {
			return !this._validate();
		},	
		
		/**
		 * @function toJSON
		 * @return {Object}
		 */
		toJSON: function (obj) {
			var key, schema = this._class.schema, i, len;
			obj || (obj = {});
			for (i = 0, len = schema.length; i < len; i++) {
				key = schema[i];
				obj[key] = this[key];
			}
			return obj;
		},

		escape: function (name) {
			return _.escape(this[name] === null ? '' : '' + this[name]);
		},

		/**
		 * @function validate
		 * @return {Object}
		 */
		_validate: function () {
			var error, validate = this._class.validate;
			if (error = validate && validate.call(this)) {
				this.trigger('error', this, error);
			}
			return error;
		},

		/**
		 * @function
		 * Load server data to Model._.data.
		 * @hide
		 * @param {Object} data Data to be loaded
		 * @return {Object}
		 */
		_loadServerData: function () {
			var schema = this._class.schema, i, key, len = schema.length;
			for (i = 0, len = schema.length; i < len; i++) {
				key = schema[i];
				if (this[key] !== undefined && !_.isEqual(this[key], this._.data[key])) {
					this._.data[key] = this[key];
				}
			}
			return this;
		},

		/**
		 * @function
		 * Update model fields with passed data.
		 * @hide
		 * @param {String} action
		 * @param {Object} data Passed data object
		 * @return {Object}
		 */
		 _updateFields: function (action, data) {
			var schema = this._class.schema, i, key, len = schema.length;
			if (schema && data) {
				for (i = 0; i < len; i++) {
					key = schema[i];
					if (data[key] !== undefined) {
						this[key] = data[key];
						if (action === 'update') {
							this.trigger('change:'+key, this, this[key], this._.data[key]);
							this._.data[key] = data[key];
						}
					}
				}
			}
			return this;
		},

		_diff: function (oldObj) {
			if (!oldObj) { return null; }
			var schema = this._class.schema, i, k, len, diff = {};			
			for (i = 0, len = schema.length; i < len; i++) {
				k = schema[i];
				if (this.hasOwnProperty(k)) {
					if (!(k in this)) {
					   diff[k] = undefined;
					} else if (!_.isEqual(oldObj[k], this[k])) {
						diff[k] = this[k];
					}
				}
				if (!(k in oldObj)) {
					diff[k] = this[k];
				}
			}
			return diff;
		}
	});
	
	_.each([
		'forEach', 'each', 'map', 'reduce', 'reduceRight', 'filter',
		'reject', 'every', 'any', 'include', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex',
		'toArray', 'size', 'initial', 'rest', 'shuffle', 'isEmpty', 'groupBy'],
		function(method) {
			Atomy.Model[method] = function() {
				return _[method].apply(_, [DB[this._name]]);
			};
		}
	);
	
	Atomy.View = Atomy.Class.extend('View', 

	/**
     * Static methods
     */
	{
		tag: 'div',

		className: '',

		template: _.template(),

		events: {
			'.check': function () {

			}
		}

	}, 



	/*

		var html = $(#template).html();

		var template = _.template(html);

		var elem = myView('.el').render(this.model);

		$('#dom').html(elem);

	*/


	/**
     * Prototype methods
     */
	{
		/**
			var Model = { name: 'Tom' }
			View('').render(model);

		 */

		init: function (model) {

		},

		render: function () {

		}
	})

	var isIE = /msie [\w.]+/,
    	historyStatus = false,
    	docMode = document.documentMode,
    	oldIE = (isIE.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7)),
    	loc = window.location,
    	oldHash = '';

	Atomy.Router = Atomy.Class.extend('Router', 

    /**
     * Static methods
     */
    {
        options: {
            root    : '',
            interval: 50,
            history : false,
            fallback: true,
            hashbang: true,
            listen  : true
        },
        
        routes: {}
    }, 

    /**
     * Prototype methods
     */
    {
        init: function (o) {
            // TO DO => Fix extend
            o = _.extend(Atomy.Router.options, this._class.options);
            this._ids = {};         
            this._routes = {};    
            this.map(this._class.routes);
            this._hashbang = o.hashbang;
            this._fallback = o.fallback;
            this._hasPushState = !!(window.history && window.history.pushState);                
            this._hasPushState = false;
            o.listen && this.listen();                     
        },

        /**
         * Start listening for hash changes or history
         * @return {[type]}
         */
        listen: function () {
            var self = this,                                  
                fn = function (e) {              
                    var hash = self.fragment();
                    if (hash !== oldHash) {
                        self._check(hash);
                        oldHash = hash;
                    }
                };
            if (this._hasPushState) {                    
                window.onpopstate = fn;
            } else {
                if (this._fallback) {
                    if ('onhashchange' in window && !oldIE) {
                        window.onhashchange = fn;
                    } else {
                        this._intervalTimer = setInterval(fn, this._class.options.interval);
                    }
                }
            }
        },

        fragment: function (fragment) {
            return this._hasPushState ? loc.pathname : this.hash();
        },

        hash: function(override) {
            var l = override ? override.location : loc, 
            	match = l.href.match(/#!?(.*)$/);
            return match ? match[1] : '';
        },

        map: function (route, fn) {             
            if (_.isHash(route)) {
                for (var r in route) {                        
                    this.map(r, route[r]);
                }
            } else {                    
                var p = route.split(' ');
                this._routes[p[0]] = fn;
                if (p[1]) { 
                    this._ids[p[1]] = p[0];
                }
            }
            return this;
        },

        navigate: function (fragment, options) {
            options === true && (options = { trigger: true });
            this._pushState(fragment);                
            options.trigger && this._check(fragment);
            return this;
        },
        
        _pushState: function (fragment) {
            if (this._hasPushState) {
                history.pushState(null, null, fragment);
            } else {
                if (this._fallback) {
                    loc.hash = '#' + (this._hashbang ? '!' : '') + fragment;
                }
            }
        },

        _check: function (fragment) {
            var path, fn;
            for (path in this._routes) {
                fn = this._routes[path], _.isString(fn) && (fn = this._class[fn]);
                if (this._run(path, fragment, fn)) { break; }
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
        	var names = [], params, path = this._regex(path, names).exec(hash);
            if (fn && (params = (path) ? this._params(names, path) : null)) {
                ( _.isString(fn) && this._class[fn] || fn).call(this, params.obj, params);
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
         * Create and return a params object.
         *
         * @param  {Array} names
         * @param  {Array} values
         * @return {Object}
         */
        _params: function (names, values) {
            var i, obj = { path: values[0], names: names, values: values, obj: {} };
            for (i = 1, len = values.length; i < len; i++) {
                obj.obj[names[i-1].name] = values[i];
            }
            return obj;
        }     
    });

	Atomy.List.call(Atomy.Model);
	Atomy.Events.call(Atomy.Model);
	Atomy.Events.call(Atomy.Model.prototype);

	return Atomy;

}).call(this, window, document);
