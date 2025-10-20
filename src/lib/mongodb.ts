import { MongoClient } from "mongodb";
import { config } from "@/config/runtime-config";

// Create MongoDB client and database instances
// Connection is lazy - happens on first database operation
export const mongoClient = new MongoClient(config.mongodb.uri);
export const db = mongoClient.db(config.mongodb.database);