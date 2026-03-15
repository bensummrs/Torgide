import { useState } from 'react'
import { ArrowLeft, Footprints, Bus, Car, Sunrise, Sunset, Plus, X } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MapView } from '@/components/MapView'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const DEFAULT_CENTER: [number, number] = [40.7128, -74.006]

export default function AddPin() {
  const navigate = useNavigate()
  const location = useLocation()
  const passed = (location.state as { lat: number; lng: number }) ?? {}

  const [pickedLocation, setPickedLocation] = useState<[number, number] | null>(
    passed.lat != null ? [passed.lat, passed.lng] : null
  )
  const mapCenter: [number, number] = pickedLocation ?? (passed.lat != null ? [passed.lat, passed.lng] : DEFAULT_CENTER)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Transport
  const [transportBest, setTransportBest] = useState<'walk' | 'bus' | 'drive' | ''>('')
  const [walkMins, setWalkMins] = useState('')
  const [busStop, setBusStop] = useState('')
  const [carPark, setCarPark] = useState('')
  const [transportNotes, setTransportNotes] = useState('')

  // Sun
  const [hasSunrise, setHasSunrise] = useState(false)
  const [hasSunset, setHasSunset] = useState(false)

  // Videos
  const [videos, setVideos] = useState<string[]>([])
  const [videoInput, setVideoInput] = useState('')

  function addVideo() {
    const url = videoInput.trim()
    if (url && !videos.includes(url)) setVideos((v) => [...v, url])
    setVideoInput('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pickedLocation == null) {
      setError('Tap the map to set a location.')
      return
    }
    const [lat, lng] = pickedLocation
    setLoading(true)
    setError(null)
    try {
      const sun = hasSunrise && hasSunset ? 'both' : hasSunrise ? 'sunrise' : hasSunset ? 'sunset' : undefined
      const transport = transportBest
        ? {
            best: transportBest,
            walk_mins: walkMins ? parseInt(walkMins) : undefined,
            bus_stop: busStop || undefined,
            car_park: carPark || undefined,
            notes: transportNotes || undefined,
          }
        : undefined

      const res = await fetch(`${API_URL}/pins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type: category || 'cool_spot',
          notes: description || undefined,
          latitude: lat,
          longitude: lng,
          videos,
          transport,
          sun,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail ?? `Error ${res.status}`)
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative h-svh w-full bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-4">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-2xl size-10"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-bold">Create a spot</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 flex-1 overflow-y-auto pb-8">
        <div className="flex flex-col gap-1.5">
          <Label>Name</Label>
          <Input
            placeholder="e.g. My favourite café"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-2xl border-border bg-secondary h-12 px-4 focus-visible:border-primary focus-visible:ring-primary/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <Input
            placeholder="e.g. food, park, hidden gem…"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-2xl border-border bg-secondary h-12 px-4 focus-visible:border-primary focus-visible:ring-primary/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Description</Label>
          <Textarea
            placeholder="What makes this place special?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="rounded-2xl border-border bg-secondary px-4 py-3 resize-none focus-visible:border-primary focus-visible:ring-primary/20"
          />
        </div>

        {/* Sun */}
        <div className="flex flex-col gap-1.5">
          <Label>Best for</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setHasSunrise((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium border transition-colors ${hasSunrise ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-secondary border-border text-muted-foreground'}`}
            >
              <Sunrise className="size-4" /> Sunrise
            </button>
            <button
              type="button"
              onClick={() => setHasSunset((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium border transition-colors ${hasSunset ? 'bg-orange-50 border-orange-400 text-orange-700' : 'bg-secondary border-border text-muted-foreground'}`}
            >
              <Sunset className="size-4" /> Sunset
            </button>
          </div>
        </div>

        {/* Transport */}
        <div className="flex flex-col gap-2">
          <Label>Getting there</Label>
          <div className="flex gap-2">
            {(['walk', 'bus', 'drive'] as const).map((mode) => {
              const Icon = mode === 'walk' ? Footprints : mode === 'bus' ? Bus : Car
              const active = transportBest === mode
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTransportBest(active ? '' : mode)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium border capitalize transition-colors ${active ? 'bg-primary/10 border-primary text-primary' : 'bg-secondary border-border text-muted-foreground'}`}
                >
                  <Icon className="size-4" /> {mode}
                </button>
              )
            })}
          </div>

          {transportBest && (
            <div className="flex flex-col gap-2 mt-1">
              {transportBest === 'bus' && (
                <Input
                  placeholder="Bus stop / route (e.g. Bus 42 – High St)"
                  value={busStop}
                  onChange={(e) => setBusStop(e.target.value)}
                  className="rounded-2xl border-border bg-secondary h-12 px-4 focus-visible:border-primary focus-visible:ring-primary/20"
                />
              )}
              {(transportBest === 'drive' || transportBest === 'bus') && (
                <Input
                  placeholder="Car park (e.g. Elm St car park, 200 m away)"
                  value={carPark}
                  onChange={(e) => setCarPark(e.target.value)}
                  className="rounded-2xl border-border bg-secondary h-12 px-4 focus-visible:border-primary focus-visible:ring-primary/20"
                />
              )}
              <Input
                type="number"
                placeholder="Walk time to spot (minutes)"
                value={walkMins}
                onChange={(e) => setWalkMins(e.target.value)}
                className="rounded-2xl border-border bg-secondary h-12 px-4 focus-visible:border-primary focus-visible:ring-primary/20"
              />
              <Input
                placeholder="Extra note (e.g. drive to car park, then 10 min walk)"
                value={transportNotes}
                onChange={(e) => setTransportNotes(e.target.value)}
                className="rounded-2xl border-border bg-secondary h-12 px-4 focus-visible:border-primary focus-visible:ring-primary/20"
              />
            </div>
          )}
        </div>

        {/* TikTok Videos */}
        <div className="flex flex-col gap-2">
          <Label>TikTok videos</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Paste a TikTok URL"
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVideo())}
              className="rounded-2xl border-border bg-secondary h-12 px-4 focus-visible:border-primary focus-visible:ring-primary/20"
            />
            <button
              type="button"
              onClick={addVideo}
              className="shrink-0 size-12 flex items-center justify-center rounded-2xl bg-secondary border border-border text-muted-foreground"
            >
              <Plus className="size-4" />
            </button>
          </div>
          {videos.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {videos.map((url, i) => (
                <div key={i} className="flex items-center gap-2 rounded-2xl bg-secondary border border-border px-3 py-2">
                  <span className="flex-1 text-xs truncate text-muted-foreground">{url}</span>
                  <button
                    type="button"
                    onClick={() => setVideos((v) => v.filter((_, j) => j !== i))}
                    className="shrink-0 text-muted-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Location</Label>
          <div className="rounded-2xl overflow-hidden border border-border h-48 relative">
            <MapView
              center={mapCenter}
              zoom={14}
              onLocationPick={(lat, lng) => setPickedLocation([lat, lng])}
              pickedLocation={pickedLocation}
            />
            {pickedLocation == null && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-xl">Tap to pick location</p>
              </div>
            )}
          </div>
          {pickedLocation && (
            <p className="text-xs text-muted-foreground tabular-nums px-1">
              {pickedLocation[0].toFixed(5)}, {pickedLocation[1].toFixed(5)}
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="mt-auto rounded-2xl h-12 text-sm font-semibold shadow-md"
        >
          {loading ? 'Saving…' : 'Save Pin'}
        </Button>
      </form>
    </div>
  )
}
