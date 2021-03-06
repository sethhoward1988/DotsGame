
var PlayerTurn = function (el, events, dataModel, gameSetup) {
	this.players = [];
	this.$el = el;
	this.events = events;
	this.dataModel = dataModel;
	this.gameSetup = gameSetup;
	this.bind();
	this.events.subscribe(this.onCollaboratorLeave, 'collaboratorLeft');
	this.events.subscribe(this.onPlayersUpdate, 'playersUpdate');
	this.events.subscribe(this.onUpdateUI, 'updatePlayersUI');
	this.events.subscribe(this.onGameOver, 'gameOver');
}

PlayerTurn.prototype = {

	playerHtml: _.template('' +
					'<li class="<%= active %> <%= winner %>" data-id="<%= id %>">' +
						'<div class="photo"><img src="https://<%= photoUrl %>" style="border: 5px solid <%= color %>" /></div>' +
						'<div class="data">' +
							'<div class="name"><%= name %></div>' +
							'<div class="score"><%= score %></div>' +
						'</div>' +
					'</li>'),

	bind: function () {
		this.updateUI = _.bind(this.updateUI, this);
		this.onCollaboratorLeave = _.bind(this.onCollaboratorLeave, this);
		this.onPlayersUpdate = _.bind(this.onPlayersUpdate, this);
		this.onUpdateUI = _.bind(this.onUpdateUI, this);
		this.onGameOver = _.bind(this.onGameOver, this);
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

		// this.$el.find('.players-list').empty();
		for(var i = 0; i < this.players.length; i++){
			var el = $('*[data-id="' + this.players[i].name + '"]');
			if(!el.length){
				this.$el.find('.players-list').append(this.playerHtml({
					name: this.players[i].name,
					color: this.players[i].color,
					score: this.players[i].score,
					photoUrl: this.players[i].photoUrl.replace('https://',''),
					active: this.players[i].isActive ? 'active' : '',
					userId: this.players[i].userId,
					winner: this.players[i].winner ? 'winner' : '',
					id: this.players[i].name,
				}));	
			} else {
				el.removeClass('active').removeClass('winner');
				el.addClass(this.players[i].winner ? 'winner' : '');
				el.addClass(this.players[i].isActive ? 'active' : '');
				el.find('.score').text(this.players[i].score);
				el.find('img').css('border','5px solid ' + this.players[i].color);
			}
		}
	},

	onGameOver: function () {
		var highScore = 0;
		for (var i = this.players.length - 1; i >= 0; i--) {
			if(this.players[i].score > highScore){
				highScore = this.players[i].score;
			}
		};
		for (var i = this.players.length - 1; i >= 0; i--) {
			if(this.players[i].score == highScore){
				this.players[i].winner = true;
			}
		};
		this.updateUI();
	},

	onUpdateUI: function () {
		this.players = this.dataModel.playersField.get('playerData').activePlayers;
		this.updateUI();
	},
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
	onCollaboratorLeave: function (collaborator) {
		this.dataModel.removePlayerFromDataModel(collaborator.photoUrl);
	},

	onPlayersUpdate: function () {
		var playerData = this.dataModel.playersField.get('playerData');
		this.players = playerData.activePlayers;
		if(this.gameSetup.gameStarted){
			this.activePlayerIndex = playerData.activePlayerIndex;
			this.activePlayer = this.players[this.activePlayerIndex];
			this.activePlayer.isActive = true;
			for (var i = this.players.length - 1; i >= 0; i--) {
				if(this.isMe(this.players[i].userId)){
					this.me = this.players[i];
					if(this.players[i].isActive){
						this.events.trigger('myTurn');	
					}
				}
			};
		}
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
		var collaborators = this.dataModel.getCollaborators();
		for (var i = collaborators.length - 1; i >= 0; i--) {
			if(collaborators[i].isMe){
				return collaborators[i];
			}
		};
	},

	getOrAssignColor: function (userId) {

	},

	reset: function () {
		this.activePlayer = null;
		this.activePlayerIndex = null;
	}
}
