const net = require('net');

const retryInterval = 2000;
const timeoutDuration = 1000 * 150;

class Client {
	constructor(host, port, clientName){
		this.buffer = '';
		this.connected = false;
		this.eventListeners = {};
		this.host = host;
		this.name = clientName;
		this.nextID = 1;
		this.pauseSending = false;
		this.pendingResults = {};
		this.port = port;
		this.processingItems = false;
		this.queue = [];
		this.reconnecting = false;
		this.reconnectTimer = null;

		this.Connect();
		setInterval(() => {this.RemoveStaleFromQueues();}, 5000);
		setInterval(() => {this.OverflowProtection();}, 1000 * 60 * 60 * 24);
	}

	Connect(){
		this.client = new net.Socket();
		this.client.connect({port: this.port, host: this.host});
		this.client.on('close', () => {
			this.connected = false;
			if(!this.reconnecting){
				this.reconnectTimer = setInterval(() => this.Connect(), retryInterval);
				this.reconnecting = true;
			}
		});
		this.client.on('connect', () => {
			this.connected = true;
			this.pauseSending = false;
			Object.keys(this.eventListeners).forEach(eventName => {
				this.Send('joinRoom', eventName);
			});
			this.reconnecting = false;
			clearInterval(this.reconnectTimer);
			this.Process();
		});

		this.client.on('data', data => {
			this.buffer += data;
			this.ParseBuffer();
		});

		this.client.on('error', () => {
			//Do nothing. We don't want it to throw as it'll reconnect above due to the connection ending
			//The linux server we run on was not throwing ECONNRESET for all disconnects, so we don't handle it
			//anymore.
		});

	}
	Process(){
		if(!this.connected){
			return;
		}
		this.processingItems = true;
		while(this.queue.length > 0){
			const {method, data, doNotReturn, resolve, createdAt} = this.queue.shift();
			let id = false;
			if(!doNotReturn){
				this.pendingResults[this.nextID] = {resolve, createdAt};
				id = this.nextID;
				this.nextID++;
			}
			this.client.write(this.CreateMessage(method, data, id));
		}
		this.processingItems = false;
	}

	Send(method, data, doNotReturn){
		return new Promise((resolve) => {
			this.queue.push({method, data, doNotReturn, resolve, createdAt: Date.now()});
			if(!this.processingItems && !this.pauseSending){
				this.Process();
			}
		});
	}

	Listen(eventName, func){
		this.eventListeners[eventName] = func;
		if(this.connected){
			this.Send('joinRoom', eventName);
		}
	}

	StopListening(eventName){
		delete this.eventListeners[eventName];
		this.Send('leaveRoom', eventName);
	}

	CreateMessage(method, data, id){
		const json = JSON.stringify({data, id, method});
		return `${json.length},${json}`;
	}

	ParseBuffer(){
		let remainingBuffer = this.buffer;
		let keepGoing = true;
		
		while(keepGoing){
			const splitIndex = remainingBuffer.indexOf(',');
			if(splitIndex === -1){
				keepGoing = false;
				break;
			}

			const jsonLength = Number(remainingBuffer.slice(0, splitIndex));
			if(remainingBuffer.length <= splitIndex + jsonLength){
				break;
			}
			
			const {id, result} = JSON.parse(remainingBuffer.slice(splitIndex + 1, splitIndex + 1 + jsonLength));
			if(id === 'ping'){
				this.Send('pong', this.name);
			} else if(id === 'pauseForReconnect'){
				this.pauseSending = true;
			} else if(this.pendingResults[id]){
				this.pendingResults[id].resolve(result);
				delete this.pendingResults[id];
			} else if(this.eventListeners[id]){
				this.eventListeners[id](result);
			}
			remainingBuffer = remainingBuffer.slice(splitIndex + 1 + jsonLength);
			if(remainingBuffer.length === 0){
				keepGoing = false;
			}
		}
		
		this.buffer = remainingBuffer;
	}

	RemoveStaleFromQueues(){
		while(this.queue.length > 0 && (this.queue[0].createdAt + timeoutDuration) < Date.now()){
			const item = this.queue.shift();
			if(item.callback){
				item.callback(undefined);
			}
		}
		Object.keys(this.pendingResults).forEach(id => {
			if((this.pendingResults[id].createdAt + timeoutDuration) < Date.now()){
				this.pendingResults[id].resolve(undefined);
				delete this.pendingResults[id];
			}
		});
	}

	OverflowProtection(){
		//if we even hit this, it would be a good day.
		if(this.nextID >= 1000000000000){
			this.nextID = 0;
		}
	}
}

module.exports = Client;