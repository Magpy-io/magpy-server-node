import axios from "axios";

const url = "http://api.ipify.org/?format=json";

export async function getMyIp(): Promise<string> {
  try {
    const response: any = await axios.get(url);
    return response.data.ip;
  } catch (err: any) {
    if (err.response) {
      throw new Error(`Error handling '${url}' response`);
    } else if (err.request) {
      throw new ErrorIpServerUnreachable();
    } else {
      throw err;
    }
  }
}

export class ErrorIpServerUnreachable extends Error {
  constructor() {
    super();
    this.message = "Could not reach host:'" + url + "' to get ip address";
  }
}
