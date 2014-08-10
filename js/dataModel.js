    
var RealtimeDataModel = function (events) {
    this.events = events;
    this.setup();
}

RealtimeDataModel.prototype = {
    
    clientId: '226035007736-0gr8itu2nsr0m9h5fdhpcmb370lre5mt.apps.googleusercontent.com',
    
    authButtonElementId: 'authorizeButton',
    
    autoCreate: true,
    
    defaultTitle: "New Realtime Quickstart File",
    
    newFileMimeType: null, // Using default.
    
    registerTypes: null, // No action.
    
    afterAuth: null, // No action.

    setup: function () {
        this.initializeModel = _.bind(this.initializeModel, this);
        this.onFileLoaded = _.bind(this.onFileLoaded, this);
        this.startRealtime = _.bind(this.startRealtime, this);
        this.onCollaboratorJoined = _.bind(this.onCollaboratorJoined, this);
        this.onCollaboratorLeft = _.bind(this.onCollaboratorLeft, this);
        this.onDataChange = _.debounce(this.onDataChange, 250);
        this.onDataChange = _.bind(this.onDataChange, this);
        this.onConfigChange = _.bind(this.onConfigChange, this);
    },

    initializeModel: function (model) {
        this.model = model;
        var collaborativePlayersMap = model.createMap({
            activePlayerIndex: 0,
            activePlayers: []
        });
        var collaborativeGameDataMap = model.createMap({
            gridSize: 4,
            consumedMoves: {},
            linesData: {},
            squaresData: {},
            squaresAnalysis: {},
            gameStarted: false,
        });

        model.getRoot().set('playersMap', collaborativePlayersMap);
        model.getRoot().set('gameDataMap', collaborativeGameDataMap);
    },

    onFileLoaded: function (realtimeDoc) {
        this.realtimeDoc = realtimeDoc;
        this.model = this.realtimeDoc.getModel();
        this.gameDataField = this.model.getRoot().get('gameDataMap');
        this.playersField = this.model.getRoot().get('playersMap');

        this.gameDataField.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, this.onGameDataChange);
        this.playersField.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, this.onPlayersMapChange);

        this.realtimeDoc.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_JOINED, this.onCollaboratorJoined);
        this.realtimeDoc.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_LEFT, this.onCollaboratorLeft);

        this.events.trigger('fileLoaded');
    },

    setFields: function (consumedMoves, linesData, squaresData, squareAnalysis) {
        this.model.beginCompoundOperation();
            this.consumedMovesField.setText(consumedMoves);
            this.linesDataField.setText(linesData);
            this.squaresDataField.setText(squaresData);
            this.squareAnalysisField.setText(squareAnalysis);
        this.model.endCompoundOperation();
    },

    startRealtime: function () {
        this.realtimeLoader = new rtclient.RealtimeLoader(this);
        this.realtimeLoader.start();
    },

    onCollaboratorJoined: function (evt) {
        this.events.trigger('collaboratorJoined', evt.collaborator);
    },

    onCollaboratorLeft: function (evt) {
        this.events.trigger('collaboratorLeft', evt.collaborator);
    },

    onDataChange: function () {
        console.log('Data Change');
        this.events.trigger(
            'dataChange',
            this.consumedMovesField.getText(),
            this.linesDataField.getText(),
            this.squaresDataField.getText(),
            this.squareAnalysisField.getText()
        );
    },

    reset: function () {
        this.initializeModel(this.model);
    },

    onGameDataChange: function (evt) {
        var event;
        switch () {
            case 'gridSize':
                break;
            case 'gameStarted':
                event = 'startGame';
                break;
            case 'endGame':
                event = 'endGame'
        }
        if(event){
            this.events.trigger(
                'startGame',
                parseInt(this.gameDataField.get('gridSize'))
            );
        }
        console.log(evt.property, evt.oldValue, evt.newValue);
    },

    onPlayersMapChange: function () {
        if (evt.property == 'activePlayers') {
            this.events.trigger(
                'playerUpdate',
                parseInt(evt.newValue)
            );
        }
    },

    addPlayerToDataModel: function (player) {
        var players = this.gameDataField.get('activePlayers');
        var doesPlayerExist = false;
        for (var i = players.length - 1; i >= 0; i--) {
            if(players[i].userId == player.userId){
                return;
            }
        };
        players.push(player);
        this.gameDataField.set('activePlayers', players);
    },

    updatePlayersToDataModel: function (players) {
        this.gameDataField.set('activePlayers', players);
    },

    removePlayerFromDataModel: function (userId) {
        var players = this.gameDataField.get('activePlayers');
        var removedPlayer;
        for (var i = players.length - 1; i >= 0; i--) {
            if(players[i].userId == player.userId){
                players.splice(i, 1);
            }
        };
        this.gameDataField.set('activePlayers', players);
    }

}
