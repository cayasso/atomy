        var slice = Array.prototype.slice,
        toString = Object.prototype.toString,
        hasOwn = Object.prototype.hasOwnProperty;

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




/*
        return hasher;
    });
}(typeof define === 'function' && define.amd ? define : function (id, deps, factory) {
    window[id] = factory(window[deps[0]]);
}));*/