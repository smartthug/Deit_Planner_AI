import dns from "node:dns";
import mongoose from "mongoose";

function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    // Throwing here (on demand) makes misconfiguration obvious without breaking builds.
    throw new Error("Missing required env var: MONGODB_URI");
  }
  return uri;
}

/**
 * Atlas `mongodb+srv://` URIs use DNS SRV lookups. On some networks (common on Windows)
 * the system resolver returns ECONNREFUSED for `querySrv`. Optional comma-separated
 * DNS servers (e.g. `8.8.8.8,8.8.4.4`) force a working resolver before connecting.
 */
function applyMongoDnsServersFromEnv() {
  const raw = process.env.MONGODB_DNS_SERVERS?.trim();
  if (!raw) return;
  const servers = raw.split(/[\s,]+/).filter(Boolean);
  if (servers.length > 0) {
    dns.setServers(servers);
  }
}

type CachedConnection = {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
};

declare global {
  var __dietai_mongoose__: CachedConnection | undefined;
}

let cached: CachedConnection | undefined = global.__dietai_mongoose__;

async function connect(): Promise<mongoose.Connection> {
  if (!cached) {
    cached = global.__dietai_mongoose__ = { conn: null, promise: null };
  }

  if (cached.conn && cached.conn.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    applyMongoDnsServersFromEnv();
    cached.promise = mongoose
      .connect(getMongoUri(), {
        autoIndex: true,
        // Prefer IPv4 when both are available; avoids some resolver / dual-stack issues.
        family: 4,
      })
      .then((m) => m.connection)
      .catch((err: unknown) => {
        cached!.promise = null;
        cached!.conn = null;
        // Plain Error keeps Next.js RSC/error boundaries from serializing Mongoose
        // TopologyDescription / Map / Set on the original ServerSelectionError.
        const message =
          err instanceof Error ? err.message : "Database connection failed.";
        throw new Error(message);
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached!.promise = null;
    cached!.conn = null;
    throw e;
  }
}

/** Atlas unreachable / firewall / IP allowlist — used to avoid throwing from session reads. */
export function isDatabaseUnreachableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const m = err.message;
  return (
    m.includes("Could not connect to any servers") ||
    m.includes("querySrv") ||
    m.includes("MongoNetworkError") ||
    m.includes("ReplicaSetNoPrimary")
  );
}

export async function connectToDatabase(): Promise<mongoose.Connection> {
  return connect();
}

