export interface Place {
  id: string
  name: string
  lat: number
  lon: number
  category: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function searchPlaces(query: string): Promise<Place[]> {
  try {
    const res = await fetch(`${API_URL}/places/search?q=${encodeURIComponent(query)}`)
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function fetchNearbyPlaces(lat: number, lon: number): Promise<Place[]> {
  try {
    const res = await fetch(`${API_URL}/places/nearby?lat=${lat}&lon=${lon}`)
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export function distanceMi(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1) + ' mi'
}
