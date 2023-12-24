import bcrypt from "bcryptjs";

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
