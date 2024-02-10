export function mockModules() {
  jest.mock('fs/promises');
  jest.mock('axios');
  jest.mock('@src/modules/BackendQueries');
  jest.mock('@src/modules/NetworkManager');
}
