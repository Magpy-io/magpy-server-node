const network = require("network");
import * as config from "../config/config";

export async function getMyPublicIp(): Promise<string> {
  return new Promise((resolve, reject) => {
    network.get_public_ip((err: any, ip: string) => {
      if (err) {
        reject(err);
      } else {
        resolve(ip);
      }
    });
  });
}

export async function getMyPrivateIp(): Promise<string> {
  return new Promise((resolve, reject) => {
    network.get_private_ip((err: any, ip: string) => {
      if (err) {
        reject(err);
      } else {
        resolve(ip);
      }
    });
  });
}

export async function getGatewayIp(): Promise<string> {
  return new Promise((resolve, reject) => {
    network.get_gateway_ip((err: any, ip: string) => {
      if (err) {
        reject(err);
      } else {
        resolve(ip);
      }
    });
  });
}

export function getMyPort(): string {
  return config.port;
}
