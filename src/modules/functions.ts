import bcrypt from "bcryptjs";
import { isAbsolute } from "path";
import { platform } from "os";

export function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function combineMiddleware(mids: any) {
  return mids.reduce(function (a: any, b: any) {
    return function (req: any, res: any, next: any) {
      a(req, res, function (err: any) {
        if (err) {
          return next(err);
        }
        b(req, res, next);
      });
    };
  });
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export async function comparePasswords(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}

export function isAbsolutePath(path: string) {
  path = path.trim();
  let absolute = isAbsolute(path);
  const testForDriveLetter = /^[a-zA-Z]:/;

  // isAbsolute tests positive for an absolute path but from the current drive, like '//folder'.
  // This function must return false in this case, the path must be completly absolute
  if (platform() == "win32") {
    absolute = absolute && testForDriveLetter.test(path);
  }

  return absolute;
}
