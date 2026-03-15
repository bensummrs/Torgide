import { useState, useCallback, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, X, MapPin, Check, Navigation } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// ── Nominatim types ────────────────────────────────────────────────────────
interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  boundingbox: string[]
}

// ── Move tracker — fires onMove with current map center ───────────────────
function MapCenterTracker({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  const map = useMap()

  // report initial center
  useEffect(() => {
    const c = map.getCenter()
    onMove(c.lat, c.lng)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useMapEvents({
    move(e) {
      const c = e.target.getCenter()
      onMove(c.lat, c.lng)
    },
  })
  return null
}

// ── Fly-to helper ─────────────────────────────────────────────────────────
function FlyTo({ target }: { target: { lat: number; lng: number; zoom: number } | null }) {
  const map = useMap()
  const prev = useRef<typeof target>(null)
  useEffect(() => {
    if (!target) return
    if (prev.current?.lat === target.lat && prev.current?.lng === target.lng) return
    prev.current = target
    map.flyTo([target.lat, target.lng], target.zoom, { duration: 1.2 })
  }, [target, map])
  return null
}

// ── Main component ────────────────────────────────────────────────────────
interface LocationPickerProps {
  initialLocation?: [number, number] | null
  onConfirm: (lat: number, lng: number) => void
  onClose: () => void
}

const DEFAULT_CENTER: [number, number] = [40.7128, -74.006]

export function LocationPicker({ initialLocation, onConfirm, onClose }: LocationPickerProps) {
  const [center, setCenter] = useState<[number, number]>(initialLocation ?? DEFAULT_CENTER)
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(null)

  // Search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMove = useCallback((lat: number, lng: number) => {
    setCenter([lat, lng])
  }, [])

  // Debounced Nominatim search
  function handleQueryChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setResults([])
      setShowResults(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data: NominatimResult[] = await res.json()
        setResults(data)
        setShowResults(true)
      } catch {
        // ignore
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  function selectResult(r: NominatimResult) {
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    setFlyTarget({ lat, lng, zoom: 16 })
    setQuery(r.display_name.split(',').slice(0, 2).join(','))
    setResults([])
    setShowResults(false)
  }

  function clearSearch() {
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 z-20 px-3 pt-safe-top pt-4 flex flex-col gap-2 pointer-events-none">
        {/* Row: close + search */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-2xl size-11 shrink-0 shadow-md bg-background/90 backdrop-blur-sm border border-border"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            {searching && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            )}
            {!searching && query && (
              <button
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={clearSearch}
              >
                <X className="size-4" />
              </button>
            )}
            <Input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search for a place…"
              className="pl-10 pr-10 h-11 rounded-2xl bg-background/90 backdrop-blur-sm border-border shadow-md focus-visible:border-primary focus-visible:ring-primary/20"
            />
          </div>
        </div>

        {/* Search results dropdown */}
        {showResults && results.length > 0 && (
          <div className="pointer-events-auto bg-background/95 backdrop-blur-sm rounded-2xl border border-border shadow-lg overflow-hidden">
            {results.map((r) => (
              <button
                key={r.place_id}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary transition-colors border-b border-border last:border-0"
                onClick={() => selectResult(r)}
              >
                <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm leading-snug line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Map ── */}
      <div className="flex-1 relative z-0">
        <MapContainer
          center={initialLocation ?? DEFAULT_CENTER}
          zoom={initialLocation ? 16 : 12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenterTracker onMove={handleMove} />
          <FlyTo target={flyTarget} />
        </MapContainer>

        {/* Fixed crosshair in center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
          {/* Shadow dot on map surface */}
          <div
            className="absolute size-3 rounded-full bg-black/20 blur-sm translate-y-4"
            style={{ transform: 'translateY(14px) scaleX(1.4)' }}
          />
          {/* Pin icon */}
          <div className="flex flex-col items-center drop-shadow-lg" style={{ transform: 'translateY(-12px)' }}>
            <div className="size-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <Navigation className="size-5 text-primary-foreground fill-primary-foreground" style={{ transform: 'rotate(135deg)' }} />
            </div>
            {/* Pin stem */}
            <div className="w-0.5 h-3 bg-primary rounded-b-full" />
          </div>
        </div>

        {/* Coordinates pill */}
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 shadow-md">
            <p className="text-xs tabular-nums text-muted-foreground font-mono">
              {center[0].toFixed(5)}, {center[1].toFixed(5)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom confirm bar ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-safe-bottom pb-8 pt-4 bg-gradient-to-t from-background/95 to-transparent pointer-events-none">
        <div className="pointer-events-auto flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground text-center">
            Pan & zoom to position the pin, then confirm
          </p>
          <Button
            className="w-full h-12 rounded-full text-sm font-semibold shadow-lg"
            onClick={() => onConfirm(center[0], center[1])}
          >
            <Check className="size-4 mr-2" />
            Confirm location
          </Button>
        </div>
      </div>
    </div>
  )
}
