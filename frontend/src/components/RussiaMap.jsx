import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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

// Функция для получения цвета по значению
function getColor(value, min, max) {
  if (max === min) return '#E0E0E0';
  const ratio = (value - min) / (max - min);
  const intensity = Math.floor(ratio * 255);
  return `rgb(${100 + intensity}, ${100 + Math.floor(ratio * 100)}, ${200 + Math.floor(ratio * 55)})`;
}

export default function RussiaMap({ datasetId }) {
  const [data, setData] = useState(null);
  const [geoJson, setGeoJson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [urbanFilter, setUrbanFilter] = useState(null);
  const [genderFilter, setGenderFilter] = useState(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);

    useEffect(() => {
    fetch('/russia.geojson')
        .then(res => res.json())
        .then(setGeoJson)
        .catch(err => console.error('Failed to load GeoJSON:', err));

    // Скрываем атрибут Leaflet
    const hideAttribution = () => {
        const attribution = document.querySelector('.leaflet-control-attribution');
        if (attribution) {
        attribution.style.display = 'none';
        }
    };

    hideAttribution();
    
    // На случай, если карта рендерится позже
    const interval = setInterval(hideAttribution, 500);
    
    return () => clearInterval(interval);
    }, []);



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

  if (loading || !geoJson) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка карты...</div>;
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

  // Стилизация каждого региона
  const styleRegion = (feature) => {
    const regionName = feature.properties.name;
    const value = regionValues[regionName];
    const isHovered = hoveredRegion === regionName;
    
    if (value === undefined) {
      return {
        fillColor: '#f0f0f0',
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.3
      };
    }

    return {
      fillColor: getColor(value, data.min_value, data.max_value),
      weight: isHovered ? 3 : 1,
      opacity: 1,
      color: isHovered ? '#333' : 'white',
      fillOpacity: isHovered ? 0.9 : 0.7
    };
  };

  // Обработчики событий
  const onEachRegion = (feature, layer) => {
    const regionName = feature.properties.name;
    const value = regionValues[regionName];

    layer.on({
      mouseover: () => setHoveredRegion(regionName),
      mouseout: () => setHoveredRegion(null),
    });

    if (value !== undefined) {
      layer.bindTooltip(
        `${regionName}: ${value.toLocaleString('ru-RU')}`,
        { sticky: true }
      );
    }
  };

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
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', minWidth: '200px' }}
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
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', minWidth: '200px' }}
          >
            {GENDER_FILTERS.map(filter => (
              <option key={filter.value || 'all'} value={filter.value || ''}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Легенда */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
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

      {/* Карта */}
      <MapContainer center={[60, 100]} zoom={2} style={{ height: '600px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=''
        />
        {geoJson && (
          <GeoJSON
            data={geoJson}
            style={styleRegion}
            onEachFeature={onEachRegion}
          />
        )}
      </MapContainer>

      {/* Статистика */}
      <div style={{ marginTop: '20px', fontSize: '14px', opacity: 0.7 }}>
        Всего регионов: {data.total_regions} |
        Мин. значение: {data.min_value.toLocaleString('ru-RU')} |
        Макс. значение: {data.max_value.toLocaleString('ru-RU')}
      </div>
    </div>
    );
}
