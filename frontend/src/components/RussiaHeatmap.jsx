import { useState, useEffect } from 'react';

const URBAN_FILTERS = [
  { value: null, label: 'Все (Городское и сельское)' },
  { value: 'Городское население', label: 'Городское население' },
  { value: 'Сельское население', label: 'Сельское население' },
];

const GENDER_FILTERS = [
  { value: null, label: 'Все (Оба пола)' },
  { value: 'Мужчины', label: 'Мужчины' },
  { value: 'Женщины', label: 'Женщины' },
];

// Упрощенная карта регионов России - 8 федеральных округов для визуализации
const REGION_GROUPS = {
  'Центральный': [
    'Белгородская область', 'Брянская область', 'Владимирская область', 'Воронежская область',
    'Ивановская область', 'Калужская область', 'Костромская область', 'Курская область',
    'Липецкая область', 'Московская область', 'Орловская область', 'Рязанская область',
    'Смоленская область', 'Тамбовская область', 'Тверская область', 'Тульская область',
    'Ярославская область', 'Москва'
  ],
  'Северо-Западный': [
    'Республика Карелия', 'Республика Коми', 'Архангельская область', 'Вологодская область',
    'Калининградская область', 'Ленинградская область', 'Мурманская область', 'Новгородская область',
    'Псковская область', 'Ненецкий автономный округ', 'Санкт-Петербург'
  ],
  'Южный': [
    'Республика Адыгея', 'Республика Калмыкия', 'Краснодарский край', 'Астраханская область',
    'Волгоградская область', 'Ростовская область'
  ],
  'Северо-Кавказский': [
    'Республика Дагестан', 'Республика Ингушетия', 'Кабардино-Балкарская Республика',
    'Карачаево-Черкесская Республика', 'Республика Северная Осетия — Алания', 'Чеченская Республика',
    'Ставропольский край'
  ],
  'Приволжский': [
    'Республика Башкортостан', 'Республика Марий Эл', 'Республика Мордовия', 'Республика Татарстан',
    'Удмуртская Республика', 'Чувашская Республика', 'Пермский край', 'Кировская область',
    'Нижегородская область', 'Оренбургская область', 'Пензенская область', 'Самарская область',
    'Саратовская область', 'Ульяновская область'
  ],
  'Уральский': [
    'Курганская область', 'Свердловская область', 'Тюменская область', 'Челябинская область',
    'Ханты-Мансийский автономный округ — Югра', 'Ямало-Ненецкий автономный округ'
  ],
  'Сибирский': [
    'Республика Алтай', 'Республика Бурятия', 'Республика Тыва', 'Республика Хакасия',
    'Алтайский край', 'Забайкальский край', 'Красноярский край', 'Иркутская область',
    'Кемеровская область — Кузбасс', 'Новосибирская область', 'Омская область', 'Томская область'
  ],
  'Дальневосточный': [
    'Республика Саха (Якутия)', 'Камчатский край', 'Приморский край', 'Хабаровский край',
    'Амурская область', 'Магаданская область', 'Сахалинская область', 'Еврейская автономная область',
    'Чукотский автономный округ'
  ]
};

// Функция для получения цвета по значению
function getColor(value, min, max) {
  if (max === min) return '#E0E0E0';
  const ratio = (value - min) / (max - min);
  const intensity = Math.floor(ratio * 255);
  return `rgb(100, ${100 + Math.floor(ratio * 100)}, ${200 + Math.floor(ratio * 55)})`;
}

