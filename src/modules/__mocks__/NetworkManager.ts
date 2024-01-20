import * as mockValues from './NetworkManagerMockValues';

export async function getMyPublicIp() {
  mockValues.checkFails();
  return '1.2.3.4';
}

export async function getMyPrivateIp() {
  mockValues.checkFails();
  return '1.2.3.4';
}

export async function getGatewayIp() {
  mockValues.checkFails();
  return '1.2.3.4';
}

export function getMyPort() {
  mockValues.checkFails();
  return '1234';
}

export class ErrorIpServerUnreachable extends Error {
  constructor() {
    super();
    this.message = 'Mock: error';
  }
}
