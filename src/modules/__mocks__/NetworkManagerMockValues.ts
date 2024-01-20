let shouldNextRequestFail = false;

export function failNextRequest() {
  shouldNextRequestFail = true;
}

export function checkFails() {
  if (shouldNextRequestFail) {
    shouldNextRequestFail = false;
    throw new Error('Mock: Error getting my ip');
  }
}
