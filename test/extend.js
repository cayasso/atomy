describe('Atomy.Class.extend', function () {

	describe('Atomy.Class and Atomy.Model', function () {
      it('should exist', function () {
        expect(Atomy.Class).to.be.ok();
        expect(Atomy.Model).to.be.ok();
      });
      it('should be constructors', function () {
        expect(Atomy.Class).to.be.a('function');
        expect(Atomy.Model).to.be.a('function');
		var klass = new Atomy.Class();
        var model = new Atomy.Model();
        expect(klass).to.be.a(Atomy.Class);
        expect(model).to.be.a(Atomy.Model);
      });
    });

	describe('Extend: extend method', function () {
		var Model, model;

		beforeEach(function () {
			Model = Atomy.Model.extend('Model', {
				add: function (num) { return num+1; }
			});
			model = new Model();
		});

		afterEach(function () {
			Model = null;
			model = null;
		});

		it('Extend: should instantiate with and without `new`', function () {
			var model2 = Model();
			expect(model).to.be.a(Model);
			expect(model2).to.be.a(Model);
		});
		it('Extend: should extend prototype if no second argument provided', function () {
			expect(model.add).to.be.ok();
			expect(model.add(1)).to.be(2);
			expect(Model.add).not.to.ok();
		});
		it('should extend static if second argument was provided', function () {
			Model = Atomy.Model.extend('Model', {
				add: function (num) { return num+1; }
			}, true);
			model = Model();
			expect(Model.add).to.be.ok();
			expect(Model.add(1)).to.be(2);
			expect(model.add).not.to.ok();
		});
		it('should allow true as second argument', function () {
			Model = Atomy.Model.extend('Model', {
				add: function (num) { return num+1; }
			}, true);
			model = Model();
			expect(Model.add).to.be.ok();
			expect(Model.add(1)).to.be(2);
			expect(model.add).not.to.ok();
		});
		it('should extend both prototype and static when both arguments were provided', function () {
			Model = Atomy.Model.extend('Model', {
				add: function (num) { return num+1; }
			}, {
				myAdd: function (num) { return num+1; }
			});
			model = Model();
			expect(Model.add).to.be.ok();
			expect(model.myAdd).to.be.ok();
			expect(Model.add(1)).to.be(2);
			expect(model.myAdd(1)).to.be(2);
		});

		describe('Extend: Inheritance', function () {
			it('should inherit parent properties', function () {
				var Base = Atomy.Model.extend('Model', {
					name: 'John'
				});
				var Model = Base.extend('Base');
				var model = Model();
				expect(model.name).to.be.eql('John');
			});
			it('should inherit parent methods', function () {
				var Base = Atomy.Model.extend('Model', {
					name: 'John',
					parentMethod: function (num) {
						return this.name;
					}
				});
				var Model = Base.extend('Base');
				var model = Model();
				expect(model.parentMethod).to.be.ok();
				expect(model.parentMethod()).to.be.eql('John');
			});
			it('should call child method instead of parent method', function () {
				var Base = Atomy.Model.extend('Model', {
					method: function (num) {
						return 'hello';
					}
				});
				var Model = Base.extend('Base', {
					method: function () {
						return 'hi';
					}
				});
				var model = Model();
				expect(model.method).to.be.ok();
				expect(model.method()).to.be.eql('hi');
			});
			it('should use child property instead of parent property in a method', function () {
				var Base = Atomy.Model.extend('Model', {
					name: 'John',
					method: function (num) {
						return this.name;
					}
				});
				var Model = Base.extend('Base', {
					name: 'Mario'
				});
				var model = Model();
				expect(model.method()).to.be.eql('Mario');
			});
		});

		describe('Extend: Inheritance with super-class', function () {
			it('should call the corresponding super-class method', function () {
				var Base = Atomy.Model.extend('Model', {
					inc: 2,
					add: function (num) {
						expect(true).to.be.ok();
						return num+this.inc;
					}
				});
				var Model = Base.extend('Base', {
					add: function (num) {
						return this._super(num);
					}
				});
				var model = Model();
				expect(model.add(10)).to.be(12);
			});
			it('should call the super-class using child `inc` attribute', function () {
				var Base = Atomy.Model.extend('Model', {
					inc: 2,
					add: function (num) { return num+this.inc; }
				});
				var Model = Base.extend('Base', {
					inc: 5,
					add: function (num) {
						return this._super(num);
					}
				});
				var model = Model();
				expect(model.add(10)).to.be(15);
			});
			it('should fail when calling super-class on undefined method', function () {
				var Base = Atomy.Model.extend('Model', {});
				var Model = Base.extend('Base', {
					add: function () {
						expect(this._super).to.be(undefined);
					}
				});
				var model = Model();
				model.add();
				
			});
		});
	});
});
