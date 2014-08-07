    
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
        this.onPlayersArrayChange = _.bind(this.onPlayersArrayChange, this);
        this.onConfigChange = _.bind(this.onConfigChange, this);
    },

    initializeModel: function (model) {
        this.model = model;
        var consumedMoves = model.createString('');
        var linesData = model.createString('');
        var squaresData = model.createString('');
        var squareAnalysis = model.createString('');
        var playersArray = model.createString('');

        var config = model.createMap({
            "gameStarted":"false"
        });

        model.getRoot().set('consumedMoves', consumedMoves);
        model.getRoot().set('linesData', linesData);
        model.getRoot().set('squareData', squaresData);
        model.getRoot().set('squareAnalysis', squareAnalysis);
        model.getRoot().set('playersArray', playersArray);
        model.getRoot().set('config', config);
    },

    onFileLoaded: function (realtimeDoc) {
        this.realtimeDoc = realtimeDoc;
        this.model = this.realtimeDoc.getModel();
        this.consumedMovesField = this.model.getRoot().get('consumedMoves');
        this.linesDataField = this.model.getRoot().get('linesData');
        this.squaresDataField = this.model.getRoot().get('squareData');
        this.squareAnalysisField = this.model.getRoot().get('squareAnalysis');
        this.playersArrayField = this.model.getRoot().get('playersArray');
        this.configField = this.model.getRoot().get('config');

        this.consumedMovesField.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, this.onDataChange);
        this.linesDataField.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, this.onDataChange);
        this.squaresDataField.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, this.onDataChange);
        this.squareAnalysisField.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, this.onDataChange);
        this.playersArrayField.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, this.onDataChange);

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

    setActivePlayer: function (userId) {
        this.configField.set('activePlayer', userId);
    },

    startRealtime: function () {
        this.realtimeLoader = new rtclient.RealtimeLoader(this);
        this.realtimeLoader.start();
    },

    onCollaboratorJoined: function (evt) {
        console.log('Collaborator Joined');
        this.events.trigger('collaboratorJoined', evt.collaborator);
    },

    onCollaboratorLeft: function () {
        console.log('Collaborator left');
        this.events.trigger('collaboratorLeft');
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

    onPlayersArrayChange: function () {
        console.log('Players Array Change');
        this.events.trigger(
            'playersArrayChange',
            this.playersArrayField.getText()
        );
    },

    reset: function () {

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
                'changeTurn',
                parseInt(evt.newValue)
            );
        }
        console.log(evt);
    }

}
