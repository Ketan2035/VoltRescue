// One-time script to drop the stale 'operatorid_1' index from the operators collection
import mongoose from 'mongoose';
import { env } from './src/config/env.js';

const run = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('operators');

    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));

    const staleIndexes = ['operatorId_1'];
    for (const indexName of staleIndexes) {
      const exists = indexes.some(i => i.name === indexName);
      if (exists) {
        await collection.dropIndex(indexName);
        console.log(`✅ Dropped stale index: ${indexName}`);
      } else {
        console.log(`ℹ️  Index not found (already clean): ${indexName}`);
      }
    }

    console.log('✅ Done. You can now restart the server and register operators.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
