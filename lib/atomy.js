(function (undefined) {

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
    Atomy.VERSION = '0.1.1';

    // Set underscore
    var _ = root._, request = superagent;
    if (!_ && (typeof require !== 'undefined')) { _ = require('underscore'); }
    if (!request && (typeof require !== 'undefined')) { request = require('superagent'); }

    Class.instances = {};
    Class.extend = function (className, klass, proto) {
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
                    return this.init.apply(this, (args && args.callee) ? args : arguments);
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
        Class.extend = arguments.callee;

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
            this.getById = id;
            this.index = index;
            return this;
        };

    })();

    Atomy.Model = Atomy.Class.extend('Model',

    /**
     * Static methods
     */
    {
        methodMaps: {
            create: 'POST',
            read:   'GET',
            update: 'PUT',
            destroy:'DELETE'
        },
        idAttribute: 'id',
        schema: [],
        connection: {},
        collection: {},
        errors: {},
        initialize: function () {},
        // Model errors object
        errorMessages: {
            missingSchemaDataType: 'Missing schema data type',
            missingQueryParameter: 'Missing query parameter',
            missingModel: 'Model object is missing, please pass a model object.',
            missingBaseUrl: 'getURL: Missing baseURL or uri values in extend file',
            invalidEnum: 'Invalid listed value',
            required: 'Field is required',
            typeMismatch: 'Data type mismatch',
            invalidModelName: 'Invalid model name',
            invalidServerResponse: 'Invalid server response type, is not a JSON object',
            validationFail: 'Validation failed'
        },
                
        find: function (query, fn) {
            var id;
            if (!_.isHash(query)) {
                id = (query !== 'all') ? query : null;
                query = {};
            }
            return this._request({
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
                    throw this.errorMessages.misingQueryParameter;
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
            var _data = {};
            if (_.isHash(id)) {
                fn = data;
                data = id;
                id = data[this.idAttribute];
            }
            if (model) {
                _.each(data, function (dat, f) {
                    if (model._.data) {
                        (model._.data[f] !== dat) && (_data[f] = dat);
                    } else {
                        _data[f] = dat;
                    }
                });
                data = _data;
            }
            return this._request({
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
            return this._request({
                action: 'destroy',
                model: model,
                id: id
            }, fn);
        },

        sync: function (o, fn) {
            var req = request(this.methodMaps[o.action], this._getURL(o.id))
            .send(o.data || {})
            .end(_.curry(this._callback, this, o, fn));
            return req;
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
        _request: function (o, fn) {
            var req, errors;
            if (o.model && o.action === 'update') {
                var m = o.model, diff = {};
                m._updateFields('', o.data);
                diff = m._diff(m._.data);
                m._updateFields('update', diff);
                m.trigger('update', m, diff);
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
        _callback: function (o, fn, res) {
            if (res && res.body && !o.model) {
                (res.body = this._toModel(o.data));
            } else {
                res = { body: o.model };
            }
            this._sync(o.action, res.body, o);
            return _.isFunction(fn) && fn.call(this, res) || res;
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
                    if (this.methodMaps[action]) {
                        DB[name][model[this.idAttribute]] = model;
                    }
                }
            }
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
            var schema = this._class.schema, id = this.idAttribute = this._class.idAttribute;
            this._escapedFields = {};
            schema && !schema[id] && this._class.schema.push(id);
            this._ = {data:{}};
            this.connection = this._class.connection;
            this._isNew = true;
            this._name = this._class._name;
            this._class.initialize.call(this, options);
            data && this._updateFields('create', data);
            (!this[id]) && (this[id] = _.cid());
            //this.on('all', this._onModelEvent);
            return this;
        },

        _onModelEvent: function(ev, model, options) {
            //this.trigger(ev);
          //this.trigger.apply(this, arguments);
        },

        save: function (fn) {
            var result = this[this.isNew() ? 'create' : 'update'](fn);
            this.trigger('save', this);
            return result;
        },

        create: function (/*data, */ fn) {
            this._loadServerData();
            this._isNew = false;
            return this._class._request({
                //data: data,
                action: 'create',
                model: this
            }, fn);
        },

        update: function (data, fn) {
            _.isFunction(data) && (fn = data);// || (data = _.extend(this.toJSON(), data));
            return this._class.update(this[this.idAttribute], data, fn, this);
        },

        destroy: function (fn) {
            return this._class.destroy(this[this.idAttribute], fn, this);
        },

        clone: function () {
            return _.clone(this);
        },

        clear: function () {
            var schema, key, changed = {}, before = {}, i, len;
            if (schema = this._class.schema) {
                for (i = 0, len = schema.length; i < len; i++) {
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
            var val  = this[name];
            return _.escape(val === null ? '' : '' + val);
        },

        /**
         * @function
         * Load server data to Model._.data.
         * @hide
         * @param {Object} data Data to be loaded
         * @return {Object}
         */
        _loadServerData: function () {
            var schema = this._class.schema, i, key, len;
            if (schema) {
                for (i = 0, len = schema.length; i < len; i++) {
                    key = schema[i];
                    if (this[key] !== undefined && !_.isEqual(this[key], this._.data[key])) {
                        this._.data[key] = this[key];
                    }
                }
            }
            return this;
        },

        /**
         * @function
         * Update model fields with passed data.
         * @hide
         * @param {Object} data Passed data
         * @return {Object}
         */
         _updateFields: function (action, data) {
            var schema = this._class.schema, i, key, len;
            if (schema && data) {
                for (i = 0, len = schema.length; i < len; i++) {
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
            var schema = this._class.schema, i, k, len, diff = {};
            if (!oldObj) { return null; }
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
        'forEach', 'each', 'map', 'reduce', 'reduceRight', 'find', 'filter',
        'reject', 'every', 'any', 'include', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex',
        'toArray', 'size', 'initial', 'rest', 'shuffle', 'isEmpty', 'groupBy'],
        function(method) {
            Atomy.Model[method] = function() {
                return _[method].apply(_, [DB[this._name]]);
            };
        }
    );

    Atomy.List.call(Atomy.Model);
    Atomy.Events.call(Atomy.Model);
    Atomy.Events.call(Atomy.Model.prototype);
    return Atomy;

}).call(this);
