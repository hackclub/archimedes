import pino from "pino";
import { env } from "./env";

const transport = pino.transport({
    targets: [
        { target: "pino/file", level: env.LOG_LEVEL },
        {
            target: "@logtail/pino",
            options: { sourceToken: env.BETTER_STACK_SOURCE_TOKEN },
            level: env.LOG_LEVEL
        }
    ]
});

export default pino(transport)