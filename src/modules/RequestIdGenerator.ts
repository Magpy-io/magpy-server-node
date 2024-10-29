export function NewRequestId() {
  // random number between 0 and 26^3
  const r1 = Math.floor(Math.random() * (26 + 1)) % 26;
  const r2 = Math.floor(Math.random() * (26 + 1)) % 26;
  const r3 = Math.floor(Math.random() * (26 + 1)) % 26;

  return letters[r1] + letters[r2] + letters[r3];
}

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
