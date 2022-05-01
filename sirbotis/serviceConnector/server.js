//TODO: Make separate buffers per socket
const net = require('net');

class Server {
	constructor(port){
		this.port = port;
		this.connectedSockets = [];
		this.eventListeners = {};
		this.lastConnected = {};
		this.internalFunctions = {
			adminShutdown: this.StopApp.bind(this),
			getConnected: this.GetConnectionStatus.bind(this),
			joinRoom: this.JoinRoom.bind(this),
			leaveRoom: this.LeaveRoom.bind(this),
			pong: this.Pong.bind(this)
		};
		this.processingFunctionsCount = 0;
		this.rooms = {};
		this.startTime = Date.now();

		this.server = new net.Server();
		this.server.listen(port);

		this.server.on('connection', socket => {
			let timer = null;
			this.connectedSockets.push(socket);
			socket.rooms = [];
			socket.buffer = '';
			socket.processingBuffer = false;
			socket.on('data', data => {
				socket.buffer += data;
				if(!this.parsingBuffer){
					this.ParseBuffer(socket);
				}
			});

			socket.on('close', () => {
				clearInterval(timer);
				this.connectedSockets.splice(this.connectedSockets.indexOf(this), 1);
			});

			socket.on('error', () => {
				socket.rooms.forEach(roomName => this.LeaveRoom(socket, roomName));
			});

			timer = setInterval(() => {
				socket.write(this.CreateMessage(null, 'ping'));
			}, 2000);
		});
	}

	CreateMessage(data, id){
		const json = JSON.stringify({id, result: data});
		return `${json.length},${json}`;
	}

	addEvent(event, func){
		this.eventListeners[event] = func;
	}

	async ParseBuffer(socket){
		let keepGoing = true;
		this.parsingBuffer = true;
		while(keepGoing){
			const splitIndex = socket.buffer.indexOf(',');
			if(splitIndex === -1){
				keepGoing = false;
				break;
			}

			const jsonLength = Number(socket.buffer.slice(0, splitIndex));
			if(socket.buffer.length <= splitIndex + jsonLength){
				break;
			}

			const {data, id, method} = JSON.parse(socket.buffer.slice(splitIndex + 1, splitIndex + 1 + jsonLength));
			socket.buffer = socket.buffer.slice(splitIndex + 1 + jsonLength);
			if(socket.buffer.length === 0){
				keepGoing = false;
			}
			
			if(this.eventListeners[method]){
				this.processingFunctionsCount++;
				this.eventListeners[method](data)
					.then(result => {
						if(id){
							socket.write(this.CreateMessage(result, id));
							this.processingFunctionsCount--;
						}
					})
					.catch(() => {
						if(id){
							socket.write(this.CreateMessage(null, id));
							this.processingFunctionsCount--;
						}
					});
			} else if(this.internalFunctions[method]){
				this.internalFunctions[method](socket, data, id);
			}
		}
		this.parsingBuffer = false;
	}

	EmitToRoom(roomName, data){
		if(!this.rooms[roomName]){
			return;
		}

		this.rooms[roomName].forEach(socket => {
			socket.write(this.CreateMessage(data, roomName));
		});
	}

	GetConnectionStatus(socket, data, id){
		socket.write(this.CreateMessage({connections: this.lastConnected, startTime: this.startTime}, id));
	}

	JoinRoom(socket, roomName){
		if(socket.rooms.indexOf(roomName) === -1){
			socket.rooms.push(roomName);
		}

		if(this.rooms[roomName]){
			if(this.rooms[roomName].indexOf(socket) === -1){
				this.rooms[roomName].push(socket);
			}
		} else {
			this.rooms[roomName] = [socket];
		}
	}

	LeaveRoom(socket, roomName){
		socket.rooms = socket.rooms.filter(room => room !== roomName);

		if(this.rooms[roomName]){
			this.rooms[roomName] = this.rooms[roomName].filter(socketInRoom => socketInRoom !== socket);
		}
	}
	
	StopApp(){
		this.connectedSockets.forEach(socket => {
			socket.write(this.CreateMessage(null, 'pauseForReconnect'));
		});
		//Give some time for currently processing functions to exit.
		//Timeout is the cutoff, Interval checks if we can close earlier.
		setTimeout(() => process.exit(1), 10000);

		setInterval(() => {
			if(this.processingFunctionsCount === 0){
				process.exit(1);
			}
		}, 1000);
	}

	Pong(socket, clientName){
		this.lastConnected[clientName] = Date.now();
	}
}

module.exports = Server;