
$(function(){

	window.gameController = new GameController();
	$('body').append(window.gameController.$el);

	$('#start').on('click', function () {
		gameController.start();
		$('#start').attr('disabled', true);
		$('#end').attr('disabled', false);
	});

	$('#end').on('click', function () {
		gameController.end();
		$('#start').attr('disabled', false);
		$('#end').attr('disabled', true);
	});

});


var GameController = function () {
	this.$el = $('<div id="game"></div>');
	this.$leftPanel = $('<div class="leftPane"></div>');
	this.$rightPanel = $('<div class="rightPane"></div>');
	this.$playersPanel = $(this.playersPanelHtml);
	this.$gameContainer = $('<div class="dots-container"></div>');
	this.$rightPanel.append(this.$gameContainer);
	this.$controlPanel = $(this.controlPanelHtml);
	this.$leftPanel.append(this.$playersPanel).append(this.$controlPanel);
	this.$el.append(this.$leftPanel).append(this.$rightPanel);
	this.events = new Events();
	this.realtimeDataModel = new RealtimeDataModel(this.events);
	this.playerTurn = new PlayerTurn(this.$playersPanel, this.events, this.realtimeDataModel, this);
	this.realtimeDataModel.startRealtime();
	this.setup();
}

GameController.prototype = {

	playersPanelHtml: 	'<div class="players">' +
							'<h1>Players</h1>' +
							'<ul class="players-list"></ul>' +
						'</div>',

	controlPanelHtml: 	'<div class="controls">' +
							'Grid Size:<input id="gridSize" type="number"></input>' +
							'<button id="start">Start Game</button>' +
							'<button id="end">End Game</button>' +
						'</div>',

	setup: function () {
		this.onGameStarting = _.bind(this.onGameStarting, this);
		this.onGameEnding = _.bind(this.onGameEnding, this);
		this.onFileLoaded = _.bind(this.onFileLoaded, this);

		this.events.subscribe(this.onGameStarting, 'startGame');
		this.events.subscribe(this.onGameEnding, 'endGame');
		this.events.subscribe(this.onFileLoaded, 'fileLoaded');
	},

	start: function () {
		this.realtimeDataModel.gameDataField.set('gridSize', $('#gridSize').val());
		this.realtimeDataModel.gameDataField.set('gameStarted', 'true');
		this.createGame(false);
		this.playerTurn.startPlaying();
	},

	end: function () {
		this.realtimeDataModel.gameDataField.set('gameStarted', 'false');
	},

	onGameStarting: function (newValue, oldValue) {
		var isResume = false;
		if(oldValue == 'true' && newValue == 'true'){
			isResume = true;
		}
		this.createGame(isResume);
	},

	onGameEnding: function () {
		this.gameStarted = false;
		this.playerTurn.reset();
		this.realtimeDataModel.reset();
		if(this.game){
			this.game.el.remove();	
			this.game = null;
		}
	},

	onFileLoaded: function () {
		if(this.realtimeDataModel.gameDataField.get('gameStarted') == 'true'){
			this.gameStarted = true;
			this.createGame(this.realtimeDataModel.gameDataField.get('gridSize'), true);
		} else {
			this.gameStarted = false;
		}
	},

	createGame: function (isResume) {
		if(this.game){ return; }
		var size = parseInt(this.realtimeDataModel.gameDataField.get('gridSize'));

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
