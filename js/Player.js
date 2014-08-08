
var Player = function (name, color, photoUrl, userId, sessionId, isMe, events) {
	this.name = name;
	this.color = color;
	this.photoUrl = photoUrl;
	this.userId = userId;
	this.sessionId = sessionId;
	this.isMe = isMe;
	this.isActive = false;
	this.score = 0;
	this.events = events;
	this.setup();
}

Player.prototype = {

	setup: function () {
		this.incrementScore = _.bind(this.incrementScore, this);
	},

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

	getPhotoUrl: function () {
		return this.photoUrl;
	},

	setPhotoUrl: function (url) {
		this.photoUrl = url;
	},

	getUserId: function () {
		return this.userId;
	},

	getSessionId: function () {
		return this.sessionId;
	},

	setUserId: function (userId) {
		this.userId = userId;
	},

	setIsMe: function (isMe) {
		this.isMe = isMe;
	},

	getIsMe: function () {
		return this.isMe;
	},

	getScore: function () {
		return this.score;
	},

	setScore: function (score) {
		this.score = score;
	},

	incrementScore: function (quantity) {
		this.score += quantity;
		this.events.trigger('scoreChange');
	}

}