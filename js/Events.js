
var Events = function () {
	this.events = {};
	this.idCounter = 0;
}

Events.prototype = {

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
		// Still need to build this, but not needed right now
		var functions = this.events[eventName];
	},

	trigger: function (eventName) {
		var functions = this.events[eventName].functions;
		for(var i = 0; i < functions.length; i++){
			functions[i].fn();
		}
	}
}
