import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, SlidersHorizontal, MapPin, Plus, Footprints, Bus, Car, ParkingSquare, Sunrise, Sunset } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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

export default function Home() {
  const navigate = useNavigate()
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationDenied, setLocationDenied] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Place[]>([])
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([])
  const [loadingPlaces, setLoadingPlaces] = useState(false)
  const [dbPins, setDbPins] = useState<DbPin[]>([])
  const [selectedPin, setSelectedPin] = useState<DbPin | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  // Geolocation on mount — fall back to first popular spot if denied
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setUserLocation(loc)
        setCenter(loc)
      },
      () => {
        setLocationDenied(true)
        fetch(`${API_URL}/pins/popular`)
          .then((r) => r.ok ? r.json() : [])
          .then((pins: DbPin[]) => {
            if (pins.length > 0) setCenter([pins[0].latitude, pins[0].longitude])
          })
          .catch(() => {})
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  // Fetch nearby places when center is determined
  useEffect(() => {
    setLoadingPlaces(true)
    fetchNearbyPlaces(center[0], center[1])
      .then(setNearbyPlaces)
      .finally(() => setLoadingPlaces(false))
  }, [center])

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

  return (
    <div className="relative h-svh w-full overflow-hidden">
      <div className="absolute inset-0">
        <MapView center={center} zoom={14} places={nearbyPlaces} pins={dbPins} userLocation={userLocation} onBoundsChange={handleBoundsChange} onPinClick={(pin) => setSelectedPin(pin)} />
      </div>

      <div className="absolute inset-x-0 top-0 z-[1000] flex flex-col pointer-events-none">
        <div className="px-4 pt-4 pointer-events-auto">
          <div className="flex items-center gap-2">
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
            <button className="bg-white rounded-2xl shadow-lg p-3 shrink-0 text-primary">
              <SlidersHorizontal className="size-4" />
            </button>
            <button
              onClick={() => navigate('/add-pin', { state: { lat: center[0], lng: center[1] } })}
              className="bg-primary rounded-2xl shadow-lg p-3 shrink-0 text-white"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <BottomSheet forceSnap={selectedPin ? 1 : undefined}>
        {selectedPin ? (
          <div className="px-4 pb-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold truncate">{selectedPin.name}</h2>
                  {selectedPin.sun === 'sunrise' && <Sunrise className="size-4 text-amber-500 shrink-0" />}
                  {selectedPin.sun === 'sunset' && <Sunset className="size-4 text-orange-500 shrink-0" />}
                  {selectedPin.sun === 'both' && (
                    <>
                      <Sunrise className="size-4 text-amber-500 shrink-0" />
                      <Sunset className="size-4 text-orange-500 shrink-0" />
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">{selectedPin.type.replace('_', ' ')}</p>
              </div>
              <button
                onClick={() => setSelectedPin(null)}
                className="ml-3 shrink-0 text-muted-foreground text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* Notes */}
            {selectedPin.notes && (
              <p className="text-sm text-foreground leading-relaxed mb-3">{selectedPin.notes}</p>
            )}

            {/* Transport */}
            {selectedPin.transport && (
              <div className="rounded-2xl bg-secondary p-3 mb-3 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {selectedPin.transport.best === 'walk' && <Footprints className="size-4 text-primary" />}
                  {selectedPin.transport.best === 'bus' && <Bus className="size-4 text-primary" />}
                  {selectedPin.transport.best === 'drive' && <Car className="size-4 text-primary" />}
                  <span className="capitalize">Best by {selectedPin.transport.best}</span>
                  {selectedPin.transport.walk_mins != null && (
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                      ~{selectedPin.transport.walk_mins} min walk
                    </span>
                  )}
                </div>
                {selectedPin.transport.bus_stop && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Bus className="size-3 shrink-0 mt-0.5" />
                    <span>{selectedPin.transport.bus_stop}</span>
                  </div>
                )}
                {selectedPin.transport.car_park && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <ParkingSquare className="size-3 shrink-0 mt-0.5" />
                    <span>{selectedPin.transport.car_park}</span>
                  </div>
                )}
                {selectedPin.transport.notes && (
                  <p className="text-xs text-muted-foreground italic">{selectedPin.transport.notes}</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <MapPin className="size-3 text-primary shrink-0" />
              <span>{selectedPin.latitude.toFixed(5)}, {selectedPin.longitude.toFixed(5)}</span>
            </div>

            {/* Videos */}
            {selectedPin.videos && selectedPin.videos.length > 0 && (
              <div className="flex flex-col gap-2">
                {selectedPin.videos.map((url, i) => {
                  const embedUrl = getTikTokEmbedUrl(url)
                  if (embedUrl) {
                    return (
                      <iframe
                        key={i}
                        src={embedUrl}
                        className="w-full rounded-2xl border-0"
                        style={{ height: 560 }}
                        allow="fullscreen"
                        allowFullScreen
                      />
                    )
                  }
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary underline truncate"
                    >
                      {url}
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="px-4 pb-2">
              <h2 className="text-base font-bold mb-0.5">
                {locationDenied ? 'Popular spots' : 'Explore nearby'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {locationDenied ? 'Enable location for personalized results' : 'Discover places around you'}
              </p>
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
  )
}
