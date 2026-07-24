import L from 'leaflet'

/**
 * Marka uyumlu harita ikonları (divIcon + inline SVG).
 * Leaflet'in varsayılan PNG marker'ları bundler'da yol sorunu çıkarır;
 * divIcon hem bunu önler hem de zümrüt marka rengini kullanır.
 */

const PIN_SVG = `
<svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M17 0C7.6 0 0 7.6 0 17c0 12.8 17 27 17 27s17-14.2 17-27C34 7.6 26.4 0 17 0Z" fill="#059669"/>
  <path d="M17 0C7.6 0 0 7.6 0 17c0 12.8 17 27 17 27s17-14.2 17-27C34 7.6 26.4 0 17 0Z" fill="url(#g)" fill-opacity=".25"/>
  <circle cx="17" cy="17" r="7" fill="#ffffff"/>
  <defs>
    <linearGradient id="g" x1="17" y1="0" x2="17" y2="44" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff"/><stop offset="1" stop-color="#000000"/>
    </linearGradient>
  </defs>
</svg>`

/** Tesis pin'i — zümrüt damla */
export const venuePinIcon = L.divIcon({
  className: 'drop-shadow-md',
  html: PIN_SVG,
  iconSize: [34, 44],
  iconAnchor: [17, 42],
  popupAnchor: [0, -36],
})

/** Kullanıcı konumu — nabız efektli mavi nokta */
export const userDotIcon = L.divIcon({
  className: '',
  html: `<span class="relative flex size-4">
    <span class="absolute inline-flex size-full animate-ping rounded-full bg-sky-400 opacity-60"></span>
    <span class="relative inline-flex size-4 rounded-full border-2 border-white bg-sky-500 shadow"></span>
  </span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})
