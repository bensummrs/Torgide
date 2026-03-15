import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Compass, Sunrise, Sunset } from 'lucide-react'
import logoIcon from '@/assets/torgide-darkgreen.png'
import spotIcon from '@/assets/icons/spot.png'
import mountainIcon from '@/assets/icons/mountain.png'
import pineIcon from '@/assets/icons/pine.png'
import beachIcon from '@/assets/icons/beach.png'
import cityIcon from '@/assets/icons/city.png'
import { useNavigate } from 'react-router-dom'
import { searchPlaces, type Place } from '@/lib/geo'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

interface DbPin {
  id: string
  name: string
  type: string
  notes?: string
  latitude: number
  longitude: number
  sun?: 'sunrise' | 'sunset' | 'both'
  videos?: string[]
}

const CATEGORY_FILTERS = [
  { label: 'All',       value: null,        icon: null },
  { label: 'Viewpoint', value: 'viewpoint', icon: mountainIcon },
  { label: 'Nature',    value: 'nature',    icon: pineIcon },
  { label: 'Water',     value: 'water',     icon: beachIcon },
  { label: 'Urban',     value: 'urban',     icon: cityIcon },
]

export default function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Place[]>([])
  const [featuredPins, setFeaturedPins] = useState<DbPin[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${API_URL}/pins/popular`)
      .then((r) => r.ok ? r.json() : [])
      .then(setFeaturedPins)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return }
    const timer = setTimeout(async () => {
      const results = await searchPlaces(query)
      setSuggestions(results)
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestions([])
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function selectSuggestion(place: Place) {
    navigate('/map', { state: { lat: place.lat, lon: place.lon, name: place.name } })
  }

  function selectPin(pin: DbPin) {
    navigate(`/map?pin=${pin.id}&lat=${pin.latitude}&lon=${pin.longitude}`)
  }

  const visiblePins = activeCategory
    ? featuredPins.filter((p) => p.type === activeCategory)
    : featuredPins

  return (
    <div className="min-h-svh bg-background flex flex-col">

      {/* ── LOGO ────────────────────────────────────────────────────── */}
      <div className="flex justify-center pt-6 pb-2">
        <img src={logoIcon} alt="Torgide" className="h-8 object-contain" />
      </div>

      {/* ── SEARCH BAR ──────────────────────────────────────────────── */}
      <div className="p-4">
        <div ref={searchRef} className="relative">
          <div
            className={`flex items-center gap-3 bg-white rounded-3xl px-5 py-4 shadow-lg border transition-colors ${
              focused ? 'border-primary shadow-primary/10' : 'border-border'
            }`}
          >
            <Search className={`size-5 shrink-0 transition-colors ${focused ? 'text-primary' : 'text-muted-foreground'}`} />
            <input
              type="text"
              placeholder="Search for a destination..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
            />
          </div>

          {suggestions.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-xl overflow-hidden z-10 border border-border">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectSuggestion(s)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted text-sm border-b border-border last:border-0 transition-colors"
                >
                  <MapPin className="size-4 text-primary shrink-0" />
                  <span className="truncate font-medium">{s.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CATEGORY PILLS ──────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto px-4 scrollbar-none pb-1 mb-6">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(cat.value)}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors border ${
              activeCategory === cat.value
                ? 'bg-primary text-white border-primary'
                : 'bg-background text-foreground border-border hover:bg-muted'
            }`}
          >
            {cat.icon && <img src={cat.icon} alt="" className="size-4 object-contain" />}
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── CREATE SPOT CARD ────────────────────────────────────────── */}
      <div className="px-4 mb-6">
        <button
          onClick={() => navigate('/add-pin')}
          className="w-full flex items-center justify-between bg-white rounded-3xl shadow-md border border-border px-5 py-4 text-left active:scale-[0.98] transition-transform hover:shadow-lg"
        >
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-base font-bold leading-snug text-foreground">Share a spot</p>
            <p className="mt-1 text-xs text-muted-foreground">Add a hidden gem to the map</p>
          </div>
          <img src={spotIcon} alt="" className="shrink-0 size-16 object-contain" />
        </button>
      </div>

      {/* ── FEATURED SPOTS ──────────────────────────────────────────── */}
      {featuredPins.length > 0 ? (
        <section className="flex-1">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-base font-bold">Featured Spots</h2>
          </div>

          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="md:hidden flex gap-3 overflow-x-auto px-4 scrollbar-none pb-4">
            {visiblePins.map((pin) => (
              <FeaturedCard key={pin.id} pin={pin} onClick={() => selectPin(pin)} />
            ))}
            {visiblePins.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">No spots in this category yet.</p>
            )}
          </div>

          <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-4 px-4 pb-8">
            {visiblePins.map((pin) => (
              <FeaturedCard key={pin.id} pin={pin} onClick={() => selectPin(pin)} />
            ))}
            {visiblePins.length === 0 && (
              <p className="text-xs text-muted-foreground py-2 col-span-full">No spots in this category yet.</p>
            )}
          </div>
        </section>
      ) : (
        /* ── EMPTY STATE ──────────────────────────────────────────── */
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16 text-center">
          <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
            <Compass className="size-9 text-primary/60" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-2">Find your next adventure</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            Search for a city or destination above to explore curated spots near you.
          </p>
        </div>
      )}
    </div>
  )
}

const CATEGORY_ICON: Record<string, string> = {
  viewpoint: mountainIcon,
  nature: pineIcon,
  water: beachIcon,
  urban: cityIcon,
}

function FeaturedCard({ pin, onClick }: { pin: DbPin; onClick: () => void }) {
  const catIcon = CATEGORY_ICON[pin.type]
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const tikTokUrl = pin.videos?.find(u => u.includes('tiktok.com'))

  useEffect(() => {
    if (!tikTokUrl) return
    fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(tikTokUrl)}`)
      .then(r => r.json())
      .then(d => setThumbnailUrl(d.thumbnail_url))
      .catch(() => {})
  }, [tikTokUrl])

  return (
    <button
      onClick={onClick}
      className="shrink-0 w-44 md:w-auto text-left active:scale-[0.97] transition-transform"
    >
      <div className="rounded-2xl overflow-hidden aspect-square relative bg-muted mb-2">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={pin.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            {catIcon
              ? <img src={catIcon} alt={pin.type} className="size-20 object-contain drop-shadow-md" />
              : <MapPin className="size-10 text-primary/40" />
            }
          </div>
        )}
        {(pin.sun === 'sunrise' || pin.sun === 'both') && (
          <span className="absolute top-2 left-2 bg-amber-500/90 text-white text-[10px] font-semibold rounded-full px-2 py-0.5 flex items-center gap-1">
            <Sunrise className="size-3" /> Sunrise
          </span>
        )}
        {(pin.sun === 'sunset' || pin.sun === 'both') && (
          <span className="absolute top-2 right-2 bg-orange-500/90 text-white text-[10px] font-semibold rounded-full px-2 py-0.5 flex items-center gap-1">
            <Sunset className="size-3" /> Sunset
          </span>
        )}
      </div>
      <p className="text-sm font-semibold leading-tight truncate">{pin.name}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground capitalize">{pin.type}</p>
      {pin.notes && (
        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1 leading-snug">{pin.notes}</p>
      )}
    </button>
  )
}
