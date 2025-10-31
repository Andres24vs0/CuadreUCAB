import { MongoClient, type Db } from "mongodb"

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB

if (!uri) throw new Error("MONGODB_URI no definida en .env.local")
if (!dbName) throw new Error("MONGODB_DB no definida en .env.local")

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

let client: MongoClient

if (!global._mongoClientPromise) {
  client = new MongoClient(uri)
  global._mongoClientPromise = client.connect()
}

export async function getClient(): Promise<MongoClient> {
  return await global._mongoClientPromise!
}

export async function getDb(): Promise<Db> {
  const client = await getClient()
  return client.db(dbName)
}
