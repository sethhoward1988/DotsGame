Chat = function (dataModel, events) {
	this.dataModel = dataModel;
	this.events = events;
	this.setup();
}

Chat.prototype = {

	chatBoxHtml: '<div class="chat-container">' +
					'<h1>Chat</h1>' +
					'<div class="chatBox"></div>' +
					'<input type="text" placeholder="say something..."></input>' +
					'<button class="pure-button">Send</button>' +
				'</div>',

	messageLocalHtml: _.template('<div class="local-message"><span class="name"><%= name %>: </span><%= text %></div>'),

	messageRemoteHtml: _.template('<div class="remote-message"><span class="name"><%= name %>: </span><%= text %></div>'),

	historyThreshold: 100, // The number of messages we're willing to keep a history of

	setup: function () {
		this.$el = $(this.chatBoxHtml);
		this.$chatBox = this.$el.find('.chatBox');
		this.$chatInput = this.$el.find('input');

		this.onChatKeyup = _.bind(this.onChatKeyup, this);
		this.onSendClick = _.bind(this.onSendClick, this);
		this.onChatUpdate = _.bind(this.onChatUpdate, this);
		this.onFileLoaded = _.bind(this.onFileLoaded, this);

		this.$chatInput.on('keyup', this.onChatKeyup);
		this.$el.find('button').on('click', this.onSendClick);

		this.events.subscribe(this.onChatUpdate, 'chatUpdate');
		this.events.subscribe(this.onFileLoaded, 'fileLoaded');
	},

	createChat: function (message, isRemote) {
		var messageObject = {
			name: message.name,
			text: message.text
		}
		var html = isRemote ? this.messageRemoteHtml(messageObject) : this.messageLocalHtml(messageObject);
		this.$chatBox.append(html);
	},

	sendChat: function () {
		var text = this.$chatInput.val();
		if(!text){
			return;
		}
		var message = {
			name: this.me.displayName,
			text: text
		}
		this.createChat(message, false);
		this.dataModel.chatList.insert(0, message);
		while(this.dataModel.chatList.length > this.historyThreshold){
			this.dataModel.chatList.remove(this.dataModel.length - 1);
		}
		this.$chatInput.val('');
	},

	onChatKeyup: function (evt) {
		if(evt.keyCode == 13){
			this.sendChat();
		}
	},

	onSendClick: function (evt) {
		this.sendChat();
	},

	onChatUpdate: function (values) {
		for (var i = values.length - 1; i >= 0; i--) {
			this.createChat(values[i], true);
		};
	},

	onFileLoaded: function () {
		this.chatInitialized = true;
		var collaborators = this.dataModel.realtimeDoc.getCollaborators();
		for (var i = collaborators.length - 1; i >= 0; i--) {
			if(collaborators[i].isMe){
				this.me = collaborators[i];
				i = -1;
			}
		};
	}

}