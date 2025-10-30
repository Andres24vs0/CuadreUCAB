const fs = require('fs')
const path = require('path')
const { MongoClient } = require('mongodb')

function loadEnv(file) {
  const p = path.resolve(process.cwd(), file)
  if (!fs.existsSync(p)) return {}
  return fs.readFileSync(p, 'utf8').split('\n').reduce((acc, line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return acc
    const [k, ...rest] = trimmed.split('=')
    acc[k] = rest.join('=').trim()
    return acc
  }, {})
}

;(async function(){
  const env = loadEnv('.env.local')
  const uri = env.MONGODB_URI || process.env.MONGODB_URI
  const dbName = env.MONGODB_DB || process.env.MONGODB_DB
  if (!uri || !dbName) {
    console.error('MONGODB_URI or MONGODB_DB not set in .env.local or env')
    process.exit(1)
  }
  console.log('Using', uri, 'DB', dbName)
  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db(dbName)
    const cols = await db.listCollections().toArray()
    console.log('Collections in DB:', cols.map(c=>c.name))
    const col = db.collection('usuarios')
    const count = await col.countDocuments()
    console.log('usuarios count:', count)
    const sample = await col.findOne()
    console.log('sample doc:', sample)
  } catch (err) {
    console.error('Mongo error:', err)
  } finally {
    await client.close()
  }
})()
