
var Events = function () {
	this.events = {};
	this.idCounter = 0;
	this.setup();
}

Events.prototype = {

	setup: function () {
		this.subscribe = _.bind(this.subscribe, this);
		this.unsubscribe = _.bind(this.unsubscribe, this);
		this.trigger = _.bind(this.trigger, this);
	},

	subscribe: function (fn, eventName) {
		if(!this.events[eventName]){
			this.events[eventName] = {
				functions: [{
					fn: fn,
					id: _.clone(this.idCounter),
				}]
			}
		} else {
			this.events[eventName].functions.push({
				fn: fn,
				id: _.clone(this.idCounter)
			});
		}
		this.idCounter++;
		return this.idCounter;
	},

	unsubscribe: function (eventName, id) {
		var events = this.events[eventName]
		if(events){
			var functions = events.functions;
			var index = -1;
			functions.each(function(obj, currentIndex){
				if(obj.id == id){
					index = currentIndex;
				}
			});
			if(index >= 0){
				functions.splice(index, 1);
			}
		}

	},

	trigger: function (eventName) {
		var args = Array.prototype.slice.call(arguments);
		args.shift();
		var events = this.events[eventName]
		if(events){
			var functions = events.functions;
			for(var i = 0; i < functions.length; i++){
				functions[i].fn.apply(window, args);
			}
		}
	}
}
