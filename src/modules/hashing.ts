function charToBase64(s: string) {
  let n = s.charCodeAt(0);

  if (n == 43) {
    return 62;
  } else if (n == 47) {
    return 63;
  } else if (48 <= n && n <= 57) {
    return n - 48 + 52;
  } else if (65 <= n && n <= 90) {
    return n - 65;
  } else if (97 <= n && n <= 122) {
    return n - 97 + 26;
  } else if (n == 61) {
    // '='
    return 0;
  } else {
    throw `invalid char: s must be a valid base64 char, s=${s[0]}`;
  }
}

function base64ToChar(n: number) {
  if (n < 0 || n > 63) {
    throw `invalid number: n must be in range [0, 63], n=${n}`;
  }
  let c = 0;
  if (n < 26) {
    c = n + 65;
  } else if (n < 52) {
    c = n - 26 + 97;
  } else if (n < 62) {
    c = n - 52 + 48;
  } else if (n == 62) {
    c = 43;
  } else {
    // n == 63
    c = 47;
  }
  return String.fromCharCode(c);
}

function hashString(s: string, hashLen = 32) {
  let n = s.length;
  if (n % hashLen !== 0) {
    let paddingLen = hashLen - (n % hashLen);
    let padding = new Array(paddingLen + 1).join("A");
    s = s + padding;
  }
  let nbRows = s.length / hashLen;
  let ret = "";
  for (let i = 0; i < hashLen; i++) {
    let c = 0;

    for (let j = 0; j < nbRows; j++) {
      c = c + charToBase64(s[j * hashLen + i]);
    }
    c = c % 64;
    ret = ret + base64ToChar(c);
  }
  return ret;
}

export { hashString };
