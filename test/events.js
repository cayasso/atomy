describe('Atomy.Events', function () {

    describe('Events: required methods', function () {
      it('should exist', function () {
        var obj = {};
        Atomy.Events.call(obj);
        expect(obj.on).to.be.ok();
        expect(obj.on).to.be.a('function');
        expect(obj.off).to.be.ok();
        expect(obj.off).to.be.a('function');
        expect(obj.emit).to.be.ok();
        expect(obj.emit).to.be.a('function');
      });
    });

    describe('Events: on and emit', function () {
      it('should increment counter by one then by five', function () {
        var obj = { counter: 0 };
        Atomy.Events.call(obj);
        obj.on('event', function () { obj.counter += 1; })
        .emit('event');
        expect(obj.counter).to.be(1);
        obj.emit('event')
        .emit('event')
        .emit('event')
        .emit('event');
        expect(obj.counter).to.be(5);
      });
    });

    describe('Events: on and emit multiple events', function () {
      it('should increment counter each time', function () {
        var obj = { counter: 0 };
        Atomy.Events.call(obj);
        obj.on('a b c', function () { obj.counter += 1; })
        .emit('a');
        expect(obj.counter).to.be(1);
        obj.emit('a b');
        expect(obj.counter).to.be(3);
        obj.emit('c');
        expect(obj.counter).to.be(4);
        obj.off('a c')
        .emit('a b c');
        expect(obj.counter).to.be(5);
      });
    });

    describe('Events: emit all for each event', function () {
        it('should emit events a and b', function () {
            var a, b, obj = { counter: 0 };
            Atomy.Events.call(obj);
            obj.on('all', function (event) {
                obj.counter++;
                if (event == 'a') a = true;
                if (event == 'b') b = true;
            });
            obj.emit('a b');
            expect(a).to.be.ok();
            expect(b).to.be.ok();
            expect(obj.counter).to.be(2);
        });
    });

    describe('Events: bind with provided context', function () {
        it('should emit assertTrue', function () {
            var obj = {}, TestClass = function () { return this; };
            TestClass.prototype.assertTrue = function (ok) {
                expect(ok).to.be.ok();
            };
            Atomy.Events.call(obj);
            obj.on('event', function () { this.assertTrue(true); }, new TestClass())
            .emit('event');
        });
    });

    describe('Events: nested emit with unbind', function () {
        it('should increment counter three times', function () {
            var obj = { counter: 0 },
                callbackA = function () { obj.counter++; obj.off('event', callbackA).emit('event'); },
                callbackB = function () { obj.counter++; };
            Atomy.Events.call(obj);
            obj.on('event', callbackA)
            .on('event', callbackB)
            .emit('event');
            expect(obj.counter).to.be(3);
        });
    });

    describe('Events: ensure callback list', function () {
        var obj = {},
            counter = 0,
            callback = function () { counter++; };
        Atomy.Events.call(obj);
        it('should not alter callback list on bind', function () {
            obj.on('event', function () { obj.on('event', callback).on('all', callback); })
            .emit('event');
            expect(counter).to.be(0);
            obj.off();
        });
        it('should not alter callback list on unbind', function () {
            obj.on('event', function () { obj.off('event', callback).off('all', callback); })
            .on('event', callback)
            .on('all', callback)
            .emit('event');
            expect(counter).to.be(2);
        });
    });

    describe('Events: off', function () {
        it('should not emit second event', function () {
            var obj = { counter: 0 };
            Atomy.Events.call(obj);
            obj.on('event', function (event) { obj.counter++; })
            .emit('event')
            .off('event')
            .emit('event');
            expect(obj.counter).to.be(1);
        });
        it('should only unbind callbackA', function () {
            var obj = { counterA: 0, counterB: 0 };
            Atomy.Events.call(obj);
            var callbackA = function () { obj.counterA++; };
            var callbackB = function () { obj.counterB++; };
            obj.on('event', callbackA)
            .on('event', callbackB)
            .emit('event')
            .off('event', callbackA)
            .emit('event');
            expect(obj.counterA).to.be(1);
            expect(obj.counterB).to.be(2);
        });
        it('should unbind a callback in the midst of it firing', function () {
            var obj = { counter: 0 },
				callback = function () { obj.counter++; obj.off('event', callback); };
            Atomy.Events.call(obj);
            obj.on('event', callback)
            .emit('event')
            .emit('event')
            .emit('event');
            expect(obj.counter).to.be(1);
        });
        it('should bind and unbind callbacks from with in themselves', function () {
            var obj = { counterA: 0, counterB: 0 },
				callbackA = function () { obj.counterA++; obj.off('event', callbackA); },
				callbackB = function () { obj.counterB++; obj.off('event', callbackB); };
            Atomy.Events.call(obj);
            obj.on('event', callbackA)
            .on('event', callbackB)
            .emit('event')
            .emit('event')
            .emit('event');
            expect(obj.counterA).to.be(1);
            expect(obj.counterB).to.be(1);
        });
    });

});