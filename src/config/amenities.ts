/** Tesis olanakları — venues.amenities text[] alanında bu değerler saklanır. */
export const AMENITIES = [
  'Duş',
  'Soyunma Odası',
  'Otopark',
  'Kafeterya',
  'Aydınlatma',
  'Kiralık Ekipman',
  'Tribün',
  'Wi-Fi',
  'Kapalı Alan',
  'Servis',
  'Güvenlik Kamerası',
  'Mescit',
] as const

export type Amenity = (typeof AMENITIES)[number]
