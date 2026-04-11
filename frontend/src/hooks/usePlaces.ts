import { useEffect, useRef, useState } from 'react'

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''

function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.maps?.places) { resolve(); return }
    if (document.querySelector('script[data-gm]')) {
      const t = setInterval(() => {
        if ((window as any).google?.maps?.places) { clearInterval(t); resolve() }
      }, 100)
      return
    }
    const s = document.createElement('script')
    s.setAttribute('data-gm', '1')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Google Maps failed to load'))
    document.head.appendChild(s)
  })
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const r = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`
    )
    const d = await r.json()
    if (d.status === 'OK' && d.results.length > 0) {
      for (const res of d.results) {
        if ((res.types || []).some((t: string) => ['locality', 'sublocality', 'neighborhood'].includes(t)))
          return res.formatted_address
      }
      return d.results[0].formatted_address
    }
  } catch (e) { /* ignore */ }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

export function usePlaceAutocomplete(onChange: (value: string) => void) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let ac: any
    loadGoogleMaps().then(() => {
      if (!inputRef.current) return
      ac = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'ph' },
        fields: ['formatted_address', 'geometry', 'name'],
      })
      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        onChange(place.formatted_address || place.name || inputRef.current?.value || '')
      })
      setReady(true)
    })
    return () => {
      if (ac && (window as any).google?.maps?.event)
        (window as any).google.maps.event.clearInstanceListeners(ac)
    }
  }, [])

  return { inputRef, ready }
}