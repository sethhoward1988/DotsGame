    
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
        this.onGameDataChange = _.bind(this.onGameDataChange, this);
        this.onPlayersMapChange = _.bind(this.onPlayersMapChange, this);
        this.onChatListAdd = _.bind(this.onChatListAdd, this);
        this.onColorListRemove = _.bind(this.onColorListRemove, this);
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
        var collaborativeChatList = model.createList({});
        var colorList = model.createList(CSS_COLOR_NAMES);

        model.getRoot().set('playersMap', collaborativePlayersMap);
        model.getRoot().set('gameDataMap', collaborativeGameDataMap);
        model.getRoot().set('chatList', collaborativeChatList);
        model.getRoot().set('colorList', colorList);
    },

    onFileLoaded: function (realtimeDoc) {
        this.realtimeDoc = realtimeDoc;
        this.model = this.realtimeDoc.getModel();
        this.gameDataField = this.model.getRoot().get('gameDataMap');
        this.playersField = this.model.getRoot().get('playersMap');
        this.chatList = this.model.getRoot().get('chatList');
        this.colorList = this.model.getRoot().get('colorList');

        this.gameDataField.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, this.onGameDataChange);
        this.playersField.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, this.onPlayersMapChange);
        this.chatList.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, this.onChatListAdd);
        this.colorList.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, this.onColorListRemove);

        this.realtimeDoc.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_JOINED, this.onCollaboratorJoined);
        this.realtimeDoc.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_LEFT, this.onCollaboratorLeft);

        this.addMe();
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

    onChatListAdd: function (evt) {
        console.log(evt);
        if(evt.isLocal){
            return;
        }
        this.events.trigger('chatUpdate', evt.values);
    },

    onCollaboratorJoined: function (evt) {
        this.events.trigger('collaboratorJoined', evt.collaborator);
    },

    onCollaboratorLeft: function (evt) {
        this.events.trigger('collaboratorLeft', evt.collaborator);
    },

    reset: function () {
        this.model.beginCompoundOperation('reset');
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
            this.colorList.clear();
            this.colorList.pushAll(CSS_COLOR_NAMES);
        this.model.endCompoundOperation();
    },

    onGameDataChange: function (evt) {
        if(evt.compoundOperationNames[0] == 'move'){
            this.events.trigger(
                'receiveMove',
                this.gameDataField.get('consumedMoves'),
                this.gameDataField.get('linesData'),
                this.gameDataField.get('squaresData'),
                this.gameDataField.get('squaresAnalysis'))
        } else if (evt.compoundOperationNames[0] == 'reset'){
            this.addMe();
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

    onColorListRemove: function (evt) {
        if(evt.isLocal){
            return;
        }
        if(evt.values[0] == this.me.color){
            this.me.color = this.getOrAssignColor(this.me.userId, true);
            this.updatePlayerToDataModel(this.me);
        }
    },

    setPlayerData: function (players, activePlayerIndex) {
        this.playersField.set('playerData', {
            activePlayers: players,
            activePlayerIndex: activePlayerIndex
        });  
    },

    addMe: function () {
        if(this.gameDataField.get('gameStarted') == 'true'){
            // Game started, can't add anymore
            return;
        }
        var playerData = this.playersField.get('playerData');
        var collaborators = this.getCollaborators();
        
        for (var i = collaborators.length - 1; i >= 0; i--) {
            if(collaborators[i].isMe){
                var duplicate = _.find(playerData.activePlayers, function (activePlayer){
                    return activePlayer.userId == collaborators[i].userId;
                });
                if(!duplicate){
                    var player = this.addMeToDataModel(collaborators[i]);
                } else {
                    this.events.trigger('updatePlayersUI');
                    this.me = duplicate;
                }
                i = -1;
            }
        };
    },

    addMeToDataModel: function (collaborator) {
        var playerData = this.playersField.get('playerData');
        var players = playerData.activePlayers;

        var player = {
            name: collaborator.displayName,
            score: 0,
            color: this.getOrAssignColor(collaborator.userId, false),
            photoUrl: collaborator.photoUrl,
            userId: collaborator.userId,
            sessionId: collaborator.sessionId,
            isActive: false
        }

        this.me = player;

        players.push(player);

        this.setPlayerData(players, playerData.activePlayerIndex);
    },

    updatePlayerToDataModel: function (player) {
        var playerData = this.playersField.get('playerData');
        var players = playerData.activePlayers;
        for (var i = players.length - 1; i >= 0; i--) {
            if(players[i].userId == player.userId){
                players.splice(i, 1);
            }
        };
        players.push(player);
        this.setPlayerData(players, playerData.activePlayerIndex);
    },

    removePlayerFromDataModel: function (photoUrl) {
        var playerData = this.playersField.get('playerData');
        var players = playerData.activePlayers;
        var removedPlayer;
        for (var i = players.length - 1; i >= 0; i--) {
            if(players[i].photoUrl == photoUrl){
                players.splice(i, 1);
            }
        };
        this.setPlayerData(players, playerData.activePlayerIndex);
    },

    getCollaborators: function () {
        return this.realtimeDoc.getCollaborators();
    },

    getOrAssignColor: function (userId, forceRepick) {
        if(!forceRepick){
            var player = this.getPlayer(userId);
            if(player){
                return player.color;
            }
        }
        var colors = this.colorList.asArray();
        var randomIndex = Math.floor(Math.random() * colors.length);
        var randomColor = colors[randomIndex];
        this.colorList.remove(randomIndex);
        return randomColor;
    },

    getPlayer: function (userId) {
        var playerData = this.playersField.get('playerData');
        var players = playerData.activePlayers;
        for (var i = players.length - 1; i >= 0; i--) {
            if(players[i].userId == userId){
                return players[i];
            }
        };
    },

}
