import mongoose from 'mongoose';
import { Client, Quote } from './models.js';

let cached = globalThis.__elizabethMongo;
if (!cached) {
  cached = globalThis.__elizabethMongo = { connection: null, promise: null };
}
let indexesPromise = globalThis.__elizabethIndexes;

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('Falta configurar la variable privada MONGODB_URI.');
  if (cached.connection?.readyState === 1) return cached.connection;
  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 5,
    }).then((client) => client.connection).catch((error) => {
      cached.promise = null;
      throw error;
    });
  }
  cached.connection = await cached.promise;
  if (!indexesPromise) {
    indexesPromise = globalThis.__elizabethIndexes = Promise.all([Client.createIndexes(), Quote.createIndexes()]).catch((error) => {
      globalThis.__elizabethIndexes = null;
      indexesPromise = null;
      throw error;
    });
  }
  await indexesPromise;
  return cached.connection;
}
