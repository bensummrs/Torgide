import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import type { Place } from '@/lib/geo'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

function FlyToCenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 })
  }, [center, zoom, map])
  return null
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
}

function getTikTokUrl(videos?: string[]): string | null {
  return videos?.find(u => u.includes('tiktok.com')) ?? null
}

function ThumbnailPinMarker({ pin, onClick }: { pin: DbPin; onClick?: () => void }) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const tikTokUrl = getTikTokUrl(pin.videos)

  useEffect(() => {
    if (!tikTokUrl) return
    fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(tikTokUrl)}`)
      .then(r => r.json())
      .then(d => setThumbnailUrl(d.thumbnail_url))
      .catch(() => {})
  }, [tikTokUrl])

  const icon = useMemo(() => {
    const size = 52
    const borderColor = '#ffffff'
    const inner = thumbnailUrl
      ? `<img src="${thumbnailUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
      : `<div style="width:100%;height:100%;background:#255A2B;border-radius:50%;"></div>`
    const html = `
      <div style="position:relative;width:${size}px;height:${size + 10}px;">
        <div style="width:${size}px;height:${size}px;border-radius:50%;border:3px solid ${borderColor};overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.35);">
          ${inner}
        </div>
        <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid ${borderColor};"></div>
      </div>`
    return L.divIcon({ html, className: '', iconSize: [size, size + 10], iconAnchor: [size / 2, size + 10] })
  }, [thumbnailUrl])

  return (
    <Marker
      position={[pin.latitude, pin.longitude]}
      icon={icon}
      eventHandlers={onClick ? { click: onClick } : undefined}
    />
  )
}

function MapClickHandler({ onLocationPick }: { onLocationPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export interface MapBounds {
  minLat: number; maxLat: number; minLng: number; maxLng: number
}

function MapEventTracker({ onChange }: { onChange: (bounds: MapBounds) => void }) {
  const map = useMap()
  useEffect(() => {
    const b = map.getBounds()
    onChange({ minLat: b.getSouth(), maxLat: b.getNorth(), minLng: b.getWest(), maxLng: b.getEast() })
  }, [map, onChange])
  useMapEvents({
    moveend(e) {
      const b = e.target.getBounds()
      onChange({ minLat: b.getSouth(), maxLat: b.getNorth(), minLng: b.getWest(), maxLng: b.getEast() })
    },
    zoomend(e) {
      const b = e.target.getBounds()
      onChange({ minLat: b.getSouth(), maxLat: b.getNorth(), minLng: b.getWest(), maxLng: b.getEast() })
    },
  })
  return null
}

interface MapViewProps {
  center?: [number, number]
  zoom?: number
  className?: string
  places?: Place[]
  pins?: DbPin[]
  userLocation?: [number, number] | null
  onLocationPick?: (lat: number, lng: number) => void
  pickedLocation?: [number, number] | null
  onBoundsChange?: (bounds: MapBounds) => void
  onPinClick?: (pin: DbPin) => void
}

const DEFAULT_CENTER: [number, number] = [40.7128, -74.006]

export function MapView({
  center = DEFAULT_CENTER,
  zoom = 12,
  className = '',
  places = [],
  pins = [],
  userLocation,
  onLocationPick,
  pickedLocation,
  onBoundsChange,
  onPinClick,
}: MapViewProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      style={{ height: '100%', width: '100%', cursor: onLocationPick ? 'crosshair' : undefined }}
      zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToCenter center={center} zoom={zoom} />
      {onBoundsChange && <MapEventTracker onChange={onBoundsChange} />}
      {userLocation && (
        <Marker position={userLocation}>
          <Popup>You are here</Popup>
        </Marker>
      )}
      {onLocationPick && <MapClickHandler onLocationPick={onLocationPick} />}
      {pickedLocation && <Marker position={pickedLocation} />}
      {places.map((place) => (
        <CircleMarker
          key={place.id}
          center={[place.lat, place.lon]}
          radius={6}
          pathOptions={{ color: '#fff', fillColor: '#255A2B', fillOpacity: 1, weight: 2 }}
        >
          <Popup>{place.name}</Popup>
        </CircleMarker>
      ))}
      {pins.map((pin) => (
        <ThumbnailPinMarker
          key={pin.id}
          pin={pin}
          onClick={onPinClick ? () => onPinClick(pin) : undefined}
        />
      ))}
    </MapContainer>
  )
}
