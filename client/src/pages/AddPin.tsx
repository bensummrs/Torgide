import { useState } from 'react'
import { ArrowLeft, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function AddPin() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: save pin
    navigate('/')
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

        <div className="rounded-2xl border border-dashed border-border bg-secondary flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
          <MapPin className="size-6 text-primary" />
          <p className="text-sm font-medium">Tap on the map to set location</p>
          <p className="text-xs">Coming soon</p>
        </div>

        <Button
          type="submit"
          className="mt-auto rounded-2xl h-12 text-sm font-semibold shadow-md"
        >
          Save Pin
        </Button>
      </form>
    </div>
  )
}
