import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { cookies } from '../cookie'; 

const BASE_URL = 'https://localhost:7099';

const connectToSignalR = (onMessageReceived) => {
  const connection = new HubConnectionBuilder()
    .withUrl(`${BASE_URL}/messengerHub`, {
      accessTokenFactory: () => {
        let token = cookies.get('jwt-access');
        if (token) {
          token = token.replace(/"/g, '');
          return token;
        }
        throw new Error('No JWT token found in cookies');
      },
    })
    .configureLogging(LogLevel.Information)
    .withAutomaticReconnect()
    .build();

  connection.on('ReceiveMessage', (message) => {
    onMessageReceived(message);
  });

  connection.on('ReceiveReaction', ({ messageId, reaction }) => {
    onMessageReceived({ messageId, reaction }); // Adjust if needed
  });

  connection.start()
    .then(() => console.log('SignalR Connected'))
    .catch((err) => console.error('SignalR Connection Error:', err));

  return connection;
};

export default connectToSignalR;