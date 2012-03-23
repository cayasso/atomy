
function sync (o, fn) {
    return this._callback(o, fn, o.data);
}

describe('Atomy.Model', function () {
	
	describe('Model: instantiation', function () {
		it('should instantiate model with attributes', function () {
			var Model = Atomy.Model.extend('Model', {
				schema: ['one', 'two']
			}, true);
			var model = Model({ one: 1, two: 2 });
			expect(model.one).to.be(1);
			expect(model.two).to.be(2);
		});
	});

	describe('Model: default attributes', function () {
		it('should set one and two as default', function () {
			var Model = Atomy.Model.extend('Model', {
				schema: ['one', 'two'],
				initialize: function () {
					this.one = 1;
					this.two = 2;
				}
			}, true);
			var model = Model();
			expect(model.one).to.be(1);
			expect(model.two).to.be(2);
		});
	});

	describe('Model: initialize()', function () {
		it('should call initialize once per instantiation', function () {
			var Model = Atomy.Model.extend('Model', {
				initialize: function () {
					expect(true).to.ok();
				}
			}, true);
			var model = Model();
		});
		it('should set attributes from initialize', function () {
			var Model = Atomy.Model.extend('Model', {
				initialize: function () {
					this.one = 1;
				}
			}, true);
			var model = Model();
			expect(model.one).to.be(1);
		});
		it('should initialize with atrributes and options', function () {
			var Model = Atomy.Model.extend('Model', {
				schema: ['title'],
				initialize: function (options) {
					this.one = options.one;
				}
			}, true);
			var model = Model({ title: 'my title'}, { one: 1 });
			expect(model.one).to.be(1);
			expect(model.title).to.be('my title');
		});
	});

	describe('Model: schema', function () {
		var Model, model;
		beforeEach(function () {
			Model = Atomy.Model.extend('Model', {
				schema: ['one', 'two'],
				sync: sync
			}, true);
			model = Model({ one: 1, two: 2, three: 3 });
		});
		it('should only instantiate model with defined schema attributes', function () {
			expect(model.one).to.be(1);
			expect(model.two).to.be(2);
			expect(model.three).to.be(undefined);
		});
		it('should only save defined attributes', function () {
			var id = model.id;
			var res = model.save();
			expect(model.one).to.be(1);
			expect(model.two).to.be(2);
			expect(model.three).to.be(undefined);
		});
		it('should have a predefined id in schema', function () {
			Model = Atomy.Model.extend('Model', {
				schema: ['id', 'two'],
				sync: sync
			}, true);
			model = Model({ id: 1, two: 2, three: 3 });
			expect(model.id).to.ok(1);
		});
	});

	describe('Model: isNew()', function () {
		var Model, model;
		beforeEach(function () {
			Model = Atomy.Model.extend('Model', {
				schema: ['one', 'two'],
				sync: sync
			}, true);
			model = Model();
		});
		it('should be new on first instantiation', function () {
			expect(model.isNew()).to.be(true);
		});
		it('should not be new after save or update', function () {
			model.save();
			expect(model.isNew()).not.to.be(true);
			expect(model.isNew()).to.be(false);
			model.two = 2;
			model.update();
			expect(model.isNew()).not.to.be(true);
			expect(model.isNew()).to.be(false);
		});
		it('should not be new after create', function () {
			model.create({ one: 1 });
			expect(model.isNew()).not.to.be(true);
			expect(model.isNew()).to.be(false);
		});
	});

	describe('Model: toJSON()', function () {
		it('should get JSON representation of the model', function () {
			var Model = Atomy.Model.extend('Model', {
				schema: ['one', 'two'],
				sync: sync
			}, true);
			var model = Model({ one: 1, two: 2, three: 3 });
			expect(model.toJSON()).to.be.eql({ one: 1, two: 2, id: model.id });
			model.save();
			expect(model.toJSON()).to.be.eql({ one: 1, two: 2, id: model.id });
		});
	});

	describe('Model: using non-default id attribute', function () {
		it('should _id should be the real id', function () {
			var Model = Atomy.Model.extend('Model', {
				idAttribute: '_id',
				schema: ['id'],
				sync: sync
			}, true);
			var model = Model({ id: 'not-real-id' });
			expect(model.id).to.be('not-real-id');
			expect(model._id).to.be.ok();
		});
	});

	describe('Model: setting attribute values', function () {
		it('should set empty string', function () {
			var Model = Atomy.Model.extend('Model', {
				schema: ['name'],
				sync: sync
			}, true);
			var model = Model({ name: '' });
			expect(model.name).to.be('');
		});
		it('should set any primitive values', function () {
			var Model = Atomy.Model.extend('Model', {
				schema: ['name', 'status', 'count'],
				sync: sync
			}, true);
			var model = Model({ name: 'Mario', status: true, count: 3 });
			expect(model.name).to.be.eql('Mario');
			expect(model.status).to.be.eql(true);
			expect(model.count).to.be.eql(3);
		});
		it('should set objecs and arrays', function () {
			var Model = Atomy.Model.extend('Model', {
				schema: ['arr', 'obj'],
				sync: sync
			}, true);
			var model = Model({ arr: [1,2,3], obj: { one: 1, '2': 2, three: 'three' }});
			expect(model.arr).to.be.eql([1,2,3]);
			expect(model.obj).to.be.eql({ one: 1, '2': 2, three: 'three' });
		});
	});

	describe('Model: escape()', function () {
		it('should return escaped values', function () {
			var Model = Atomy.Model.extend('Model', {
				schema: ['title'],
				sync: sync
			}, true);
			var model = Model({ title: 'John Doe'});
			expect(model.escape('title')).to.be('John Doe');
			model.title = 'a & b';
			expect(model.escape('title')).to.be('a &amp; b');
			model.title = 'a > b';
			expect(model.escape('title')).to.be('a &gt; b');
			model.title = 'a < b';
			expect(model.escape('title')).to.be('a &lt; b');
			model.title = 101010;
			expect(model.escape('title')).to.be('101010');
			model.title = '';
			expect(model.escape('title')).to.be('');
			model.title = '<script>alert("hi");</script>';
			expect(model.escape('title')).to.be('&lt;script&gt;alert(&quot;hi&quot;);&lt;&#x2F;script&gt;');
		});
	});

	describe('Model: clone()', function () {
		it('should have the same values', function () {
			var attrs = { 'foo': 1, 'bar': 2, 'baz': 3},
				Model = Atomy.Model.extend('Model', {
					schema: ['foo', 'bar', 'baz']
				}, true),
				model = Model(attrs),
				clone = model.clone();
			expect(clone.foo).to.be.eql(model.foo);
			expect(clone.bar).to.be.eql(model.bar);
			expect(clone.baz).to.be.eql(model.baz);
			model.foo = 2;
			expect(clone.foo).to.be.eql(model.foo);

		});
		it('should change clone but not original', function () {
			var Model = Atomy.Model.extend('Model', {
					schema: ['foo']
				}, true),
				model = Model({ 'foo': 1 }),
				clone = model.clone();
			clone.foo = 2;
			expect(clone.foo).to.be.eql(2);
			expect(model.foo).to.be.eql(1);
		});
	});
	
	describe('Model: validation', function () {
		var Model, model;
		beforeEach(function () {
			Model = Atomy.Model.extend('Model', {
				schema: ['admin'],
				validate: function () {
					if (this.admin) return "Can't change admin status";
				}
			}, true);
			model = Model({ admin: true });
		});

		it('should not be valid', function () {
			expect(model.isValid()).to.be(false);
		});
		it('should trigger error event on save', function () {
			model.on('error', function (model, err) {
				expect(err).to.be("Can't change admin status");
				expect(model.admin).to.be(model.admin);
			});
			model.save(function (res) {
				expect(res.ok).not.to.be.ok();
				expect(res.ok).to.be(false);
				expect(res.error).to.be(true);
				expect(res.errors).to.be("Can't change admin status");
			});
		});
		it('should pass because no return value was provided', function () {
			var Model = Atomy.Model.extend('Model', {
				schema: ['admin'],
				validate: function () {
					if (this.admin) return;
				}
			}, true),
			model = Model({ admin: true });
			expect(model.isValid()).to.be(true);
		});
	});

	describe('Model: clear()', function () {
		it('should delete all schema attributes from model', function () {
			var Model = Atomy.Model.extend('Model', {
					schema: ['a', 'b', 'c']
				}, true),
				model = Model({ a: '1', b: 2, c: 3});
			model.on('change', function (model) {
				expect(true).to.ok();
				expect(model.a).to.be(undefined);
			});
			model.clear();
			expect(model.a).to.be(undefined);
			expect(model.b).to.be(undefined);
			expect(model.c).to.be(undefined);
			expect(model.c).to.be(undefined);
		});
	});
	
	describe('Model: Records', function () {
		
		it('should match records', function () {
			var i, records, Task = Atomy.Model.extend('Task', {
					schema: ['a'],
					sync: function (o, fn) {
						return this._callback(o, fn, o.data);
					}
				}, true);
			for (i = 0; i < 10; i++ ) {
				var res = Task.create({ a: i }),
					task = res.doc;
				records = Task.records();
				expect(records[task.id].a).to.be(task.a);
			}
			Task.clearRecords();
		});

		describe('Model: size()', function () {
			it('should return correct count of records', function () {
				var i, Task = Atomy.Model.extend('Task', {
						schema: ['a'],
						sync: function (o, fn) {
							return this._callback(o, fn, o.data);
						}
					}, true);
				for (i = 0; i < 10; i++ ) {
					Task.create({ a: i });
				}
				expect(Task.size()).to.be(10);
				for (i = 0; i < 10; i++ ) {
					Task.create({ a: i });
				}
				expect(Task.size()).to.be(20);
				Task.clearRecords();
				expect(Task.size()).to.be(0);
			});
		});

		describe('Model: first() & last()', function () {
			it('should match with first and last records', function () {
				var i, ids = [],
					Task = Atomy.Model.extend('Task', {
						schema: ['a'],
						sync: function (o, fn) {
							return this._callback(o, fn, o.data);
						}
					}, true);
				for (i = 0; i < 10; i++ ) {
					Task.create({ a: i }, function (res) {
						ids.push(res.doc.id);
					});
				}
				expect(Task.first().id).to.be(ids[0]);
				expect(Task.last().id).to.be(ids[ids.length - 1]);
				Task.clearRecords();
			});
		});

		describe('Model: iD()', function () {
			it('should get the correct id only', function () {
				var Task = Atomy.Model.extend('Task', {
						schema: ['a'],
						sync: function (o, fn) {
							return this._callback(o, fn, o.data);
						}
					}, true);
				Task.create({ a: 'a' }, function (res) {
					var task = res.doc;
					expect(Task.iD(task.id).a).to.be('a');
				});
			});
			it('should output null when record is not found', function () {
				var Task = Atomy.Model.extend('Task', {
					}, true);
				expect(Task.iD('')).to.be(null);
				expect(Task.iD('invalid-id')).to.be(null);
			});
		});

		describe('Model: events', function () {
			it('should trigger the correct event', function () {
				var Task = Atomy.Model.extend('Task', {
						schema: ['a'],
						sync: function (o, fn) {
							return this._callback(o, fn, o.data);
						}
					}, true);

				Task.create({ a: 'a' }, function (res) {
					var task = res.doc;
					task.on('change', function (ev) {
						expect(ev).to.be('update');
					});
					task.on('change:a', function (model, newVal, oldVal) {
						expect(model.a).to.be(2);
						expect(newVal).to.be(2);
						expect(oldVal).to.be('a');
					});
					task.on('update', function (model, diff) {
						expect(true).to.be.ok();
						expect(model.a).to.be(2);
						expect(diff).to.eql({ a: 2 });
					});
					task.a = 2;
					task.save();

				});
			});
		});
	});

	describe('Model: Ajax', function () {

		var server, Task, cb;

		beforeEach(function () {
			server = sinon.fakeServer.create();
			server.respondWith('GET', /\/tasks\??/,
				[200, {'Content-Type': 'application/json'},
				'[{ "id": 123, "title": "work", "notes": "hard" },{ "id": 124, "title": "hard", "notes": "work" }]']);
			cb = sinon.spy();
			Task = Atomy.Model.extend('Task', {
				schema: ['title', 'notes'],
				//ajaxProvider: 'zepto',
				//ajaxProvider: 'jquery',
				ajaxProvider: 'superagent',
				connection: {
					host: '/',
					key: 'tasks'
				}
			}, true);
		});
		
		afterEach(function () {
			server.restore();
			cb.reset();
		});

		describe('Model: ajax provider', function () {
            it ('should thwow an exeption on invalid provider', function () {
                Task = Atomy.Model.extend('Task', {
                    schema: ['title', 'notes'],
                    ajaxProvider: 'invalid'
                }, true);
                expect(Task.find).to.throwException(function (e) {
                    expect(e).to.be.an(Error);
                });
            });
            it ('should not thwow an exeption on valid provider', function () {
                expect(Task.find).to.throwException(function (e) {
                    expect(Task.find).to.not.be(Error);
                });
            });
        });

		describe('Model: find("all")', function () {
            
            it ('should make an AJAX request', function () {
                Task.find('all', cb);
                server.respond();
                expect(cb.calledOnce).to.be.ok();
                expect(server.requests.length).to.be(1);
                expect(cb.args[0][0].doc[0].title).to.be('work');
                expect(cb.args[0][0].doc[1].title).to.be('hard');
            });
            it ('should use GET method', function () {
                Task.find('all', cb);
                server.respond();
                expect(server.requests[0].method).to.be('GET');
            });
            it ('should make an AJAX request to the URL /tasks', function () {
                Task.find('all', cb);
                server.respond();
                expect(server.requests[0].url.replace('?', '')).to.be('/tasks');
            });
            it ('should wrap each object from response array in a Model class', function () {
                Task.find('all', cb);
                server.respond();
                expect(cb.args[0][0].doc[0]).to.be.a(Atomy.Model);
                expect(cb.args[0][0].doc[1]).to.be.a(Atomy.Model);
                expect(cb.args[0][0].doc[0]).to.be.a(Task);
                expect(cb.args[0][0].doc[1]).to.be.a(Task);
                expect(cb.calledOnce).to.be.ok();
                expect(server.requests.length).to.be(1);
            });
            it ('should handle when respond doesn\'t return an array', function () {
                server = sinon.fakeServer.create();
                server.respondWith('GET', /\/tasks\??/,
                [200, {'Content-Type': 'application/json'},
                '{ "id": 123, "title": "work", "notes": "hard"}']);
                Task.find('all', cb);
                server.respond();
                expect(cb.args[0][0].doc).to.be.a(Task);
                expect(cb.args[0][0].doc).to.be.a(Atomy.Model);
                expect(cb.args[0][0].doc).to.not.be.an(Array);
            });
        });

		describe('Model: find({})', function () {
			beforeEach(function () {
				cb = sinon.spy();
			});
			it ('should make an AJAX request', function () {
				Task.find({}, cb);
				server.respond();
				expect(cb.calledOnce).to.be.ok();
				expect(server.requests.length).to.be(1);
				expect(cb.args[0][0].doc[0].title).to.be('work');
                expect(cb.args[0][0].doc[1].title).to.be('hard');
			});
			it ('should use GET method', function () {
				Task.find({}, cb);
				expect(server.requests[0].method).to.be('GET');
			});
			it ('should make an AJAX request to the URL /tasks', function () {
				Task.find({}, cb);
				expect(server.requests[0].url.replace('?', '')).to.be('/tasks');
			});
			it ('should send title & notes as params', function () {
				Task.find({ title: 'work', notes: 'hard' }, cb);
				expect(server.requests[0].url).to.be('/tasks?title=work&notes=hard');
			});
			it ('should wrap each object from body array in to a model', function () {
				Task.find({}, cb);
				server.respond();
				expect(cb.args[0][0].doc[0]).to.be.a(Atomy.Model);
				expect(cb.args[0][0].doc[1]).to.be.a(Atomy.Model);
				expect(cb.args[0][0].doc[0]).to.be.a(Task);
				expect(cb.args[0][0].doc[1]).to.be.a(Task);
				expect(cb.calledOnce).to.be.ok();
				expect(server.requests.length).to.be(1);
			});
			it ('should handle when respond doesn\'t return an array', function () {
                server = sinon.fakeServer.create();
                server.respondWith('GET', /\/tasks\??/,
                [200, {'Content-Type': 'application/json'},
                '{ "id": 123, "title": "work", "notes": "hard"}']);
                Task.find('all', cb);
                server.respond();
                expect(cb.args[0][0].doc).to.be.a(Task);
                expect(cb.args[0][0].doc).to.be.a(Atomy.Model);
                expect(cb.args[0][0].doc).to.not.be.an(Array);
            });
		});

		describe('Model: find(id)', function () {
			beforeEach(function () {
				server = sinon.fakeServer.create();
				server.respondWith('GET', /\/tasks\/123\??/,
					[200, {'Content-Type': 'application/json'},
					'{ "id": 123, "title": "work", "notes": "hard" }']);
				cb = sinon.spy();
			});
			it ('should make an AJAX request', function () {
				Task.find(123, cb);
				server.respond();
				expect(cb.calledOnce).to.be.ok();
				expect(server.requests.length).to.be(1);
				expect(cb.args[0][0].doc.title).to.be('work');
			});
			it ('should use GET method', function () {
				Task.find('all', cb);
				expect(server.requests[0].method).to.be('GET');
			});
			it ('should make an AJAX request to URL /tasks/123', function () {
				Task.find(123, cb);
				expect(server.requests[0].url.replace('?', '')).to.be('/tasks/123');
			});
		});

		describe('Model: create()', function () {
			beforeEach(function () {
				server = sinon.fakeServer.create();
				server.respondWith('POST', '/tasks',
					[204, {'Content-Type': 'application/json'},
					'{ "id": 123, "title": "work", "notes": "hard" }']);
				cb = sinon.spy();
			});
			it ('should use POST method', function () {
				var task = Task.create({}, cb);
				server.respond();
				expect(server.requests[0].method).to.be('POST');
			});
			it ('should POST to URL /tasks', function () {
				var task = Task.create({}, cb);
				expect(server.requests[0].url).to.be('/tasks');
			});
			it ('should send title & notes as params', function () {
				var task = Task.create({ title: 'work', notes: 'hard' }, cb);
				server.respond();
				expect(server.requests[0].method).to.be('POST');
				expect(server.requests[0].requestBody).to.contain('title', 'notes', 'work', 'hard');
				expect(cb.args[0][0].doc.title).to.be('work');
			});
		});
		
		describe('Model: update()', function () {
			beforeEach(function () {
				server = sinon.fakeServer.create();
				server.respondWith('PUT', '/tasks/123',
					[200, {'Content-Type': 'application/json'},
					'{ "id": 123, "title": "work", "notes": "hard" }']);
				cb = sinon.spy();
			});
			it ('should use PUT method', function () {
				Task.update(123, {}, cb);
				expect(server.requests[0].method).to.be('PUT');
			});
			it ('should PUT to URL /tasks/123', function () {
				Task.update(123, {}, cb);
				expect(server.requests[0].url).to.be('/tasks/123');
			});
			it ('should send title & notes as params', function () {
				Task.update(123, { title: 'work', notes: 'hard' }, cb);
				server.respond();
				expect(server.requests[0].method).to.be('PUT');
				expect(server.requests[0].requestBody).to.contain('title', 'notes', 'work', 'hard');
				expect(cb.args[0][0].doc.title).to.be('work');
			});
			it ('should update from Model instance', function () {
				var task;
				server = sinon.fakeServer.create();
				server.respondWith('POST', '/tasks',
					[200, {'Content-Type': 'application/json'},
					'{ "id": 123, "title": "hola", "notes": "hola" }']);
				Task.create({ title: 'hola'}, function (res) {
					task = res.doc;
				});
				server.respond();
				server = sinon.fakeServer.create();
				cb = sinon.spy();
				task.title = 'hola2';
				task.update({ notes: 'newNote'}, cb);
				server.respond('PUT', '/tasks/123',
					[200, {'Content-Type': 'application/json'},
					'{ "id": 123, "title": "hola2", "notes": "newNote" }']);
				expect(server.requests[0].method).to.be('PUT');
				expect(server.requests[0].requestBody).to.contain('title', 'notes', 'newNote', 'hola2');
				expect(server.requests[0].url).to.be('/tasks/123');
				expect(cb.args[0][0].doc.id).to.be(123);
				expect(cb.args[0][0].doc.notes).to.be('newNote');
				expect(cb.args[0][0].doc.title).to.be('hola2');
			});
		});

		describe('Model: destroy()', function () {
			beforeEach(function () {
				server = sinon.fakeServer.create();
				server.respondWith('DELETE', '/tasks/123',
					[200, {'Content-Type': 'application/json'},
					'{ "id": 123 }']);
				cb = sinon.spy();
			});
			it ('should use DELETE method', function () {
				Task.destroy(123, cb);
				expect(server.requests[0].method).to.be('DELETE');
			});
			it ('should request DELETE to URL /tasks/123', function () {
				Task.destroy(123, cb);
				server.respond();
				expect(server.requests[0].url).to.be('/tasks/123');
				expect(cb.args[0][0].doc.id).to.be(123);
			});

			it ('should destroy from Model instance', function () {
				var task;
				server = sinon.fakeServer.create();
				server.respondWith('POST', '/tasks',
					[200, {'Content-Type': 'application/json'},
					'{ "id": 123, "title": "hola" }']);
				Task.create({ title: 'hola'}, function (res) {
					task = res.doc;
					
				});
				server.respond();
				server = sinon.fakeServer.create();
				cb = sinon.spy();
				task.destroy(cb);
				server.respond('DELETE', '/tasks/123',
					[200, {'Content-Type': 'application/json'},
					'{ "id": 123 }']);

				expect(server.requests[0].method).to.be('DELETE');
				expect(server.requests[0].url).to.be('/tasks/123');
				expect(cb.args[0][0].doc.id).to.be(123);
			});
		});

		describe('Model: save()', function () {
			beforeEach(function () {
				server = sinon.fakeServer.create();
				server.respondWith('POST', '/tasks',
					[204, {'Content-Type': 'application/json'},
					'{ "id": 123, "title": "work", "notes": "hard" }']);
				cb = sinon.spy();
			});
			it ('should use POST method', function () {
				var task = Task();
				task.save(cb);
				expect(server.requests[0].method).to.be('POST');
			});
			it ('should POST to URL /tasks', function () {
				var task = Task();
				task.save(cb);
				expect(server.requests[0].url).to.be('/tasks');
			});
			it ('should send title and notes params', function () {
				var task = Task();
				task.title = 'work';
				task.notes = 'hard';
				task.save(cb);
				server.respond();
				expect(server.requests[0].requestBody).to.contain('title', 'notes', 'work', 'hard');
			});
		});
	});
});
