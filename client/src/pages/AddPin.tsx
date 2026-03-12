import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
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
      const res = await fetch(`${API_URL}/pins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type: category || 'cool_spot',
          notes: description || undefined,
          latitude: lat,
          longitude: lng,
          videos: [],
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

        <div className="flex flex-col gap-1.5">
          <Label>Location</Label>
          <div className="rounded-2xl overflow-hidden border border-border h-48 relative">
            <MapView
              center={mapCenter}
              zoom={14}
              showUserMarker={false}
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
