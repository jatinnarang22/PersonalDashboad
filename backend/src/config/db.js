import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

/** Kept so the ephemeral server can be torn down if we add graceful shutdown later */
let memoryServer = null;

function useMemoryMongo() {
  const v = process.env.USE_MEMORY_MONGO;
  return v === 'true' || v === '1';
}

export async function connectDB() {
  mongoose.set('strictQuery', true);
  const opts = {
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 10,
  };

  const memory = useMemoryMongo();
  let uri;

  if (memory) {
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
  } else {
    uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error(
        'Set MONGODB_URI in .env, or USE_MEMORY_MONGO=true for an in-memory database (dev only).'
      );
    }
  }

  await mongoose.connect(uri, opts);

  if (memory) {
    console.log(
      'MongoDB connected (in-memory; data is lost when the server stops. Set USE_MEMORY_MONGO=false to use MONGODB_URI.)'
    );
  } else {
    console.log('MongoDB connected');
  }
}
