import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import PieChart, { SOFT_COLORS } from './PieChart';
import RussiaHeatmap from './RussiaHeatmap';

export default function DatasetPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [meta, setMeta] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const isLoadingRef = useRef(false);
  const tableContainerRef = useRef(null);
  const LIMIT = 50;

  // Функция поиска URL по префиксу в ключах метаданных
  const getDownloadUrl = (prefix) => {
    if (!meta) return null;
    const key = Object.keys(meta).find(k => k.toLowerCase().startsWith(prefix.toLowerCase()));
    return key ? meta[key] : null;
  };

  const dataUrl = getDownloadUrl('data_url');
  const structureUrl = getDownloadUrl('structure_url');

  // Функция скачивания файла
  const handleDownload = (url, filename) => {
    if (!url) return;

    // Преобразуем относительный путь в абсолютный (если нужно)
    let fullUrl = url;
    if (url.startsWith('/')) {
      fullUrl = `http://127.0.0.1:8000${url}`;
    } else if (!url.startsWith('http')) {
      fullUrl = `http://127.0.0.1:8000/${url}`;
    }

    // Открываем в новой вкладке – для внешних ссылок (https://rosstat.gov.ru/...) 
    // это вызовет скачивание или отображение в зависимости от настроек сервера.
    // Если ссылка ведёт на наш бэкенд, то браузер тоже начнёт скачивание (благодаря заголовкам).
    window.open(fullUrl, '_blank');
  };

  // Загрузка статистики
  useEffect(() => {
    async function loadStats() {
      if (!id) return;
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/datasets/${encodeURIComponent(id)}/stats`);
        if (!res.ok) throw new Error(`Stats HTTP ${res.status}`);
        const statsJson = await res.json();
        setStats(statsJson);
      } catch (e) {
        console.error("Load stats error:", e);
      }
    }
    loadStats();
  }, [id]);

  // Загрузка метаданных
  useEffect(() => {
    async function loadMeta() {
      setLoading(true);
      setErr(null);
      setRows([]);
      setOffset(0);
      setHasMore(true);
      setTotalRows(0);
      isLoadingRef.current = false;
      try {
        const metaRes = await fetch(`http://127.0.0.1:8000/api/datasets/${encodeURIComponent(id)}`);
        if (!metaRes.ok) throw new Error(`Meta HTTP ${metaRes.status}`);
        const metaJson = await metaRes.json();
        console.log('Meta data:', metaJson); // для отладки
        setMeta(metaJson);
      } catch (e) {
        console.error("Load dataset error:", e);
        setErr(String(e));
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, [id]);

  // Загрузка строк (пагинация) – без изменений
  const loadMoreRows = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;
    isLoadingRef.current = true;
    setLoadingRows(true);
    try {
      const url = `http://127.0.0.1:8000/api/datasets/${encodeURIComponent(id)}/rows?offset=${offset}&limit=${LIMIT}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Rows HTTP ${res.status}`);
      const data = await res.json();
      const newRows = data.rows || [];
      setRows(prev => [...prev, ...newRows]);
      setTotalRows(data.total_rows);
      const newOffset = offset + LIMIT;
      setOffset(newOffset);
      if (newOffset >= data.total_rows || newRows.length < LIMIT) {
        setHasMore(false);
      }
    } catch (e) {
      console.error("Load rows error:", e);
      setErr(e.message);
    } finally {
      setLoadingRows(false);
      isLoadingRef.current = false;
    }
  }, [id, offset, hasMore]);

  // Первая загрузка строк
  useEffect(() => {
    if (!loading && meta && rows.length === 0 && hasMore) {
      loadMoreRows();
    }
  }, [loading, meta, rows.length, hasMore, loadMoreRows]);

  // Прокрутка для дозагрузки
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 50 && !loadingRows && hasMore && !isLoadingRef.current) {
        loadMoreRows();
      }
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadingRows, hasMore, loadMoreRows]);

  const getColumnHeaders = () => {
    if (!meta || !meta.columns) return [];
    return meta.columns.map(col => {
      const field = col.field_name;
      let dataType = col.format;
      if (!dataType && stats && stats[field]) {
        dataType = stats[field].type;
      }
      const description = col.russian_description || '';
      const title = col.russian_description || field;
      return { field, title, dataType, description };
    });
  };
  const headers = getColumnHeaders();

  if (loading) return <div style={{ padding: 40 }}>Загрузка...</div>;
  if (err) return <div style={{ padding: 40, color: "red" }}>Ошибка: {err}</div>;
  if (!meta) return <div style={{ padding: 40 }}>Метаданные не найдены</div>;

  return (
    <div className="dataset-page-container" style={{ padding: '40px' }}>
      {/* Верхняя панель с кнопками */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <button onClick={() => navigate('/')} className="back-button">
          ← Вернуться к списку датасетов
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          {dataUrl && (
            <button
              onClick={() => handleDownload(dataUrl, `${meta.identifier || id}_data.csv`)}
              className="download-button"
            >
              Скачать датасет
            </button>
          )}
          {structureUrl && (
            <button
              onClick={() => handleDownload(structureUrl, `${meta.identifier || id}_structure.csv`)}
              className="download-button"
            >
              Скачать структуру
            </button>
          )}
        </div>
      </div>

      <h1 style={{ fontSize: '2rem', marginTop: '0' }}>{meta.title || meta.identifier}</h1>
      <p style={{ opacity: 0.8 }}>{meta.description}</p>

      {/* Блок статистики – без изменений */}
      {stats && (
        <>
          <h3>Статистика по колонкам</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {Object.entries(stats).map(([colName, colStats]) => (
              <div key={colName} className="stats-card">
                <h4>{colName} ({colStats.type})</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <p>Количество значений: {colStats.count}</p>
                    <p>Уникальных значений: {colStats.unique}</p>
                    <p>Пропусков: {colStats.nulls}</p>
                  </div>
                  <div>
                    {colStats.unique > 5 && colStats.top_values && (
                      <div>
                        <strong>Топ-5 значений:</strong>
                        <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                          {colStats.top_values.slice(0, 5).map((item, idx) => (
                            <li key={idx} style={{ fontSize: '12px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                              <span style={{ fontWeight: 'bold', flex: 1 }}>{item.value}</span>
                              <span style={{ color: '#aaa', whiteSpace: 'nowrap' }}>{item.percent}% ({item.count})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: '8px' }}>
                  {colStats.type === "numeric" && (
                    <div>
                      <strong>Распределение:</strong>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, marginTop: 8 }}>
                        {(() => {
                          const maxCount = Math.max(...(colStats.histogram?.map(b => b.count) || [0]));
                          const maxHeight = 150;
                          return colStats.histogram?.map((bucket, idx) => {
                            const height = maxCount === 0 ? 0 : (bucket.count / maxCount) * maxHeight;
                            return (
                              <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <div style={{ backgroundColor: "#908DCE", width: "100%", height: `${height}px`, minHeight: "2px" }} />
                                <span style={{ fontSize: "10px" }}>{bucket.bucket_start.toFixed(0)}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                  {colStats.type === "categorical" && colStats.unique <= 5 && colStats.top_values && (() => {
                    const filtered = colStats.top_values.filter(v => v.count > 0);
                    if (filtered.length < 2) return null;
                    return (
                      <div>
                        <strong>Распределение:</strong>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <PieChart data={filtered} width={150} height={150} />
                          <div style={{ fontSize: '12px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
                            {filtered.map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: SOFT_COLORS[idx % SOFT_COLORS.length] }} />
                                <span>{item.value}: {item.percent}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Хитмап карты России - показываем только если есть колонка area */}
      {meta?.columns?.some(col => col.field_name === 'area') && (
        <RussiaHeatmap datasetId={id} />
      )}

      <h3>Данные</h3>
      <div className="dataset-table-wrapper" ref={tableContainerRef}>
        <div className="dataset-table-inner">
          <table className="dataset-table">
            <thead>
              <tr>{headers.map(header => <th key={header.field}>{header.title}</th>)}</tr>
              <tr>{headers.map(header => <th key={`type-${header.field}`}>{header.dataType || '—'}</th>)}</tr>
              <tr>{headers.map(header => <th key={`desc-${header.field}`}>{header.description || '—'}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                  {headers.map(header => (
                    <td key={header.field}>
                      {row[header.field] !== undefined && row[header.field] !== null ? row[header.field] : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loadingRows && <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка следующих строк...</div>}
        {!hasMore && rows.length > 0 && <div style={{ textAlign: 'center', padding: '20px' }}>Все строки загружены (всего {totalRows})</div>}
        {!hasMore && rows.length === 0 && <div style={{ textAlign: 'center', padding: '20px' }}>Нет данных для отображения</div>}
      </div>
    </div>
  );
}