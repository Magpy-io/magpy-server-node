import { getMyPrivateIp } from '../modules/NetworkManager';
import { port, serverDiscoveryPort } from '../config/config';
import { GetServerName } from '../modules/serverDataManager';
import dgram from 'dgram';

export type DiscoveryResponse = {
  domain: 'magpy-discovery';
  type: 'response';
  name: string;
  ip: string;
  port: string;
};

export type DiscoveryRequest = {
  domain: 'magpy-discovery';
  type: 'request';
};

let socket: dgram.Socket | null = null;

export async function startServerDiscovery(): Promise<void> {
  return new Promise(res => {
    socket = dgram.createSocket('udp4');

    socket.on('listening', function () {
      const address = socket!.address();
      console.log('Discovery service listening on ' + address.address + ':' + address.port);
      res();
    });

    socket.on('message', function (message, remote) {
      console.log(
        'Received discovery message from ',
        remote.address + ':' + remote.port + ' - ' + message,
      );

      let request: any;

      try {
        request = JSON.parse(message.toString());
      } catch (e) {
        console.log('invalid discovery message.');
        return;
      }

      const expectedRequest: DiscoveryRequest = { domain: 'magpy-discovery', type: 'request' };

      if (JSON.stringify(request) != JSON.stringify(expectedRequest)) {
        console.log('invalid discovery message.');
        return;
      }

      getMyPrivateIp().then(localIp => {
        const response: DiscoveryResponse = {
          domain: 'magpy-discovery',
          type: 'response',
          name: GetServerName(),
          ip: localIp,
          port,
        };
        const responseSerialized = JSON.stringify(response);
        socket!.send(
          responseSerialized,
          0,
          responseSerialized.length,
          remote.port,
          remote.address,
        );
      });
    });

    socket.bind(serverDiscoveryPort);
  });
}

export function stopServerDiscovery() {
  if (socket != null) {
    socket.close();
  }
}
