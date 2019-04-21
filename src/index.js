import io from 'socket.io-client';

// Dispatched from this middleware
export const YASIO_CONNECTED = 'IO:CONNECTED';
export const YASIO_SEND = 'IO:SEND';

// Used by this middleware
export const YASIO_DISCONNECTED = 'IO:DISCONNECTED';
export const YASIO_CONNECT = 'IO:CONNECT';
export const YASIO_DISCONNECT = 'IO:DISCONNECT';

export default function CreateYASIOMiddleWare( eventName = 'action') {
  let sockets = {};
  let emitBounds = {};

  const initialize = (dispatch, url, connectionId ) => {
	if(!sockets[connectionId]){
		sockets[connectionId] = io(url);
		let socket = sockets[connectionId];

		emitBounds[connectionId] = socket.emit.bind(socket);
		socket.on(eventName, dispatch);
		socket.on("connect", function(){dispatch({type:YASIO_CONNECTED, connectionId: connectionId})});
		socket.on("disconnect", function(data){
			dispatch({type:YASIO_DISCONNECTED, connectionId: connectionId, reason: data}); 
			// Delete sockets[connectionId]
			console.log("Disconnected due to: " + data)
		});
	} else {
		console.debug("Connection exists");
	}
  }

  return ({ dispatch }) => {
    return next => (action) => {

	if(action.type === YASIO_CONNECT){
		let url = action.url;
		let connectionId = action.connectionId;
		initialize(dispatch, url, connectionId);
	}

	if (action.type === YASIO_SEND) {
		console.log(action)
		let emit = emitBounds[action.connectionId];
		emit(eventName, action);
	}


	if (action.type === YASIO_DISCONNECT) {
		if(sockets[action.connectionId]){
			console.log("Client disconnects socket.io: " + action.connectionId)
			let socket = sockets[action.connectionId]
			socket.disconnect()
			delete sockets[action.connectionId]
		} else {
			console.log("Error: Cannot disconnect none-existing connection: " + action.connectionId)
		}
		
	}

	return next(action);
    };
  };
};
