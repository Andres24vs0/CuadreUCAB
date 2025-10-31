// tsx will load .env.local via --env-file flag in package.json
// Verify environment variables are loaded
if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI not found. Make sure .env.local exists and contains MONGODB_URI=...")
}

import { getDb } from "@/lib/mongo"

async function clearSeededData() {
  try {
    const db = await getDb()
    
    console.log("Clearing seeded data...\n")
    
    // Delete all matches
    const matchesCollection = db.collection("matches")
    const matchesResult = await matchesCollection.deleteMany({})
    console.log(`✓ Cleared ${matchesResult.deletedCount} documents from matches`)
    
    // Delete all swipes
    const swipesCollection = db.collection("swipes")
    const swipesResult = await swipesCollection.deleteMany({})
    console.log(`✓ Cleared ${swipesResult.deletedCount} documents from swipes`)
    
    // Delete all mensajes
    const mensajesCollection = db.collection("mensajes")
    const mensajesResult = await mensajesCollection.deleteMany({})
    console.log(`✓ Cleared ${mensajesResult.deletedCount} documents from mensajes`)
    
    // Delete only usuarios with email pattern: usuario{number}@
    // This matches the seed pattern: usuario1@, usuario2@, etc.
    const usuariosCollection = db.collection("usuarios")
    const usuariosResult = await usuariosCollection.deleteMany({
      email: /^usuario\d+@/
    })
    console.log(`✓ Cleared ${usuariosResult.deletedCount} usuarios with seed pattern (usuario{number}@)`)
    
    console.log("\n✅ All seeded data cleared successfully!")
  } catch (error) {
    console.error("❌ Error clearing seeded data:", error)
    throw error
  }
}

// Run the clear function
clearSeededData()
  .then(() => {
    console.log("\n🎉 Done!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Fatal error:", error)
    process.exit(1)
  })

