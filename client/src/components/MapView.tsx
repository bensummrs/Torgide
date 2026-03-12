import { useEffect } from 'react'
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
          pathOptions={{ color: '#fff', fillColor: 'oklch(0.639 0.255 10.6)', fillOpacity: 1, weight: 2 }}
        >
          <Popup>{place.name}</Popup>
        </CircleMarker>
      ))}
      {pins.map((pin) => (
        <CircleMarker
          key={pin.id}
          center={[pin.latitude, pin.longitude]}
          radius={22}
          pathOptions={{ color: '#fff', fillColor: 'oklch(0.639 0.255 10.6)', fillOpacity: 1, weight: 3 }}
          eventHandlers={onPinClick ? { click: () => onPinClick(pin) } : undefined}
        />
      ))}
    </MapContainer>
  )
}
