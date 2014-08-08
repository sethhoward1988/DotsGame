
var PlayerTurn = function (el, events, dataModel, gameSetup) {
	this.players = [];
	this.activePlayerIndex = 0;
	this.$el = el;
	this.events = events;
	this.dataModel = dataModel;
	this.gameSetup = gameSetup;
	this.bind();
	this.events.subscribe(this.onTurnChange, 'turnChange');
	this.events.subscribe(this.onActivePlayerIndexChange, 'activePlayerIndexChange');
}

PlayerTurn.prototype = {

	playerHtml: _.template('<div class="player <%= active %>">' +
					'<div class="name"><%= name %></div>' +
					'<div class="color" style="background-color:<%= color %>"></div>' +
					'<div class="score"><%= score %></div>' +
				'</div>'),

	bind: function () {
		this.onChangeTurn = _.bind(this.onChangeTurn, this);
		this.updateUI = _.bind(this.updateUI, this);
		this.onActivePlayerIndexChange = _.bind(this.onActivePlayerIndexChange, this);
	},

	addPlayer: function (name, color, photoUrl, userId, sessionId, isMe) {
		if(this.doesPlayerExist(userId)){
			return;
		}
		var player = new Player(name, color, photoUrl, userId, sessionId, isMe, this.events)
		if(isMe){
			this.mePlayer = player;
		}
		this.dataModel.updatePlayerToDataModel(player);
		this.players.push(player);
		this.$el.append(this.playerHtml({
			name: player.getName(),
			color: player.getColor(),
			score: player.getScore(),
			active: player.isActive ? 'active' : ''
		}));
	},

	removePlayer: function (userId) {
		if(this.gameSetup.gameStarted){
			return;
		}
		var removedPlayer;
		for(var i = 0; i < this.players.length; i++){
			if(this.players[i].userId == userId){
				removedPlayer = this.players.splice(i, 1);
				i = this.players.length;
			}
		}
		this.dataModel.removePlayerFromDataModel(removedPlayer);
		this.updateUI();
	},

	doesPlayerExist: function (userId) {
		for(var i = 0; i < this.players.length; i++){
			if(this.players[i].getUserId() == userId){
				return true;
			}
		}
		return false;
	},

	getMe: function () {
		return this.mePlayer;
	},

	clearPlayers: function () {
		this.players = [];
		this.activePlayer = null;
	},

	startPlaying: function () {
		this.players = _.shuffle(this.players);
		for(var i = 0; i < this.players.length; i++){
			this.players[i].position = i;
			this.dataModel.updatePlayerToDataModel(this.players[i]);
		}
		this.sendActivePlayerIndex(0);
	},

	sendActivePlayerIndex: function (index) {
		this.dataModel.setActivePlayerIndex(index);
	},

	next: function () {
		if(this.activePlayerIndex + 1 >= this.players.length){
			this.activePlayerIndex = 0;
		} else {
			this.activePlayerIndex++;
		}
		this.activePlayer.setIsActive(false);
		this.activePlayer = this.players[this.activePlayerIndex];
		this.activePlayer.setIsActive(true);
		this.sendActivePlayerIndex(this.activePlayerIndex);
	},

	isReady: function () {
		if(this.players.length < 2){
			alert("You do not have enought players, add more!");
			return false;
		}
		return true;
	},

	updateUI: function () {
		this.$el.empty();
		for(var i = 0; i < this.players.length; i++){
			this.$el.append(this.playerHtml({
				name: this.players[i].name,
				color: this.players[i].color,
				score: this.players[i].score,
				active: this.players[i].isActive ? 'active' : ''
			}));
		}
	},

	onActivePlayerIndexChange: function (index) {
		this.activePlayerIndex = index;
		if(this.players[index].isMe){
			this.events.trigger('myTurn');
		}
	},

	onChangeTurn: function (index) {
		console.log('Turn should change...');
		this.activePlayerIndex = index;
		this.activePlayer = this.players[index];
		this.activePlayer.setIsActive(true);
		this.updateUI();
	},

	reset: function () {
		for (var i = this.players.length - 1; i >= 0; i--) {
			this.players[i].setScore(0);
		};
	}
}
