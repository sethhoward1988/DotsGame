
var PlayerTurn = function (el, events) {
	this.players = [];
	this.$el = el;
	this.events = events;
	this.bind();
	this.events.subscribe(this.onScoreChange, 'scoreChange');
	this.events.subscribe(this.onTurnChange, 'turnChange');
}

PlayerTurn.prototype = {

	playerHtml: _.template('<div class="player <%= active %>">' +
					'<div class="name"><%= name %></div>' +
					'<div class="color" style="background-color:<%= color %>"></div>' +
					'<div class="score"><%= score %></div>' +
				'</div>'),

	addPlayer: function (name, color) {
		var player = new Player(name, color, this.events)
		this.players.push(player);
		this.$el.append(this.playerHtml({
			name: player.getName(),
			color: player.getColor(),
			score: player.getScore(),
			active: player.isActive ? 'active' : ''
		}));
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
		this.activePlayerIndex = 0;
		this.activePlayer = this.players[this.activePlayerIndex];
		this.activePlayer.setIsActive(true);
		this.events.trigger('turnChange');
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
		this.events.trigger('turnChange');
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

	onTurnChange: function () {
		this.updateUI()
	}

}