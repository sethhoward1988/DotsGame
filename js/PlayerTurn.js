
var PlayerTurn = function (el, events, dataModel, gameSetup) {
	this.players = [];
	this.activePlayerIndex = 0;
	this.$el = el;
	this.events = events;
	this.dataModel = dataModel;
	this.gameSetup = gameSetup;
	this.bind();
	this.events.subscribe(this.onCollaboratorJoined, 'collaboratorJoined');
	this.events.subscribe(this.onCollaboratorLeave, 'collaboratorLeft');
	this.events.subscribe(this.onPlayerUpdate, 'onPlayerUpdate');
	this.events.subscribe(this.onTurnChange, 'onTurnChange');
}

PlayerTurn.prototype = {

	playerHtml: _.template('' +
				'<div class="player <%= active %>">' +
					'<div class="name"><%= name %></div>' +
					'<div class="color" style="background-color:<%= color %>"></div>' +
					'<div class="score"><%= score %></div>' +
				'</div>'),

	bind: function () {
		this.updateUI = _.bind(this.updateUI, this);
		this.onCollaboratorLeave = _.bind(this.onCollaboratorLeave, this);
		this.onCollaboratorJoined = _.bind(this.onCollaboratorJoined, this);
	},

	getMe: function () {
		for (var i = this.players.length - 1; i >= 0; i--) {
			if(this.players[i].isMe){
				return this.players[i]
			}
		};
	},

	startPlaying: function () {
		this.players = _.shuffle(this.players);
		this.players[0].isMyTurn = true;
		this.dataModel.updatePlayersToDataModel(this.players);
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

	onCollaboratorJoined: function (collaborator) {
		this.dataModel.addPlayerToDataModel(new Player(
			collaborator.name,
			collaborator.color,
			collaborator.photoUrl,
			collaborator.userId,
			collaborator.sessionId,
			collaborator.isMe,
			this.events));
	},

	onCollaboratorLeave: function (collaborator) {
		this.dataModel.removePlayerFromDataModel(collaborator.userId);
	},

	onChangeTurn: function () {
		var index;
		for (var i = this.players.length - 1; i >= 0; i--) {
			if(this.players[i].isMyTurn){
				this.players[i].isMyTurn = false;
				var a = function(activePlayerIndex){
					index = activePlayerIndex;
				}();
			}
		}
		if(index == this.players.length - 1){
			index = 0;
		} else {
			index++;
		}
		this.players[index].isMyTurn = true;
		this.dataModel.updatePlayersToDataModel(this.players);
	}

	onTurnChange: function () {
		
	},

	onPlayerUpdate: function (players) {
		this.players = players;
		for(player in players){
			if(players[player].isMe && players[player].isMyTurn){
				this.events.trigger('myTurn');
			}
		}
		this.updateUI();
	},

	reset: function () {
		for (var i = this.players.length - 1; i >= 0; i--) {
			this.players[i].setScore(0);
		};
	}
}
