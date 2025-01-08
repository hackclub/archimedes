import pino from "pino";
import { env } from "./env";

export default pino({
    level: env.LOG_LEVEL
})