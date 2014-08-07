
var PlayerTurn = function (el, events, dataModel) {
	this.players = [];
	this.activePlayerIndex = 0;
	this.$el = el;
	this.events = events;
	this.bind();
	this.events.subscribe(this.onScoreChange, 'scoreChange');
	this.events.subscribe(this.onTurnChange, 'turnChange');
	this.events.subscribe(this.onPlayersArrayChange, 'playersArrayChange');
	this.events.subscribe(this.onChangeTurn, 'changeTurn');
}

PlayerTurn.prototype = {

	playerHtml: _.template('<div class="player <%= active %>">' +
					'<div class="name"><%= name %></div>' +
					'<div class="color" style="background-color:<%= color %>"></div>' +
					'<div class="score"><%= score %></div>' +
				'</div>'),

	addPlayer: function (name, color, photoUrl, userId, sessionId, isMe) {
		if(this.doesPlayerExist(userId)){
			return;
		}
		var player = new Player(name, color, photoUrl, userId, isMe, this.events)
		this.players.push(player);
		this.$el.append(this.playerHtml({
			name: player.getName(),
			color: player.getColor(),
			score: player.getScore(),
			active: player.isActive ? 'active' : ''
		}));
	},

	doesPlayerExist: function (userId) {
		for(var i = 0; i < this.players.length; i++){
			if(this.players[i].getUserId() == userId){
				return true;
			}
		}
		return false;
	},

	bind: function () {
		this.onScoreChange = _.bind(this.onScoreChange, this);
		this.onTurnChange = _.bind(this.onTurnChange, this);
	},

	clearPlayers: function () {
		this.players = [];
		this.activePlayer = null;
	},

	startPlaying: function () {
		this.players = _.shuffle(this.players);
		this.activePlayer = this.players[this.activePlayerIndex];
		this.activePlayer.setIsActive(true);
	},

	resumePlay: function () {

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
				name: this.players[i].getName(),
				color: this.players[i].getColor(),
				score: this.players[i].getScore(),
				active: this.players[i].isActive ? 'active' : ''
			}));
		}
	},

	onScoreChange: function () {
		this.updateUI();
	},

	onChangeTurn: function () {

	},

	onPlayersArrayChange: function (playersArray) {
		this.players = JSON.parse(playersArray);
	},

	sendPlayersArray: function () {
		this.dataModel.playersArrayField.setText(JSON.stringify(this.players));
	},

	onTurnChange: function () {
		this.updateUI()
	},

	reset: function () {
		for (var i = this.players.length - 1; i >= 0; i--) {
			this.players[i].setScore(0);
		};
	}

}