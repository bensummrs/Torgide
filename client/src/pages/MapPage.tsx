import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, MapPin, Footprints, Bus, Car, ParkingSquare, Sunrise, Sunset, ArrowLeft, ChevronLeft } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MapView, type MapBounds } from '../components/MapView'
import { BottomSheet } from '@/components/BottomSheet'
import { searchPlaces, fetchNearbyPlaces, distanceMi, type Place } from '@/lib/geo'

const DEFAULT_CENTER: [number, number] = [40.7128, -74.006]
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

interface Transport {
  best: 'walk' | 'bus' | 'drive'
  walk_mins?: number
  bus_stop?: string
  car_park?: string
  notes?: string
}

interface DbPin {
  id: string
  name: string
  type: string
  notes?: string
  latitude: number
  longitude: number
  geohash: string
  videos?: string[]
  transport?: Transport
  sun?: 'sunrise' | 'sunset' | 'both'
}

function getTikTokEmbedUrl(url: string): string | null {
  const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/)
  if (match) return `https://www.tiktok.com/embed/v2/${match[1]}`
  return null
}

function PinDetail({ pin, onClose }: { pin: DbPin; onClose: () => void }) {
  return (
    <div className="px-4 pb-8">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold truncate">{pin.name}</h2>
            {pin.sun === 'sunrise' && <Sunrise className="size-4 text-amber-500 shrink-0" />}
            {pin.sun === 'sunset' && <Sunset className="size-4 text-orange-500 shrink-0" />}
            {pin.sun === 'both' && (
              <>
                <Sunrise className="size-4 text-amber-500 shrink-0" />
                <Sunset className="size-4 text-orange-500 shrink-0" />
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">{pin.type.replace('_', ' ')}</p>
        </div>
        <button onClick={onClose} className="ml-3 shrink-0 text-muted-foreground text-lg leading-none">×</button>
      </div>

      {pin.notes && (
        <p className="text-sm text-foreground leading-relaxed mb-3">{pin.notes}</p>
      )}

      {pin.transport && (
        <div className="rounded-2xl bg-secondary p-3 mb-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {pin.transport.best === 'walk' && <Footprints className="size-4 text-primary" />}
            {pin.transport.best === 'bus' && <Bus className="size-4 text-primary" />}
            {pin.transport.best === 'drive' && <Car className="size-4 text-primary" />}
            <span className="capitalize">Best by {pin.transport.best}</span>
            {pin.transport.walk_mins != null && (
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                ~{pin.transport.walk_mins} min walk
              </span>
            )}
          </div>
          {pin.transport.bus_stop && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Bus className="size-3 shrink-0 mt-0.5" />
              <span>{pin.transport.bus_stop}</span>
            </div>
          )}
          {pin.transport.car_park && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <ParkingSquare className="size-3 shrink-0 mt-0.5" />
              <span>{pin.transport.car_park}</span>
            </div>
          )}
          {pin.transport.notes && (
            <p className="text-xs text-muted-foreground italic">{pin.transport.notes}</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
        <MapPin className="size-3 text-primary shrink-0" />
        <span>{pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}</span>
      </div>

      {pin.videos && pin.videos.length > 0 && (
        <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 scrollbar-none">
          {pin.videos.map((url, i) => {
            const embedUrl = getTikTokEmbedUrl(url)
            if (embedUrl) {
              return (
                <div
                  key={i}
                  className="shrink-0 rounded-2xl overflow-hidden"
                  style={{ width: 200, height: 330 }}
                >
                  <iframe
                    src={embedUrl}
                    className="border-0"
                    style={{ width: 200, height: 430 }}
                    allow="fullscreen"
                    allowFullScreen
                  />
                </div>
              )
            }
            return (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs text-primary underline truncate"
              >
                {url}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function MapPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const urlLat = searchParams.get('lat')
  const urlLon = searchParams.get('lon')
  const urlPinId = searchParams.get('pin')

  const initialCenter: [number, number] =
    urlLat && urlLon ? [parseFloat(urlLat), parseFloat(urlLon)] : DEFAULT_CENTER

  const [center, setCenter] = useState<[number, number]>(initialCenter)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Place[]>([])
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([])
  const [loadingPlaces, setLoadingPlaces] = useState(false)
  const [dbPins, setDbPins] = useState<DbPin[]>([])
  const [selectedPin, setSelectedPin] = useState<DbPin | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoadingPlaces(true)
    fetchNearbyPlaces(center[0], center[1])
      .then(setNearbyPlaces)
      .finally(() => setLoadingPlaces(false))
  }, [center])

  // Auto-select pin from URL param once dbPins are loaded
  useEffect(() => {
    if (!urlPinId || selectedPin) return
    const pin = dbPins.find((p) => p.id === urlPinId)
    if (pin) setSelectedPin(pin)
  }, [dbPins, urlPinId, selectedPin])

  function selectPin(pin: DbPin) {
    setSelectedPin(pin)
    setCenter([pin.latitude, pin.longitude])
    setSearchParams({ pin: pin.id, lat: String(pin.latitude), lon: String(pin.longitude) })
  }

  function closePin() {
    setSelectedPin(null)
    setSearchParams({})
  }

  const pinFetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleBoundsChange = useCallback(({ minLat, maxLat, minLng, maxLng }: MapBounds) => {
    if (pinFetchTimer.current) clearTimeout(pinFetchTimer.current)
    pinFetchTimer.current = setTimeout(() => {
      fetch(`${API_URL}/pins/bbox?min_lat=${minLat}&max_lat=${maxLat}&min_lng=${minLng}&max_lng=${maxLng}`)
        .then((r) => r.ok ? r.json() : [])
        .then(setDbPins)
        .catch(() => {})
    }, 300)
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
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function selectSuggestion(place: Place) {
    setCenter([place.lat, place.lon])
    setQuery(place.name)
    setSuggestions([])
  }

  const allListItems: Array<{ kind: 'pin'; pin: DbPin } | { kind: 'place'; place: Place }> = [
    ...dbPins.map((pin) => ({ kind: 'pin' as const, pin })),
    ...nearbyPlaces.map((place) => ({ kind: 'place' as const, place })),
  ]

  return (
    <div className="h-svh w-full overflow-hidden flex flex-col">
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT PANEL (desktop only) ─────────────────────────────── */}
        <div className="hidden md:flex flex-col w-[420px] shrink-0 border-r border-border overflow-hidden bg-background">

          {/* Back + Search + add button */}
          <div className="px-4 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
                Home
              </button>
            </div>
            <div ref={searchRef} className="relative">
              <div className="flex items-center gap-2 bg-secondary rounded-2xl px-4 py-3">
                <Search className="size-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Where to?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
                />
              </div>
              {suggestions.length > 0 && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-background rounded-2xl shadow-lg overflow-hidden z-10 border border-border">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => selectSuggestion(s)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted text-sm border-b border-border last:border-0"
                    >
                      <MapPin className="size-3.5 text-primary shrink-0" />
                      <span className="truncate">{s.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* List content */}
          <div className="flex-1 overflow-y-auto">
            {selectedPin ? (
              <div className="pt-4">
                <button
                  onClick={closePin}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground px-4 mb-3 hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" />
                  Back
                </button>
                <PinDetail pin={selectedPin} onClose={closePin} />
              </div>
            ) : (
              <div className="px-4 py-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Explore nearby
                </p>

                {loadingPlaces && allListItems.length === 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="rounded-2xl bg-muted animate-pulse h-44" />
                    ))}
                  </div>
                ) : allListItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No places found nearby.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {dbPins.map((pin) => (
                      <button
                        key={pin.id}
                        onClick={() => selectPin(pin)}
                        className="rounded-2xl border border-border bg-secondary text-left overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="h-28 bg-primary/10 flex items-center justify-center">
                          <MapPin className="size-6 text-primary/40" />
                        </div>
                        <div className="p-3">
                          <p className="text-xs font-semibold leading-tight truncate">{pin.name}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground capitalize">{pin.type.replace('_', ' ')}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {distanceMi(center[0], center[1], pin.latitude, pin.longitude)}
                          </p>
                        </div>
                      </button>
                    ))}
                    {nearbyPlaces.map((place) => (
                      <button
                        key={place.id}
                        onClick={() => setCenter([place.lat, place.lon])}
                        className="rounded-2xl border border-border bg-secondary text-left overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="h-28 bg-muted flex items-center justify-center">
                          <MapPin className="size-6 text-muted-foreground/30" />
                        </div>
                        <div className="p-3">
                          <p className="text-xs font-semibold leading-tight truncate">{place.name}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground capitalize">{place.category}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {distanceMi(center[0], center[1], place.lat, place.lon)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── MAP ──────────────────────────────────────────────────────── */}
        <div className="flex-1 relative">
          <MapView
            center={center}
            zoom={14}
            places={nearbyPlaces}
            pins={dbPins}
            onBoundsChange={handleBoundsChange}
            onPinClick={selectPin}
          />

          {/* MOBILE ONLY: floating top bar */}
          <div className="md:hidden absolute inset-x-0 top-0 z-[1000] flex flex-col pointer-events-none">
            <div className="px-4 pt-4 pointer-events-auto">
              <div className="flex items-center gap-2">
                {/* Back button */}
                <button
                  onClick={() => navigate('/')}
                  className="bg-white rounded-2xl shadow-lg p-3 shrink-0 text-foreground"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <div ref={searchRef} className="flex-1 relative">
                  <div className="flex items-center gap-2 bg-white rounded-2xl shadow-lg px-4 py-3">
                    <Search className="size-4 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      placeholder="Where to?"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  {suggestions.length > 0 && (
                    <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-lg overflow-hidden z-10">
                      {suggestions.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => selectSuggestion(s)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted text-sm border-b border-border last:border-0"
                        >
                          <MapPin className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* MOBILE ONLY: bottom sheet */}
          <div className="md:hidden">
            <BottomSheet forceSnap={selectedPin ? 1 : undefined}>
              {selectedPin ? (
                <PinDetail pin={selectedPin} onClose={closePin} />
              ) : (
                <>
                  <div className="px-4 pb-2">
                    <h2 className="text-base font-bold mb-0.5">Explore nearby</h2>
                    <p className="text-xs text-muted-foreground">Discover places around you</p>
                  </div>
                  <div className="px-4 pb-8">
                    {loadingPlaces ? (
                      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="shrink-0 w-36 h-24 rounded-2xl bg-muted animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
                        {nearbyPlaces.map((place) => (
                          <button
                            key={place.id}
                            onClick={() => setCenter([place.lat, place.lon])}
                            className="shrink-0 w-36 rounded-2xl border border-border bg-secondary p-3 text-left"
                          >
                            <div className="mb-2 flex size-8 items-center justify-center rounded-xl bg-primary/10">
                              <MapPin className="size-4 text-primary" />
                            </div>
                            <p className="text-xs font-semibold leading-tight truncate">{place.name}</p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground capitalize">
                              {place.category} · {distanceMi(center[0], center[1], place.lat, place.lon)}
                            </p>
                          </button>
                        ))}
                        {nearbyPlaces.length === 0 && (
                          <p className="text-xs text-muted-foreground py-2">No places found nearby.</p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </BottomSheet>
          </div>
        </div>

      </div>
    </div>
  )
}
