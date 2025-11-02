import { getDb } from "@/lib/mongo"
import { ObjectId } from "mongodb"

async function migrate() {
  const db = await getDb()
  const usuarios = db.collection('usuarios')

  // Buscar documentos donde perfil.fechaNacimiento existe y es string
  const cursor = usuarios.find({ 'perfil.fechaNacimiento': { $type: 'string' } })
  let converted = 0
  let failed = 0

  while (await cursor.hasNext()) {
    const maybeDoc = await cursor.next()
    if (!maybeDoc) continue
    const doc: any = maybeDoc
    try {
      const raw = doc.perfil?.fechaNacimiento
      const d = new Date(raw)
      if (!isNaN(d.getTime())) {
        await usuarios.updateOne({ _id: doc._id }, { $set: { 'perfil.fechaNacimiento': d } })
        converted++
      } else {
        console.warn('No convertible:', doc._id?.toString(), raw)
        failed++
      }
    } catch (e) {
      console.error('Error converting', doc._id?.toString(), e)
      failed++
    }
  }

  console.log(`Migration finished. Converted: ${converted}, Failed: ${failed}`)
}

migrate().catch((e) => {
  console.error('Migration error', e)
  process.exit(1)
})
