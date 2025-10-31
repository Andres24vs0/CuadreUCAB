"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Search } from "lucide-react"

const allInterests = [
  "Fútbol",
  "Baloncesto",
  "Voleibol",
  "Tenis",
  "Natación",
  "Ciclismo",
  "Running",
  "Yoga",
  "Gym",
  "Artes Marciales",
  "Boxeo",
  "Kickboxing",
  "Judo",
  "Karate",
  "Taekwondo",
  "CrossFit",
  "Pilates",
  "Escalada",
  "Surf",
  "Skateboarding",
  "Patinaje",
  "Esquí",
  "Snowboard",
  "Parkour",
  "Calistenia",
  "Spinning",
  "Aeróbicos",
  "Zumba",
  "Música",
  "Canto",
  "Guitarra",
  "Piano",
  "Batería",
  "Bajo",
  "Violín",
  "Saxofón",
  "Trompeta",
  "Flauta",
  "Ukulele",
  "DJ",
  "Producción Musical",
  "Composición",
  "Rap",
  "Hip Hop",
  "Rock",
  "Pop",
  "Jazz",
  "Blues",
  "Reggae",
  "Salsa",
  "Merengue",
  "Bachata",
  "Reggaeton",
  "Electrónica",
  "Techno",
  "House",
  "Dubstep",
  "Trap",
  "R&B",
  "Soul",
  "Country",
  "Folk",
  "Metal",
  "Punk",
  "Indie",
  "Alternativo",
  "Clásica",
  "Ópera",
  "Conciertos",
  "Festivales",
  "Karaoke",
  "Cine",
  "Series",
  "Netflix",
  "Anime",
  "Manga",
  "Marvel",
  "DC Comics",
  "Star Wars",
  "Harry Potter",
  "El Señor de los Anillos",
  "Game of Thrones",
  "Stranger Things",
  "Breaking Bad",
  "Friends",
  "The Office",
  "Documentales",
  "Cine de Terror",
  "Comedia",
  "Drama",
  "Acción",
  "Ciencia Ficción",
  "Fantasía",
  "Suspenso",
  "Teatro",
  "Stand Up Comedy",
  "Improvisación",
  "Lectura",
  "Poesía",
  "Escritura",
  "Novelas",
  "Cuentos",
  "Ensayos",
  "Biografías",
  "Autoayuda",
  "Misterio",
  "Romance",
  "Historia",
  "Filosofía",
  "Mitología",
  "Periodismo",
  "Blogging",
  "Podcasts",
  "Audiolibros",
  "Fotografía",
  "Fotografía de Paisajes",
  "Fotografía de Retratos",
  "Fotografía Callejera",
  "Fotografía de Naturaleza",
  "Pintura",
  "Acuarela",
  "Óleo",
  "Acrílico",
  "Dibujo",
  "Diseño Gráfico",
  "Ilustración",
  "Arte Digital",
  "Animación",
  "3D Modeling",
  "Escultura",
  "Cerámica",
  "Graffiti",
  "Street Art",
  "Tatuajes",
  "Moda",
  "Diseño de Moda",
  "Costura",
  "Tejido",
  "Crochet",
  "Bordado",
  "Joyería",
  "Artesanía",
  "DIY",
  "Carpintería",
  "Jardinería",
  "Plantas",
  "Bonsái",
  "Huerto Urbano",
  "Viajes",
  "Aventura",
  "Camping",
  "Senderismo",
  "Trekking",
  "Montañismo",
  "Playa",
  "Montaña",
  "Turismo",
  "Mochilero",
  "Road Trips",
  "Exploración Urbana",
  "Fotografía de Viajes",
  "Idiomas",
  "Inglés",
  "Francés",
  "Alemán",
  "Italiano",
  "Portugués",
  "Japonés",
  "Chino",
  "Coreano",
  "Árabe",
  "Ruso",
  "Gastronomía",
  "Cocina",
  "Repostería",
  "Panadería",
  "Pastelería",
  "Coctelería",
  "Barista",
  "Café",
  "Té",
  "Vino",
  "Cerveza Artesanal",
  "Whisky",
  "Ron",
  "Comida Italiana",
  "Comida Japonesa",
  "Comida Mexicana",
  "Comida China",
  "Comida Tailandesa",
  "Comida India",
  "Comida Mediterránea",
  "Comida Venezolana",
  "BBQ",
  "Sushi",
  "Pizza",
  "Hamburguesas",
  "Tacos",
  "Vegetarianismo",
  "Veganismo",
  "Comida Saludable",
  "Nutrición",
  "Dietas",
  "Videojuegos",
  "PlayStation",
  "Xbox",
  "Nintendo",
  "PC Gaming",
  "Gaming Móvil",
  "E-sports",
  "League of Legends",
  "Fortnite",
  "Minecraft",
  "Valorant",
  "Counter-Strike",
  "Dota 2",
  "Overwatch",
  "Call of Duty",
  "FIFA",
  "GTA",
  "The Witcher",
  "Zelda",
  "Pokémon",
  "Final Fantasy",
  "RPG",
  "FPS",
  "MOBA",
  "Battle Royale",
  "Streaming",
  "Twitch",
  "YouTube",
  "TikTok",
  "Instagram",
  "Twitter",
  "Facebook",
  "Snapchat",
  "Discord",
  "Reddit",
  "Tecnología",
  "Programación",
  "Python",
  "JavaScript",
  "Java",
  "C++",
  "Web Development",
  "App Development",
  "Inteligencia Artificial",
  "Machine Learning",
  "Data Science",
  "Ciberseguridad",
  "Hacking Ético",
  "Robótica",
  "Drones",
  "Impresión 3D",
  "Realidad Virtual",
  "Realidad Aumentada",
  "Gadgets",
  "Smartphones",
  "Tablets",
  "Laptops",
  "Smartwatches",
  "Auriculares",
  "Cámaras",
  "Apps",
  "Software",
  "Linux",
  "Open Source",
  "Redes Sociales",
  "Marketing Digital",
  "SEO",
  "Content Creation",
  "Edición de Video",
  "Edición de Audio",
  "Criptomonedas",
  "Bitcoin",
  "Ethereum",
  "Blockchain",
  "NFTs",
  "Trading",
  "Forex",
  "Startups",
  "Ciencia",
  "Astronomía",
  "Astrofísica",
  "Física",
  "Química",
  "Biología",
  "Genética",
  "Matemáticas",
  "Estadística",
  "Medicina",
  "Psicología",
  "Neurociencia",
  "Antropología",
  "Sociología",
  "Arqueología",
  "Paleontología",
  "Geología",
  "Oceanografía",
  "Meteorología",
  "Ecología",
  "Conservación",
  "Política",
  "Economía",
  "Emprendimiento",
  "Negocios",
  "Marketing",
  "Publicidad",
  "Ventas",
  "Finanzas",
  "Contabilidad",
  "Inversiones",
  "Bolsa",
  "Bienes Raíces",
  "Liderazgo",
  "Coaching",
  "Mentoring",
  "Recursos Humanos",
  "Gestión de Proyectos",
  "Productividad",
  "Voluntariado",
  "Activismo",
  "ONG",
  "Medio Ambiente",
  "Cambio Climático",
  "Sostenibilidad",
  "Reciclaje",
  "Energías Renovables",
  "Derechos Humanos",
  "Igualdad de Género",
  "LGBTQ+",
  "Justicia Social",
  "Educación",
  "Enseñanza",
  "Tutorías",
  "Animales",
  "Mascotas",
  "Perros",
  "Gatos",
  "Aves",
  "Reptiles",
  "Peces",
  "Acuarios",
  "Veterinaria",
  "Adiestramiento",
  "Rescate Animal",
  "Baile",
  "Salsa (Baile)",
  "Bachata (Baile)",
  "Merengue (Baile)",
  "Tango",
  "Flamenco",
  "Ballet",
  "Danza Contemporánea",
  "Danza Moderna",
  "Hip Hop Dance",
  "Break Dance",
  "Pole Dance",
  "Belly Dance",
  "Tap Dance",
  "Swing",
  "Meditación",
  "Mindfulness",
  "Yoga Nidra",
  "Pranayama",
  "Espiritualidad",
  "Religión",
  "Cristianismo",
  "Catolicismo",
  "Budismo",
  "Hinduismo",
  "Islam",
  "Judaísmo",
  "Astrología",
  "Tarot",
  "Numerología",
  "Cristales",
  "Energías",
  "Chakras",
  "Reiki",
  "Acupuntura",
  "Medicina Alternativa",
  "Homeopatía",
  "Naturopatía",
]

