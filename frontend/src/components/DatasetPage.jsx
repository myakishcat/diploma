import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PieChart from './PieChart';

export default function DatasetPage() {
  const { id } = useParams();
  const [meta, setMeta] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [stats, setStats] = useState(null);
  

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

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const metaRes = await fetch(`http://127.0.0.1:8000/api/datasets/${encodeURIComponent(id)}`);
        if (!metaRes.ok) throw new Error(`Meta HTTP ${metaRes.status}`);
        const metaJson = await metaRes.json();

        const rowsRes = await fetch(`http://127.0.0.1:8000/api/datasets/${encodeURIComponent(id)}/rows?offset=0&limit=20`);
        if (!rowsRes.ok) throw new Error(`Rows HTTP ${rowsRes.status}`);
        const rowsJson = await rowsRes.json();

        setMeta(metaJson);
        setRowsData(rowsJson);
      } catch (e) {
        console.error("Load dataset error:", e);
        setErr(String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);


  if (loading) return <div style={{ padding: 40, color: "white" }}>Загрузка...</div>;
  if (err) return <div style={{ padding: 40, color: "red" }}>Ошибка: {err}</div>;
  if (!meta) return <div style={{ padding: 40, color: "white" }}>Метаданные не найдены</div>;

  return (
    <div style={{ padding: 40, color: "white" }}>
      <h1>{meta.title || meta.identifier}</h1>
      <p style={{ opacity: 0.8 }}>{meta.description}</p>

      <h3>Структура колонок</h3>
      <ul>
        {Array.isArray(meta.columns) && meta.columns.length ? (
          meta.columns.map(c => (
            <li key={c.field_name}>
              <b>{c.field_name}</b> — {c.russian_description || c.english_description || c.format}
            </li>
          ))
        ) : (
          <li>Нет описания колонок</li>
        )}
      </ul>

      {stats && (
        <>
          <h3>Статистика по колонкам</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {Object.entries(stats).map(([colName, colStats]) => (
              <div key={colName} style={{ border: '1px solid #555', padding: '12px', borderRadius: '8px' }}>
                <h4>{colName} ({colStats.type})</h4>

                {/* ДВЕ КОЛОНКИ ДЛЯ ТЕКСТОВОЙ СТАТИСТИКИ */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  {/* Левая колонка: общая статистика */}
                  <div>
                    <p>Количество значений: {colStats.count}</p>
                    <p>Уникальных значений: {colStats.unique}</p>
                    <p>Пропусков: {colStats.nulls}</p>
                  </div>

                  {/* Правая колонка: специфические числовые метрики (только текст) */}
                  <div>
                    {colStats.type === "categorical" && (
                      <>
                        {colStats.unique > 5 && colStats.top_values && (
                          <div>
                            <strong>Топ-10 значений:</strong>
                            <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                              {colStats.top_values.slice(0, 10).map((item, idx) => (
                                <li key={idx} style={{ fontSize: '12px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                                  <span style={{ fontWeight: 'bold', flex: 1 }}>{item.value}</span>
                                  <span style={{ color: '#aaa', whiteSpace: 'nowrap' }}>{item.percent}% ({item.count})</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {colStats.unique <= 5 && <p>—</p>}
                      </>
                    )}
                  </div>
                </div>

                {/* ДИАГРАММА НА ВСЮ ШИРИНУ (ПОД КОЛОНКАМИ) */}
                <div style={{ marginTop: '8px' }}>
                  {colStats.type === "numeric" && (
                    <div>
                      <strong>Распределение:</strong>
                      
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, marginTop: 8 }}>
                        {(() => {
                          // Находим максимальное значение count среди всех bucket'ов
                          const maxCount = Math.max(...(colStats.histogram?.map(b => b.count) || [0]));
                          const maxHeight = 150; // желаемая высота самого высокого столбца (пиксели)
                          return colStats.histogram?.map((bucket, idx) => {
                            // Высота пропорциональна count относительно maxCount
                            const height = maxCount === 0 ? 0 : (bucket.count / maxCount) * maxHeight;
                            return (
                              <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <div style={{ backgroundColor: "#4caf50", width: "100%", height: `${height}px`, minHeight: "2px" }} />
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
                          <PieChart data={filtered} width={200} height={200} />
                          <div style={{ fontSize: '12px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
                            {filtered.map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: `hsl(${idx * 60}, 70%, 50%)` }} />
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

      <h3>Данные (первые строки)</h3>
      <pre style={{ background: "#222", padding: 12, borderRadius: 8 }}>
        {JSON.stringify(rowsData?.rows ?? [], null, 2)}
      </pre>
    </div>
  );
}
