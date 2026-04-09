// @ts-nocheck
import app from "../artifacts/api-server/src/app";
import serverless from "serverless-http";

export default serverless(app);
