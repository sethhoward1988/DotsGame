    
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
        // this.onGameDataChange = _.debounce(this.onGameDataChange, 250);
        this.onGameDataChange = _.bind(this.onGameDataChange, this);
        this.onPlayersMapChange = _.bind(this.onPlayersMapChange, this);

    },

    initializeModel: function (model) {
        this.model = model;
        var collaborativePlayersMap = model.createMap({
            playerData: {
                activePlayerIndex: 0,
                activePlayers: []
            }
        });
        var collaborativeGameDataMap = model.createMap({
            gridSize: 4,
            consumedMoves: '',
            linesData: [],
            squaresData: [],
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

        this.createPlayers();
        this.events.trigger('fileLoaded');
    },

    setGameData: function (consumedMoves, linesData, squaresData, squaresAnalysis) {
        this.model.beginCompoundOperation('move');
            this.gameDataField.set('consumedMoves', consumedMoves);
            this.gameDataField.set('linesData', linesData);
            this.gameDataField.set('squaresData', squaresData);
            this.gameDataField.set('squaresAnalysis', squaresAnalysis);
        this.model.endCompoundOperation('move');
    },

    startRealtime: function () {
        this.realtimeLoader = new rtclient.RealtimeLoader(this);
        this.realtimeLoader.start();
    },

    createPlayers: function () {
        var collaborators = this.realtimeDoc.getCollaborators();
        var players = [];
        
        for (var i = collaborators.length - 1; i >= 0; i--) {
            players.push(new Player(
                collaborators[i].displayName,
                collaborators[i].color,
                collaborators[i].photoUrl,
                collaborators[i].userId,
                collaborators[i].sessionId,
                collaborators[i].isMe
                ));
        };

        this.playersField.set('activePlayers', players);
    },

    onCollaboratorJoined: function (evt) {
        this.events.trigger('collaboratorJoined', evt.collaborator);
    },

    onCollaboratorLeft: function (evt) {
        this.events.trigger('collaboratorLeft', evt.collaborator);
    },

    reset: function () {
        this.model.beginCompoundOperation('move');
            this.playersField.set('playerData', {
                activePlayerIndex: 0,
                activePlayers: []
            });
            this.gameDataField.set('gridSize', 4);
            this.gameDataField.set('consumedMoves', '');
            this.gameDataField.set('linesData', []);
            this.gameDataField.set('squaresData', []);
            this.gameDataField.set('squaresAnalysis', {});
            this.gameDataField.set('gameStarted', false);
        this.model.endCompoundOperation();
        var collaborators = this.realtimeDoc.getCollaborators();
        for (var i = collaborators.length - 1; i >= 0; i--) {
            this.onCollaboratorJoined({
                collaborator: collaborators[i]
            });
        };
    },

    onGameDataChange: function (evt) {
        if(evt.compoundOperationNames[0] = 'move'){
            this.events.trigger(
                'receiveMove',
                this.gameDataField.get('consumedMoves'),
                this.gameDataField.get('linesData'),
                this.gameDataField.get('squaresData'),
                this.gameDataField.get('squaresAnalysis'))
        }
        var event;
        switch (evt.property) {
            case 'gridSize':
                break;
            case 'gameStarted':
                if(evt.newValue == 'true'){
                    event = 'startGame';
                } else {
                    event = 'endGame'    
                }
                break;
        }
        this.events.trigger(
            event ? event : evt.property,
            evt.newValue,
            evt.oldValue);
        console.log(evt.property, evt.oldValue, evt.newValue);
    },

    onPlayersMapChange: function (evt) {
        this.events.trigger('playersUpdate');
    },

    addPlayerToDataModel: function (player) {
        var playerData = this.playersField.get('playerData');
        var players = playerData.activePlayers;
        var doesPlayerExist = false;
        for (var i = players.length - 1; i >= 0; i--) {
            if(players[i].userId == player.userId){
                return;
            }
        };
        players.push(player);
        this.setPlayerData(players, playerData.activePlayerIndex);
    },

    setPlayerData: function (players, activePlayerIndex) {
        this.playersField.set('playerData', {
            activePlayers: players,
            activePlayerIndex: activePlayerIndex
        });  
    },

    removePlayerFromDataModel: function (userId) {
        var playerData = this.playersField.get('playerData');
        var players = playerData.activePlayers;
        var removedPlayer;
        for (var i = players.length - 1; i >= 0; i--) {
            if(players[i].userId == userId){
                players.splice(i, 1);
            }
        };
        this.setPlayerData(players, playerData.activePlayerIndex);
    }

}
