function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function combineMiddleware(mids: any) {
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

export { timeout, combineMiddleware };
