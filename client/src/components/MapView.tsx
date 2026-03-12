import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet'
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

interface MapViewProps {
  center?: [number, number]
  zoom?: number
  className?: string
  places?: Place[]
}

const DEFAULT_CENTER: [number, number] = [40.7128, -74.006]

export function MapView({ center = DEFAULT_CENTER, zoom = 12, className = '', places = [] }: MapViewProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToCenter center={center} zoom={zoom} />
      <Marker position={center}>
        <Popup>You are here</Popup>
      </Marker>
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
    </MapContainer>
  )
}
