    
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
        var consumedMoves = model.createString('');
        var linesData = model.createString('');
        var squaresData = model.createString('');
        var squareAnalysis = model.createString('');
        var playersMap = model.createMap({});

        var config = model.createMap({
            "gameStarted":"false"
        });

        model.getRoot().set('consumedMoves', consumedMoves);
        model.getRoot().set('linesData', linesData);
        model.getRoot().set('squareData', squaresData);
        model.getRoot().set('squareAnalysis', squareAnalysis);
        model.getRoot().set('config', config);
    },

    onFileLoaded: function (realtimeDoc) {
        this.realtimeDoc = realtimeDoc;
        this.model = this.realtimeDoc.getModel();
        this.consumedMovesField = this.model.getRoot().get('consumedMoves');
        this.linesDataField = this.model.getRoot().get('linesData');
        this.squaresDataField = this.model.getRoot().get('squareData');
        this.squareAnalysisField = this.model.getRoot().get('squareAnalysis');
        this.configField = this.model.getRoot().get('config');

        this.consumedMovesField.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, this.onDataChange);
        this.linesDataField.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, this.onDataChange);
        this.squaresDataField.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, this.onDataChange);
        this.squareAnalysisField.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, this.onDataChange);

        this.configField.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, this.onConfigChange);

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
        console.log('Collaborator Joined');
        this.events.trigger('collaboratorJoined', evt.collaborator);
    },

    onCollaboratorLeft: function (evt) {
        console.log('Collaborator left');
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

    onConfigChange: function (evt) {
        if(evt.property == 'gridSize'){

        } else if (evt.property == 'gameStarted') {
            if(evt.newValue == 'true'){
                this.events.trigger(
                    'startGame',
                    parseInt(this.configField.get('gridSize'))
                )
            } else if (evt.newValue == 'false'){
                this.events.trigger('endGame')
            }
        } else if (evt.property == 'activePlayerIndex') {
            this.events.trigger(
                'activePlayerIndexChange',
                parseInt(evt.newValue)
            );
        } else if (evt.property.indexOf('player-') == 0) {
            this.events.trigger(
                'playerUpdate',
                JSON.parse(evt.newValue)
            );
        }
        console.log(evt.property, evt.oldValue, evt.newValue);
    },

    updatePlayerToDataModel: function (player) {
        this.configField.set("player-" + player.userId, JSON.stringify(player));
    },

    removePlayerFromDataModel: function (player) {
        this.configField.delete("player-" + player.userId);
    },

    setActivePlayerIndex: function (index) {
        this.configField.set('activePlayerIndex', index);
    }

}
