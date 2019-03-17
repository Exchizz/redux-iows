import io from 'socket.io-client';

// Dispatched from this middleware
export const WSIO_CONNECTED = 'IO:CONNECTED';
export const WSIO_SEND = 'IO:SEND';

// Used by this middleware
export const WSIO_DISCONNECTED = 'IO:DISCONNECTED';
export const WSIO_CONNECT = 'IO:CONNECT';

export default function CreateWSIOMiddleWare( eventName = 'action') {
  let sockets = {};
  let emitBounds = {};

  const initialize = (dispatch, url, connectionId ) => {
	if(!sockets[connectionId]){
		sockets[connectionId] = io(url);
		let socket = sockets[connectionId];

		emitBounds[connectionId] = socket.emit.bind(socket);
		socket.on(eventName, dispatch);
		socket.on("connect", function(){dispatch({type:WSIO_CONNECTED, connectionId: connectionId})});
		socket.on("disconnect", function(data){dispatch({type:WSIO_DISCONNECTED, connectionId: connectionId, reason: data})});
	} else {
		console.debug("Connection exists");
	}
  }

  return ({ dispatch }) => {
    return next => (action) => {

	if(action.type === WSIO_CONNECT){
		let url = action.url;
		let connectionId = action.connectionId;
		initialize(dispatch, url, connectionId);
	}

	if (action.type === WSIO_SEND) {
		let emit = emitBounds[action.connectionId];
		emit(eventName, action);
	}

	return next(action);
    };
  };
};
