// Diagnostic: minimal handler to test if Vercel function execution works at all
export default async function handler(req: any, res: any) {
  res.status(200).json({
    ok: true,
    url: req.url,
    method: req.method,
    cwd: process.cwd(),
    node: process.version,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      HAS_DB: !!process.env.DATABASE_URL,
    },
  });
}
