import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
})

const LocationMarker = ({ position, setPosition }) => {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  useEffect(() => {
    if (position) {
      map.setView(position, 13);
    }
  }, [position, map]);

  return position ? <Marker position={position} /> : null;
};


const LocationPicker = ({ onLocationSelect, initialPosition = null }) => {
  const [position, setPosition] = useState(initialPosition)
  const [currentLocation, setCurrentLocation] = useState([51.505, -0.09]) // Default location (London)

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition)
      return
    }
    
    // Get user's current location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setCurrentLocation([latitude, longitude])
          setPosition([latitude, longitude])
          if (onLocationSelect) {
            onLocationSelect([latitude, longitude])
          }
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [initialPosition, onLocationSelect])

  const handlePositionChange = (newPosition) => {
    setPosition(newPosition)
    if (onLocationSelect) {
      onLocationSelect(newPosition)
    }
  }

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-300">
      <MapContainer
        center={currentLocation}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={handlePositionChange} />
      </MapContainer>
      <p className="mt-2 text-sm text-gray-500">Click on the map to select a location</p>
    </div>
  )
}

export default LocationPicker