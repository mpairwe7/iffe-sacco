/**
 * Vercel Serverless Entry Point
 * Imports the pre-bundled Hono app (built by vercel-build.sh)
 */
import { handle } from "hono/vercel";
import { app } from "../dist/app.js";

export default handle(app);
