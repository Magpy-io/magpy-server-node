import * as mockValues from "@tests/mockHelpers/getMyIpMockValues";

export async function getMyIp() {
  mockValues.checkFails();
  return "1.2.3.4";
}

export class ErrorIpServerUnreachable extends Error {
  constructor() {
    super();
    this.message = "Mock: error";
  }
}
