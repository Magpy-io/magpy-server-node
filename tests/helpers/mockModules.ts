export function mockModules() {
  jest.mock("fs/promises");
  jest.mock("axios");
  jest.mock("@src/modules/backendImportedQueries");
  jest.mock("@src/modules/getMyIp");
}
