
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

	describe('Model: initialize', function () {
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
		it('should only instantiate model with defined schema attributes', function () {
			var Model = Atomy.Model.extend('Model', {
				schema: ['one', 'two']
			}, true);
			var model = Model({ one: 1, two: 2, three: 3 });
			expect(model.one).to.be(1);
			expect(model.two).to.be(2);
			expect(model.three).to.be(undefined);
		});
		it('should only save defined attributes', function () {
			var Model = Atomy.Model.extend('Model', {
				schema: ['one', 'two'],
				sync: sync
			}, true);
			var model = Model({ one: 1, two: 2, three: 3 });
			var id = model.id;
			var res = model.save();
			expect(model.one).to.be(1);
			expect(model.two).to.be(2);
			expect(model.three).to.be(undefined);
		});
		it('should have a predefined id in schema', function () {
			var Model = Atomy.Model.extend('Model', {
				schema: ['id', 'two'],
				sync: sync
			}, true);
			var model = Model({ id: 1, two: 2, three: 3 });
			expect(model.id).to.ok(1);
		});
	});

	describe('Model: isNew', function () {
		it('should be new on first instantiation', function () {
			var Model = Atomy.Model.extend('Model', {
				schema: ['one', 'two'],
				sync: sync
			}, true);
			var model = Model();
			expect(model.isNew()).to.be(true);
		});
		it('should not be new after save or update', function () {
			var Model = Atomy.Model.extend('Model', {
				schema: ['one', 'two'],
				sync: sync
			}, true);
			var model = Model();
			model.save();
			expect(model.isNew()).not.to.be(true);
			expect(model.isNew()).to.be(false);
			model.two = 2;
			model.update();
			expect(model.isNew()).not.to.be(true);
			expect(model.isNew()).to.be(false);
		});
		it('should not be new after create', function () {
			var Model = Atomy.Model.extend('Model', {
				schema: ['one', 'two'],
				sync: sync
			}, true);
			var model = Model();
			model.create({ one: 1 });
			expect(model.isNew()).not.to.be(true);
			expect(model.isNew()).to.be(false);
		});
	});

	describe('Model: toJSON', function () {
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

	describe('Model: escape', function () {
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

	describe('Model: clone', function () {
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
	
	describe('Model: validate', function () {
		it('should not be valid', function () {
			var Model = Atomy.Model.extend('Model', {
				schema: ['admin'],
				validate: function () {
					if (this.admin) return "Can't change admin status";
				}
			}, true),
			model = Model({ admin: true });
			expect(model.isValid()).to.be(false);
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
		it('should trigger error event on save', function () {
			var error,
				Model = Atomy.Model.extend('Model', {
					schema: ['admin'],
					validate: function () {
						if (this.admin) return "Can't change admin status";
					}
				}, true),
				model = Model({ admin: true });
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
	});

	describe('Model: clear', function () {
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
					task = res.body;
				records = Task.records();
				expect(records[task.id].a).to.be(task.a);
			}
			Task.clearRecords();
		});

		describe('Model: size', function () {
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

		describe('Model: first & last', function () {
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
						ids.push(res.body.id);
					});
				}
				expect(Task.first().id).to.be(ids[0]);
				expect(Task.last().id).to.be(ids[ids.length - 1]);
				Task.clearRecords();
			});
		});

		describe('Model: id', function () {
			it('should get the correct id only', function () {
				var Task = Atomy.Model.extend('Task', {
						schema: ['a'],
						sync: function (o, fn) {
							return this._callback(o, fn, o.data);
						}
					}, true);
				Task.create({ a: 'a' }, function (res) {
					var task = res.body;
					expect(Task.id(task.id).a).to.be('a');
				});
			});
			it('should output null when record is not found', function () {
				var Task = Atomy.Model.extend('Task', {
					}, true);
				expect(Task.id('')).to.be(null);
				expect(Task.id('invalid-id')).to.be(null);
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
					var task = res.body;
					task.on('change', function (ev) {
						//alert('hola' + ev);
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

});
