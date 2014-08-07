
$(function(){

	window.gameController = new GameController($('#game'));

	$('#add').on('click', function (evt) {
		gameController.addPlayer($('#playerInput').val(), $("#color").val());
	});

	$('#start').on('click', function () {
		gameController.createGame($('#gridSize').val());
	});
});


var GameController = function (el) {
	this.$el = $(el);
	this.$playersPanel = $('<div class="players"></div');
	this.$gameContainer = $('<div class="dots-container"></div>');
	this.$el.append(this.$playersPanel).append(this.$gameContainer);
	this.events = new Events();
	this.playerTurn = new PlayerTurn(this.$playersPanel, this.events);
}

GameController.prototype = {

	createGame: function (size) {
		if(!this.playerTurn.isReady){ return; }
		if(size < 4){
			alert("Grid is too small, must be larger than 4!");
			return;
		}

		this.playerTurn.startPlaying();

		this.game = new Game({
			gridSize: size,
			el: this.$gameContainer,
			playerTurn: this.playerTurn
		});
	},

	addPlayer: function (name, color) {
		this.playerTurn.addPlayer(name, color)
	},

	clearPlayers: function () {
		this.playerTurn.clearPlayers();
	}

}