
var Player = function (name, color, events) {
	this.name = name;
	this.color = color;
	this.isActive = false;
	this.score = 0;
	this.events = events;
}

Player.prototype = {

	setIsActive: function (isActive) {
		this.isActive = isActive;
	},

	isActive: function () {
		return this.isActive;
	},

	getName: function () {
		return this.name;
	},

	setName: function (name) {
		this.name = name;
	},

	getColor: function () {
		return this.color;
	},

	setColor: function () {
		this.color = color;
	},

	getScore: function () {
		return this.score;
	},

	incrementScore: function (quantity) {
		this.score += quantity;
		this.events.trigger('scoreChange');
	}

}