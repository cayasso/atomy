/*!
 * atomy - v0.1.5 -  6/10/2012
 *
 * https://github.com/cayasso/atomy
 * Copyright (c) 2012 Jonathan Brumley <cayasso@gmail.com>
 * Dual licensed under the MIT and GPL licenses.
 * Credits: Jonathan Brumley, John Resig, Jeremy Ashkenas
 */

(function (document, $, undefined) {

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

		// Create quick reference variables for speed access to core prototypes.
		// Function test
		fnTest = /xyz/.test(function () {
			xyz;
		}) ? /\b_super\b/ : /.*/;
			
	if (typeof exports !== 'undefined') {
		Atomy = exports;
	} else {
		Atomy = root.Atomy = {};
	}

	// Current version
	Atomy.VERSION = '0.1.4';

	Atomy.enableGlobals = true;

	Atomy.enableTestMode = false;

	Atomy.ajaxProvider = 'superagent';

	// Set underscore and superagent
	var _ = root._, superagent = root.superagent;
	if (!_ && (typeof require !== 'undefined')) { _ = require('underscore'); }
	if (!superagent && (typeof require !== 'undefined')) { superagent = require('superagent'); }

	/**
	* Simple JavaScript Inheritance adapted from John Resig
	* http://ejohn.org/blog/simple-javascript-inheritance/
	* because its a very clean and nice code for inheritance
	* license MIT Licensed.
	* class This is the Base Class implementation, its just a class constructor,
	* its the base of the entire model app.
	*/
	var Class = function () {};

	Class.instances = {};

	Class.setup = function () {
		return arguments.length && arguments || [];
	};

	Class.extend = function extend (className, klass, proto) {
		var prototype, args, _superclass = this, _super = this.prototype, ns, namespace, parts;
		if (!_.isString(className)) {
			proto = klass;
			klass = className;
			className = null;
		}
		if (!proto) {
			proto = klass;
			klass = null;
		}

		/**if (className) { //console.log(className);
				

				console.log(className, parts, ns, namespace);
		}*/

		initializing = true;
		prototype = new this();
		initializing = false;
		function setProps(props, to, obj) {
			var key;
			for (key in props) {
				to[key] = _.isFunction(props[key]) &&
				_.isFunction(obj[key]) &&
				fnTest.test(props[key]) ?
				(function (key, fn) {
					return function () {
						var tmp = this._super, ret;
						this._super = obj[key];
						ret = fn.apply(this, arguments);
						this._super = tmp;
						return ret;
					};
				})(key, props[key]) : props[key];
			}
		}
		setProps(proto || {}, prototype, _super);
		function __Class__ (args) {
			if (this instanceof __Class__) {
				// All construction is actually done in the setup method
				if (!initializing && _.isFunction(this.setup)) {
					this._class = this.constructor;
					this._className = className;
					this.constructor._name = className.toLowerCase();
					return this.instance.apply(this, (args && _.isArguments(args) && __Class__) ? args : arguments);
				}
			} else {
				return new __Class__(arguments);
			}
		}

		// Populate our constructed prototype object
		__Class__.prototype = prototype;
		__Class__.prototype.constructor = __Class__;
		__Class__.prototype.supperclass = _superclass;
		__Class__.prototype.instance = function () {
			var args;
			if (this.setup) {
				args = this.setup.apply(this, arguments);
			}
			if (this.init) {
				this.init.apply(this, _.isArray(args) ? args : arguments);
			}
			return this;
		};

		for (var n in this) {
			if (hasOwn.call(this, n) && n !== 'prototype') {
				__Class__[n] = this[n];
			}
		}
		setProps(klass, __Class__, _superclass);

		// And make this class extendable
		__Class__.extend = extend;

		if (className) {
				var _className = className;
				parts = className.split(/\./);
				className = parts.pop();
				
				/*ns = _.getObject(parts.join('.'), true);
				namespace = ns;*/
			
			//__Class__.ns = namespace;
			__Class__.className = className;
			__Class__._name = className.toLowerCase();


			if (instances[className] && !Atomy.enableTestMode) {
				throw new Error('Class name "' + className + '" already exist, try another name');
			}
			instances[className] = __Class__;
			if (Atomy.enableGlobals && !Atomy.enableTestMode) {	
				_.setObject(_className, __Class__);
			}
		} else {
			throw new Error('Class name is required please provide one');
		}
		(_superclass.extended) && _superclass.extended(Class);
		args = __Class__.setup.apply(__Class__, [_superclass].concat(arguments));
		if (__Class__.init) {
			__Class__.init.apply(__Class__, args || [_superclass].concat(arguments));
		}

		// Return the class
		return __Class__;
	};
	
	Atomy.Class = Class;

	_.mixin({

		cid: function () {
			return _.uniqueId('C');
			//return letter || 'C' + idCounter++;
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
			
			function fn(q, i) {
				var o = obj[i];
				count += 1;
				if (_.isNumber(o)) {
					if (o === q) { matched += 1; }
				} else if (_.isString(o)) {
					if (o && o.match(new RegExp(q, "i")) !== null) { matched += 1; }
				} else if (o == q) {
					matched += 1;
				}
			}
			this.each(query, fn);
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
		},

		setObject: function(name, value, context) {
			var parts = name.split('.'), prop = parts.pop(),
				obj = _.getObject( parts, true, context );
			return obj && typeof obj === 'object' && prop ? (obj[prop] = value) : undefined;
		},

		getObject: function( parts, create, obj ) {
			var p;
			if (_.isString(parts) ) {
				parts = parts.split('.');
			}
			if (!_.isBoolean(create)) {
				obj = create;
				create = undefined;
			}
			obj = obj || root;
			while ( obj && parts.length ) {
				p = parts.shift();
				if ( obj[p] === undefined && create ) {
					obj[p] = {};
				}
				obj = obj[p];
			}
			return obj;
		},

		exists: function () {
			return _.getObject(name, context) !== undefined;
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

		return function fn () {
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

	Atomy.Model = Atomy.Class.extend('Atomy.__Model__',

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
		init: function () {},
				
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
			var key, val; model = model || null;
			if (_.isHash(id)) {
				fn = data;
				data = id;
				id = data[this.idAttribute];
			}
			if (model) {
				for (key in data) {
					val = data[key];
					if (typeof model._.data !== 'undefined') {
						(model._.data[key] !== val) && (data[key] = val);
					}
				}
			}

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
				url: this._getURL(o.id, o),
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
					return superagent(req.type, req.url)
					.type( !fakeJSON ? req.dataType : 'form-data')
					.send(req.data).end(req.success);
				},
				'$': function () {					
					req.beforeSend = function (xhr) {					
						fakeJSON && xhr.setRequestHeader('X-HTTP-Method-Override', self._methods[action]);
					}
					return $.ajax(req);
				}				
			}[provider]();
		},

		records: function () {
			return DB[this._name];
		},

		toJSON: function () {
			var records = this.records(), result = {};
			if (records) {
				_.each(records, function (record, id) {
					result[id] = record.toJSON();
				})
			}
			return result;
		},

		toArray: function () {
			var records = this.records(), result = [];
			if (records) {
				_.each(records, function (record) {
					result.push(record.toJSON());
				})
			}
			return result;
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
		_callback: function (o, fn, res, text, xhr) {
			var response = {},
				isSupA = (this.ajaxProvider === 'superagent'),
				hasBody = (isSupA && res && (typeof res.body !== 'undefined')),
				isError = (text === 'error'),
				doc = hasBody ? res.body : res;	
			(hasBody) && (response = res);
			response.doc = !isError ? (o.model ? _.extend(o.model, doc) : this._toModel(doc)) : {};
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
		    res.accepted = 200 == status;
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
				_.isUndefined(this.connection.ext) ? '' : '.'+this.connection.ext
			].join('');
		},

		_getHost: function () {
			return [location.protocol,'//',location.hostname,(location.port ? ':'+location.port: ''),'/'].join('');
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
		setup: function (data, options) {
			var id = this.idAttribute = this._class.idAttribute;
			this._escapedFields = {};			
			(this._class.schema.indexOf(id) === -1) && this._class.schema.push(id);
			this._ = {data:{}};
			this.connection = this._class.connection;
			this._isNew = true;
			this._name = this._class._name;			
			data && this._updateFields('create', data);
			(!this[id]) && (this[id] = _.cid());
			return arguments;
		},

		init: function () {
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

		set: function (data) {
			this._updateFields('update', data);
			return this;
		},

		clone: function () {
			return _.clone(this);
		},

		clear: function () {
			var schema = this._class.schema, key, before, changed = before = {};
			if (schema) {
				for (var i = 0, len = schema.length; i < len; i++) {
					key = schema[i];
					if (typeof this[key] !== 'undefined') {
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
				if (key !== 'undefined' || typeof this[key] !== 'undefined') {
					obj[key] = this[key];
				}
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
				if (typeof this[key] !== 'undefined' && !_.isEqual(this[key], this._.data[key])) {
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
					if (typeof data[key] !== 'undefined') {
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
			if (typeof oldObj === 'undefined') { return null; }
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
	
	// Cached regex to split keys for `delegate`.
  	var eventMatcherReg = /^(\S+)\s*(.*)$/;

	Atomy.View = Atomy.Class.extend('Atomy.__View__', 

	/**
     * Static methods
     */
	{				
		template: '',

		tag: 'div',

		events: {},

		interpolate: null,

		$: function(selector) {
	      return this.$el.find(selector);
	    },

		setup: function (options, params) {

			var el = options.el;
			var model = options.model;
			var attr = options.attr;
			var tag, model, html = '';

			if (!el instanceof $) {
				attr = el;
				el = null; 
			}

			if (el instanceof Atomy.Model) {
				model = el;
				el = null;
				attr = {};
			}

			if (attr instanceof Atomy.Model) {
				model = attr;
				attr = {};
			}

			el = el || this.el;
			attr = attr || {};

			if (_.isString(el)) {
				tag = el;
				el = null;
			}

			if (attr.html) {
				html = attr.html;
				delete attr.html;
			}
			(this.id && !attr.id) && (attr.id = this.id);

			this.attr = attr;
			this.tag = tag || this.tag;

			el = (!el) ? this.create(this.tag, html) : el;
			el  = this.setAttr(el, attr);

			this.setElement(el, false);
						
			if (_.isArray(model)) {
				this.models = model;
			} else {
				this.model = model || this.model || {};
			}

			this.cid = _.uniqueId('view_');

			if (this.interpolate) {
				_.templateSettings = { interpolate: this.interpolate };
			}
			this.elements && this.refreshElements();
			this.delegateEvents();
			return arguments || [];
		},

		render: function () {			
			return this;
		},

		remove: function() {
	      	this.$el.remove();
	      	return this;
	    },

		create: function (tag, html) {
			var el = document.createElement(tag);	
			html && $(el).html(html);			
			return el;
		},

		setAttr: function (el, attr) {
			attr && _.isHash(attr) && $(el).attr(attr);
			return el;
		},

		refreshElements: function () {
			_.each(this.elements, function (val, key) {
				if (_.isString(key)) {
					this[val] = this.$(key);
				}
			}, this);
		},

		setElement: function (el, bind) {
			if (this.$el) this.undelegateEvents();
			this.$el = (el instanceof $) ? el : $(el);
			this.el = this.$el[0];
			if (bind !== false) this.delegateEvents();
			return this;
		},

		delegateEvents: function (event) { 
			var method, fn, self = this;
			this.undelegateEvents();
			for (var key in this.events) { 
				fn = this.events[key]; 
				if (_.isString(fn)) { 		
					if (!(fn = this[fn])) {
						throw new Error('Method "' + fn + '" does not exist');
					}
				}
				if (_.isFunction(fn)) { 
					var match = key.match(eventMatcherReg);
					var ev = match[1], selector = match[2];
					fn = _.bind(fn, this);
					ev += '.delegateEvents' + this.cid;				
					if (selector === '') { 
					  this.$el.on(ev, fn);
					} else { 
					  this.$el.delegate(selector, ev, fn);
					}
				}
			}
            return this;
        },

		undelegateEvents: function () { 
			this.$el.off('.delegateEvents' + this.cid);
		}
	});

	var isIE = /msie [\w.]+/,
		routeStripper = /^[#\/]/,
    	historyStatus = false,
    	docMode = document.documentMode,
    	oldIE = (isIE.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7)),
    	loc = root.location,
    	oldHash = '';

	Atomy.Router = Atomy.Class.extend('Atomy.__Router__', 
    
    {

    	_ids: {},
    	_routes: {},

    	defaults: {
            root    : '',
            interval: 50,
            history : false,
            pushState: false,
            fallback: true,
            hashbang: false,
            listen  : true,
            ignoreInitialHash: false
        },

        setup: function (o) {
            // TO DO => Fix extend
            o = o || this.options || {};
            o = this.options = _.defaults(this.defaults, o);            
            this.map(this.routes);
            this._hashbang = o.hashbang;
            this._fallback = o.fallback;
            this._hasPushState = !!(root.history && root.history.pushState); 
            this._event = null;              
            o.listen && this.listen();
            return arguments;                 
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
                    	self._event = e;

                        self._check(hash);
                        oldHash = hash;
                    }
                };
            if (this.options.pushState && this._hasPushState) {   
                root.onpopstate = fn;
            } else {
                if (this._fallback) { 
                    if ('onhashchange' in root && !oldIE) {             	
                        root.onhashchange = fn; 
                    } else {
                        this._intervalTimer = setInterval(fn, this.options.interval);
                    }
                }
            }

            if (!this.options.ignoreInitialHash) {
            	this._check(this.fragment());
        	}
        },

        fragment: function (fragment) {
            if (!fragment) {
            	return fragment = (this.options.pushState && this._hasPushState) ? loc.pathname : this.hash();
            }

            // need to fix
              	if (!fragment.indexOf(this.options.root)) {
	            	fragment = fragment.substr(this.options.root.length);
	            }
            
            
            console.log('FRAGMENT', fragment, fragment.replace(routeStripper, ''));
      		return fragment.replace(routeStripper, '');
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
            	if (!route) return this;

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
            options && options.trigger && this._check(fragment);
            return this;
        },
        
        redirect: function (page) {
        	window.location = page;
        },

        _pushState: function (fragment) {
            if (this.options.pushState && this._hasPushState) {
                history.pushState(null, null, fragment);
            } else {
                if (this._fallback) {
                    loc.hash = ['#', (this._hashbang ? '!' : ''), fragment].join('');
                }
            }
        },

        _check: function (fragment) {
            var path, fn;
            for (path in this._routes) {
            	if (hasOwn.call(this._routes, path)) {
                	fn = this._routes[path], _.isString(fn) && (fn = this[fn]);
                	if (this._run(path, fragment, fn)) {   return; }
            	}
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
                ( _.isString(fn) && this[fn] || fn).call(this, params.obj, params);
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
                return [(optional ? '' : slash), '(?:',
                (optional ? slash : ''),
                (format || ''), (capture || (format && '([^/.]+?)' || '([^/]+?)')), ')',
                (optional || '')].join('');
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
            var i, len, obj = { path: values[0], names: names, values: values, obj: {} };            
            if (values) {
            	for (i = 1, len = values.length; i < len; i++) {
                	obj.obj[names[i-1].name] = values[i];
            	}
        	}
            return obj;
        }     
    });

	Atomy.List.call(Atomy.Model);
	Atomy.Events.call(Atomy.Model);
	Atomy.Events.call(Atomy.View.prototype);
	Atomy.Events.call(Atomy.Model.prototype);

	return Atomy;

}).call(this, document, window.jQuery || window.Zepto || undefined);
