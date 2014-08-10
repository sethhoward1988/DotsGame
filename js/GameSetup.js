
$(function(){

	window.gameController = new GameController();
	$('body').append(window.gameController.$el);

	$('#start').on('click', function () {
		gameController.realtimeDataModel.gameDataField.set('gridSize', $('#gridSize').val());
		gameController.realtimeDataModel.gameDataField.set('gameStarted', 'true');
		$('#start').attr('disabled', true);
		$('#end').attr('disabled', false);
	});

	$('#end').on('click', function () {
		gameController.realtimeDataModel.gameDataField.set('gameStarted', 'false');
		$('#start').attr('disabled', false);
		$('#end').attr('disabled', true);
	});

});


var GameController = function () {
	this.$el = $('<div id="game"></div>');
	this.$playersPanel = $('<div class="players"></div>');
	this.$gameContainer = $('<div class="dots-container"></div>');
	this.$el.append(this.$playersPanel).append(this.$gameContainer);
	this.events = new Events();
	this.realtimeDataModel = new RealtimeDataModel(this.events);
	this.playerTurn = new PlayerTurn(this.$playersPanel, this.events, this.realtimeDataModel, this);
	this.realtimeDataModel.startRealtime();
	this.setup();
}

GameController.prototype = {

	setup: function () {
		this.onGameStarting = _.bind(this.onGameStarting, this);
		this.onGameEnding = _.bind(this.onGameEnding, this);
		this.onFileLoaded = _.bind(this.onFileLoaded, this);

		this.events.subscribe(this.onGameStarting, 'startGame');
		this.events.subscribe(this.onGameEnding, 'endGame');
		this.events.subscribe(this.onFileLoaded, 'fileLoaded');
	},

	onGameStarting: function (size) {
		this.createGame(size);
	},

	onGameEnding: function () {
		this.game.destroy();
		this.playerTurn.reset();
		this.realtimeDataModel.reset();
		this.game.$el.remove();
	},

	onFileLoaded: function () {
		if(this.realtimeDataModel.gameDataField.get('gameStarted') == 'true'){
			this.gameStarted = true;
			this.createGame(this.realtimeDataModel.gameDataField.get('gridSize'), true);
			this.realtimeDataModel.onDataChange();
		} else {
			this.gameStarted = false;
		}
		this.playerTurn.createPlayers();
	},

	createGame: function (size, isResume) {
		if(!this.playerTurn.isReady){ return; }

		this.playerTurn.startPlaying();

		this.game = new Game({
			gridSize: size ? size : 4,
			el: this.$gameContainer,
			playerTurn: this.playerTurn
		}, 
		this.events,
		this.realtimeDataModel,
		isResume);
		this.gameStarted = true;
	}

}
