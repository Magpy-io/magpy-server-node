import { getMyPrivateIp } from '../modules/NetworkManager';
import { port, serverDiscoveryPort } from '../config/config';
import { GetServerName } from '../modules/serverDataManager';
import dgram from 'dgram';
import { Logger } from '../modules/Logger';

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
      Logger.info('Discovery service listening on ' + address.address + ':' + address.port);
      res();
    });

    socket.on('message', function (message, remote) {
      Logger.info(
        'Received discovery message from ',
        remote.address + ':' + remote.port + ' - ' + message,
      );

      let request: any;

      try {
        request = JSON.parse(message.toString());
      } catch (e) {
        Logger.warn('invalid discovery message.');
        return;
      }

      const expectedRequest: DiscoveryRequest = { domain: 'magpy-discovery', type: 'request' };

      if (JSON.stringify(request) != JSON.stringify(expectedRequest)) {
        Logger.warn('invalid discovery message.');
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
