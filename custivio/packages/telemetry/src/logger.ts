import { getEnv } from "@custivio/config";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogRecord {
  level: LogLevel;
  message: string;
  requestId?: string;
  tenantId?: string;
  userId?: string;
  route?: string;
  durationMs?: number;
  errorCode?: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

const severity: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLog(level: LogLevel): boolean {
  return severity[level] >= severity[getEnv().LOG_LEVEL];
}

function writeLog(record: LogRecord): void {
  if (!shouldLog(record.level)) {
    return;
  }

  const line = JSON.stringify(record);

  if (record.level === "error") {
    console.error(line);
    return;
  }

  if (record.level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  debug(message: string, context?: Omit<LogRecord, "level" | "message" | "timestamp">): void {
    writeLog({ level: "debug", message, timestamp: new Date().toISOString(), ...context });
  },
  info(message: string, context?: Omit<LogRecord, "level" | "message" | "timestamp">): void {
    writeLog({ level: "info", message, timestamp: new Date().toISOString(), ...context });
  },
  warn(message: string, context?: Omit<LogRecord, "level" | "message" | "timestamp">): void {
    writeLog({ level: "warn", message, timestamp: new Date().toISOString(), ...context });
  },
  error(message: string, context?: Omit<LogRecord, "level" | "message" | "timestamp">): void {
    writeLog({ level: "error", message, timestamp: new Date().toISOString(), ...context });
  },
};
