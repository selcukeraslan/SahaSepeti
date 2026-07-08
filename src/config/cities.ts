/**
 * İl/ilçe verisi — MVP için statik.
 * Öne çıkan büyükşehirler ilçeleriyle; kalan iller yalnızca isim olarak.
 */
export interface City {
  name: string
  districts: string[]
}

export const FEATURED_CITIES: City[] = [
  {
    name: 'İstanbul',
    districts: [
      'Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler',
      'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü',
      'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt',
      'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane',
      'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer',
      'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla',
      'Ümraniye', 'Üsküdar', 'Zeytinburnu',
    ],
  },
  {
    name: 'Ankara',
    districts: [
      'Akyurt', 'Altındağ', 'Ayaş', 'Bala', 'Beypazarı', 'Çamlıdere', 'Çankaya',
      'Çubuk', 'Elmadağ', 'Etimesgut', 'Gölbaşı', 'Güdül', 'Haymana', 'Kahramankazan',
      'Kalecik', 'Keçiören', 'Kızılcahamam', 'Mamak', 'Nallıhan', 'Polatlı',
      'Pursaklar', 'Sincan', 'Şereflikoçhisar', 'Yenimahalle',
    ],
  },
  {
    name: 'İzmir',
    districts: [
      'Aliağa', 'Balçova', 'Bayındır', 'Bayraklı', 'Bergama', 'Beydağ', 'Bornova',
      'Buca', 'Çeşme', 'Çiğli', 'Dikili', 'Foça', 'Gaziemir', 'Güzelbahçe',
      'Karabağlar', 'Karaburun', 'Karşıyaka', 'Kemalpaşa', 'Kınık', 'Kiraz',
      'Konak', 'Menderes', 'Menemen', 'Narlıdere', 'Ödemiş', 'Seferihisar',
      'Selçuk', 'Tire', 'Torbalı', 'Urla',
    ],
  },
  {
    name: 'Bursa',
    districts: [
      'Büyükorhan', 'Gemlik', 'Gürsu', 'Harmancık', 'İnegöl', 'İznik', 'Karacabey',
      'Keles', 'Kestel', 'Mudanya', 'Mustafakemalpaşa', 'Nilüfer', 'Orhaneli',
      'Orhangazi', 'Osmangazi', 'Yenişehir', 'Yıldırım',
    ],
  },
  {
    name: 'Antalya',
    districts: [
      'Akseki', 'Aksu', 'Alanya', 'Demre', 'Döşemealtı', 'Elmalı', 'Finike',
      'Gazipaşa', 'Gündoğmuş', 'İbradı', 'Kaş', 'Kemer', 'Kepez', 'Konyaaltı',
      'Korkuteli', 'Kumluca', 'Manavgat', 'Muratpaşa', 'Serik',
    ],
  },
  {
    name: 'Adana',
    districts: [
      'Aladağ', 'Ceyhan', 'Çukurova', 'Feke', 'İmamoğlu', 'Karaisalı', 'Karataş',
      'Kozan', 'Pozantı', 'Saimbeyli', 'Sarıçam', 'Seyhan', 'Tufanbeyli',
      'Yumurtalık', 'Yüreğir',
    ],
  },
  {
    name: 'Konya',
    districts: [
      'Akşehir', 'Beyşehir', 'Cihanbeyli', 'Çumra', 'Ereğli', 'Ilgın', 'Karatay',
      'Kulu', 'Meram', 'Selçuklu', 'Seydişehir',
    ],
  },
  {
    name: 'Gaziantep',
    districts: [
      'Araban', 'İslahiye', 'Karkamış', 'Nizip', 'Nurdağı', 'Oğuzeli',
      'Şahinbey', 'Şehitkamil', 'Yavuzeli',
    ],
  },
  {
    name: 'Kayseri',
    districts: [
      'Bünyan', 'Develi', 'Hacılar', 'İncesu', 'Kocasinan', 'Melikgazi',
      'Talas', 'Yahyalı', 'Yeşilhisar',
    ],
  },
  {
    name: 'Mersin',
    districts: [
      'Akdeniz', 'Anamur', 'Erdemli', 'Mezitli', 'Silifke', 'Tarsus',
      'Toroslar', 'Yenişehir',
    ],
  },
]

/** Diğer iller (ilçe verisi olmadan) */
export const OTHER_CITY_NAMES: string[] = [
  'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ardahan', 'Artvin',
  'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik', 'Bingöl',
  'Bitlis', 'Bolu', 'Burdur', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli',
  'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir',
  'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'Kahramanmaraş',
  'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kırıkkale', 'Kırklareli', 'Kırşehir',
  'Kilis', 'Kocaeli', 'Kütahya', 'Malatya', 'Manisa', 'Mardin', 'Muğla', 'Muş',
  'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize', 'Sakarya', 'Samsun', 'Siirt',
  'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak', 'Tekirdağ', 'Tokat', 'Trabzon',
  'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak',
]

export const ALL_CITY_NAMES: string[] = [
  ...FEATURED_CITIES.map((c) => c.name),
  ...OTHER_CITY_NAMES,
].sort((a, b) => a.localeCompare(b, 'tr'))

export function getDistricts(cityName: string): string[] {
  return FEATURED_CITIES.find((c) => c.name === cityName)?.districts ?? []
}