export default function RussiaHeatmap({ datasetId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [urbanFilter, setUrbanFilter] = useState(null);
  const [genderFilter, setGenderFilter] = useState(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (urbanFilter) params.append('urban', urbanFilter);
      if (genderFilter) params.append('gender', genderFilter);

      const res = await fetch(
        `http://127.0.0.1:8000/api/datasets/${encodeURIComponent(datasetId)}/heatmap?${params}`
      );

      if (!res.ok) {
        if (res.status === 400) {
          setError('Датасет не содержит колонку area для отображения хитмапа');
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
        return;
      }

      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Heatmap error:', e);
      setError('Не удалось загрузить данные для хитмапа');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [datasetId, urbanFilter, genderFilter]);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка хитмапа...</div>;
  }

  if (error) {
    return null;
  }

  if (!data || data.regions.length === 0) {
    return null;
  }

  // Создаем словарь значений регионов
  const regionValues = {};
  data.regions.forEach(r => {
    regionValues[r.region] = r.value;
  });

  // Определяем, к какому федеральному округу относится регион
  const getFederalDistrict = (regionName) => {
    for (const [district, regions] of Object.entries(REGION_GROUPS)) {
      if (regions.some(r => regionName.includes(r) || r.includes(regionName))) {
        return district;
      }
    }
    return 'Другие';
  };

  // Группируем данные по федеральным округам
  const districtGroups = {};
  Object.entries(REGION_GROUPS).forEach(([district, regions]) => {
    districtGroups[district] = regions
      .map(region => ({
        name: region,
        value: regionValues[region] || 0
      }))
      .filter(r => r.value > 0 || Object.keys(regionValues).some(k => k.includes(r.name)));
  });

  return (
    <div style={{ marginTop: '40px', marginBottom: '40px' }}>
      <h3>Карта регионов России</h3>

      {/* Фильтры */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
            Тип населения:
          </label>
          <select
            value={urbanFilter || ''}
            onChange={(e) => setUrbanFilter(e.target.value || null)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '14px',
              minWidth: '200px'
            }}
          >
            {URBAN_FILTERS.map(filter => (
              <option key={filter.value || 'all'} value={filter.value || ''}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
            Пол:
          </label>
          <select
            value={genderFilter || ''}
            onChange={(e) => setGenderFilter(e.target.value || null)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '14px',
              minWidth: '200px'
            }}
          >
            {GENDER_FILTERS.map(filter => (
              <option key={filter.value || 'all'} value={filter.value || ''}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Информация о фильтрах */}
      <div style={{ marginBottom: '20px', fontSize: '14px', opacity: 0.8 }}>
        Текущие фильтры: {data.filters.urban}, {data.filters.gender}
      </div>

      {/* Хитмап - визуализация по федеральным округам */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {Object.entries(districtGroups).map(([district, regions]) => {
          if (regions.length === 0) return null;

          const maxDistrictValue = Math.max(...regions.map(r => r.value));

          return (
            <div key={district} style={{
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              padding: '16px',
              backgroundColor: '#fafafa'
            }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>{district} ФО</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {regions
                  .sort((a, b) => b.value - a.value)
                  .map((region, idx) => (
                  <div
                    key={region.name}
                    onMouseEnter={() => setHoveredRegion(region.name)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px',
                      borderRadius: '6px',
                      backgroundColor: hoveredRegion === region.name ? '#e8e8e8' : 'transparent',
                      cursor: 'default',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(20, (region.value / data.max_value) * 100)}%`,
                        minWidth: '4px',
                        height: '16px',
                        backgroundColor: getColor(region.value, data.min_value, data.max_value),
                        borderRadius: '3px',
                        transition: 'width 0.3s'
                      }}
                    />
                    <span style={{ fontSize: '13px', flex: 1 }}>{region.name}</span>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 'bold',
                      minWidth: '60px',
                      textAlign: 'right'
                    }}>
                      {region.value.toLocaleString('ru-RU')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Легенда */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#fafafa',
        borderRadius: '8px'
      }}>
        <span style={{ fontSize: '14px' }}>Легенда:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '40px', height: '16px', backgroundColor: getColor(data.min_value, data.min_value, data.max_value), borderRadius: '3px' }} />
          <span style={{ fontSize: '12px' }}>{data.min_value.toLocaleString('ru-RU')}</span>
        </div>
        <div style={{ flex: 1, height: '4px', background: `linear-gradient(to right, ${getColor(data.min_value, data.min_value, data.max_value)}, ${getColor(data.max_value, data.min_value, data.max_value)})`, borderRadius: '2px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px' }}>{data.max_value.toLocaleString('ru-RU')}</span>
          <div style={{ width: '40px', height: '16px', backgroundColor: getColor(data.max_value, data.min_value, data.max_value), borderRadius: '3px' }} />
        </div>
      </div>

      {/* Статистика */}
      <div style={{ marginTop: '20px', fontSize: '14px', opacity: 0.7 }}>
        Всего регионов: {data.total_regions} |
        Мин. значение: {data.min_value.toLocaleString('ru-RU')} |
        Макс. значение: {data.max_value.toLocaleString('ru-RU')}
      </div>
    </div>
  );
}