interface InterestsSelectorProps {
  selectedInterests: string[]
  onInterestsChange: (interests: string[]) => void
}

export function InterestsSelector({ selectedInterests, onInterestsChange }: InterestsSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredInterests = searchTerm
    ? allInterests.filter((interest) => interest.toLowerCase().includes(searchTerm.toLowerCase()))
    : allInterests

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      onInterestsChange(selectedInterests.filter((i) => i !== interest))
    } else if (selectedInterests.length < 8) {
      onInterestsChange([...selectedInterests, interest])
    }
  }

  const removeInterest = (interest: string) => {
    onInterestsChange(selectedInterests.filter((i) => i !== interest))
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar intereses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {selectedInterests.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Seleccionados ({selectedInterests.length}/8)</p>
          <div className="flex flex-wrap gap-2">
            {selectedInterests.map((interest) => (
              <Badge
                key={`selected-${interest}`}
                className="bg-ucab-maroon text-white hover:bg-ucab-maroon/90 px-3 py-1"
              >
                {interest}
                <button
                  type="button"
                  onClick={() => removeInterest(interest)}
                  className="ml-2 rounded-full hover:bg-white/20 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {filteredInterests.map((interest) => {
            const isSelected = selectedInterests.includes(interest)
            const isDisabled = !isSelected && selectedInterests.length >= 8

            return (
              <button
                key={`available-${interest}`}
                type="button"
                onClick={() => !isDisabled && toggleInterest(interest)}
                disabled={isDisabled}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                  ${
                    isSelected
                      ? "bg-ucab-golden text-white"
                      : isDisabled
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-ucab-maroon border-2 border-ucab-maroon hover:bg-ucab-maroon hover:text-white"
                  }
                `}
              >
                {interest}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
