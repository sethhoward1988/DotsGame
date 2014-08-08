
var PlayerTurn = function (el, events, dataModel) {
	this.players = [];
	this.activePlayerIndex = 0;
	this.$el = el;
	this.events = events;
	this.dataModel = dataModel;
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
		if(isMe){
			this.mePlayer = player;
		}
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

	getMe: function () {
		return this.mePlayer;
	},

	bind: function () {
		this.onScoreChange = _.bind(this.onScoreChange, this);
		this.onChangeTurn = _.bind(this.onChangeTurn, this);
		this.onPlayersArrayChange = _.bind(this.onPlayersArrayChange, this);
		this.updateUI = _.bind(this.updateUI, this);
	},

	clearPlayers: function () {
		this.players = [];
		this.activePlayer = null;
	},

	startPlaying: function () {
		this.players = _.shuffle(this.players);
		this.activePlayer = this.players[this.activePlayerIndex];
		this.activePlayer.setIsActive(true);
		this.sendPlayersArray();
		this.sendCurrentPlayerIndex();
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
				name: this.players[i].name,
				color: this.players[i].color,
				score: this.players[i].score,
				active: this.players[i].isActive ? 'active' : ''
			}));
		}
	},

	onScoreChange: function () {
		this.updateUI();
		this.sendPlayersArray();
	},

	onChangeTurn: function (index) {
		console.log('Turn should change...');
		this.activePlayerIndex = index;
		this.activePlayer = this.players[index];
		this.activePlayer.setIsActive(true);
		this.updateUI();
	},

	onPlayersArrayChange: function (playersArray) {
		this.players = playersArray;
		this.updateUI();
	},

	sendCurrentPlayerIndex: function () {
		this.dataModel.configField.set('activePlayerIndex', this.activePlayerIndex);
	},

	sendPlayersArray: function () {
		this.dataModel.playersArrayField.setText(JSON.stringify(this.players));
	},

	reset: function () {
		for (var i = this.players.length - 1; i >= 0; i--) {
			this.players[i].setScore(0);
		};
	}
}
