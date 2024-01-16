export {};
export type UserType = {
  _id: string;
  email: string;
  name: string;
  serverId: string | null;
};

export type ServerType = {
  _id: string;
  name: string;
  ip: string;
  owner: UserType | null;
};

export type TokenAuthentification =
  | "no"
  | "user"
  | "server"
  | "set-token-user"
  | "set-token-server";
