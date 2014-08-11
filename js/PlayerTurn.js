
var PlayerTurn = function (el, events, dataModel, gameSetup) {
	this.players = [];
	this.$el = el;
	this.events = events;
	this.dataModel = dataModel;
	this.gameSetup = gameSetup;
	this.bind();
	this.events.subscribe(this.onCollaboratorJoined, 'collaboratorJoined');
	this.events.subscribe(this.onCollaboratorLeave, 'collaboratorLeft');
	this.events.subscribe(this.onPlayersUpdate, 'playersUpdate');
}

PlayerTurn.prototype = {

	playerHtml: _.template('' +
					'<li class="<%= active %>">' +
						'<div class="photo"><img src="https:<%= photoUrl %>" style="border: 5px solid <%= color %>" /></div>' +
						'<div class="data">' +
							'<div class="name"><%= name %></div>' +
							'<div class="score"><%= score %></div>' +
						'</div>' +
					'</li>'),

	bind: function () {
		this.updateUI = _.bind(this.updateUI, this);
		this.onCollaboratorLeave = _.bind(this.onCollaboratorLeave, this);
		this.onCollaboratorJoined = _.bind(this.onCollaboratorJoined, this);
		this.onPlayersUpdate = _.bind(this.onPlayersUpdate, this);
	},

	startPlaying: function () {
		this.players = _.shuffle(this.players);
		this.players[0].isActive = true;
		this.activePlayerIndex = 0;
		this.sendPlayerData();
	},

	next: function () {
		if(this.activePlayerIndex + 1 >= this.players.length){
			this.activePlayerIndex = 0;
		} else {
			this.activePlayerIndex++;
		}
		for (var i = this.players.length - 1; i >= 0; i--) {
			if(this.players[i].isActive){
				this.players[i].isActive = false;
			}
		};
		this.sendPlayerData();
	},

	sendPlayerData: function () {
		this.dataModel.setPlayerData(this.players, this.activePlayerIndex);
	},

	updateUI: function () {
		this.$el.find('.players-list').empty();
		for(var i = 0; i < this.players.length; i++){
			this.$el.find('.players-list').append(this.playerHtml({
				name: this.players[i].name,
				color: this.players[i].color,
				score: this.players[i].score,
				photoUrl: this.players[i].photoUrl,
				active: this.players[i].isActive ? 'active' : ''
			}));
		}
	},

	onCollaboratorJoined: function (collaborator) {
		this.dataModel.addPlayerToDataModel(new Player(
			collaborator.displayName,
			collaborator.color,
			collaborator.photoUrl,
			collaborator.userId,
			collaborator.sessionId,
			this.events));
	},

	onCollaboratorLeave: function (collaborator) {
		this.dataModel.removePlayerFromDataModel(collaborator.userId);
	},

	onPlayersUpdate: function () {
		var playerData = this.dataModel.playersField.get('playerData');
		this.players = playerData.activePlayers;
		if(this.gameSetup.gameStarted){
			this.activePlayerIndex = playerData.activePlayerIndex;
			this.activePlayer = this.players[this.activePlayerIndex];
			this.activePlayer.isActive = true;
		}
		for (var i = this.players.length - 1; i >= 0; i--) {
			if(this.players[i].isActive){
				if(this.isMe(this.players[i].userId)){
					this.events.trigger('myTurn');	
				}
			}
		};
		this.updateUI();
	},

	incrementScore: function (score) {
		this.activePlayer.score += score;
		this.sendPlayerData();
	},

	isMe: function (userId) {
		var me = this.getMe();
		return me.userId == userId;
	},

	getMe: function () {
		var collaborators = this.dataModel.realtimeDoc.getCollaborators();
		for (var i = collaborators.length - 1; i >= 0; i--) {
			if(collaborators[i].isMe){
				return collaborators[i];
			}
		};
	},

	reset: function () {
		this.activePlayer = null;
		this.activePlayerIndex = null;
	}
}
