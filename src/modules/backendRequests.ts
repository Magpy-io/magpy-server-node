import axios from "axios";
import { ErrorBackendUnreachable } from "@src/types/ExceptionTypes";
const url = process.env.BACK_HOST + ":" + process.env.BACK_PORT;

async function registerServer(
  userToken: string,
  serverKey: string,
  serverName: string,
  serverIp: string
) {
  try {
    const response = await axios.post(
      url + "/registerServer",
      {
        name: serverName,
        ipAddress: serverIp,
        serverKey: serverKey,
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );
    return response.data;
  } catch (err: any) {
    return handleAxiosError(err);
  }
}

async function getServerToken(serverId_p: string, serverKey: string) {
  try {
    const response = await axios.post(url + "/getServerToken", {
      id: serverId_p,
      key: serverKey,
    });
    return {
      ...response.data,
      token: response.headers["authorization"].toString().split(" ")[1],
    };
  } catch (err: any) {
    return handleAxiosError(err);
  }
}

async function getServerInfo(serverToken: string) {
  try {
    const response = await await axios.post(
      url + "/getServerInfo",
      {},
      {
        headers: {
          Authorization: `Bearer ${serverToken}`,
        },
      }
    );
    return response.data;
  } catch (err: any) {
    return handleAxiosError(err);
  }
}

async function whoAmI(userToken: string) {
  try {
    const response = await axios.post(
      url + "/whoAmI",
      {},
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );
    return response.data;
  } catch (err: any) {
    return handleAxiosError(err);
  }
}

function handleAxiosError(err: any) {
  if (err.response) {
    return err.response.data;
  } else if (err.request) {
    throw new ErrorBackendUnreachable("Backend unreachable");
  } else {
    throw err;
  }
}

export { registerServer, getServerInfo, getServerToken, whoAmI };
