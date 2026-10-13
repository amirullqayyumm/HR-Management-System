
require("dotenv").config();

const session = require("express-session");
const connectPgSimple = require("connect-pg-simple");
const { Pool } = require("pg");

const PgSession = connectPgSimple(session);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing.");
}

if (
  !process.env.SESSION_SECRET ||
  process.env.SESSION_SECRET.length < 64
) {
  throw new Error("SESSION_SECRET is missing or too short.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const sessionStore = new PgSession({
  pool,
  tableName: "session",
  createTableIfMissing: true,
  pruneSessionInterval: 60 * 15,
});

const sessionMiddleware = session({
  name: "hrms.sid",
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 8,
  },
});

module.exports = sessionMiddleware;
