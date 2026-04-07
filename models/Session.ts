import mongoose from "mongoose";

export type SessionDocument = mongoose.HydratedDocument<Session>;

export type Session = {
  sessionId: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
};

const SessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: false },
);

// Automatically purge expired sessions.
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session =
  ((mongoose.models.Session as mongoose.Model<SessionDocument>) ??
    mongoose.model<SessionDocument>("Session", SessionSchema));

