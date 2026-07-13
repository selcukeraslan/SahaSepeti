import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { X } from 'lucide-react'
import { venuePinIcon } from '@/lib/map'
import { TURKEY_CENTER, TURKEY_ZOOM, type GeoPoint } from '@/lib/geo'

interface LocationPickerProps {
  value: GeoPoint | null
  onChange: (point: GeoPoint | null) => void
}

/** Harita tıklamalarını yakalar. */
function ClickHandler({ onPick }: { onPick: (point: GeoPoint) => void }) {
  useMapEvents({
    // wrap(): dünya kopyasında tıklanırsa boylamı ±180 aralığına normalize eder;
    // aksi halde şema doğrulaması sessizce reddeder.
    click: (event) => {
      const wrapped = event.latlng.wrap()
      onPick({ lat: wrapped.lat, lng: wrapped.lng })
    },
  })
  return null
}

/** Kayıtlı konum varsa haritayı oraya götürür (ilk açılışta). */
function CenterOnValue({ value }: { value: GeoPoint | null }) {
  const map = useMap()
  useEffect(() => {
    if (value) map.setView([value.lat, value.lng], Math.max(map.getZoom(), 14))
    // Yalnızca ilk değer için merkezle; her tıklamada zıplamasın
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])
  return null
}

/** Tesis formu için haritadan konum seçici. */
export function LocationPicker({ value, onChange }: LocationPickerProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700 dark:text-ink-200">
          Konum (isteğe bağlı)
        </span>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-red-600 dark:text-ink-400"
          >
            <X className="size-3.5" aria-hidden />
            Konumu temizle
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-400 dark:text-ink-500">
        Haritaya tıklayarak tesisinizin yerini işaretleyin — müşteriler haritada ve
        &quot;yakınımdakiler&quot; aramasında tesisinizi bulabilir.
      </p>
      <div className="mt-2 h-72 overflow-hidden rounded-2xl border border-slate-300 dark:border-ink-700">
        <MapContainer
          center={value ? [value.lat, value.lng] : [TURKEY_CENTER.lat, TURKEY_CENTER.lng]}
          zoom={value ? 14 : TURKEY_ZOOM}
          className="size-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          <CenterOnValue value={value} />
          {value && <Marker position={[value.lat, value.lng]} icon={venuePinIcon} />}
        </MapContainer>
      </div>
      {value && (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-ink-500">
          Seçilen konum: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      )}
    </div>
  )
}
