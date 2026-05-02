import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

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
          {Object.entries(stats).map(([colName, colStats]) => (
            <div key={colName} style={{ marginBottom: 24, border: "1px solid #555", padding: 12, borderRadius: 8 }}>
              <h4>{colName} ({colStats.type})</h4>
              <p>Количество значений: {colStats.count}</p>
              <p>Уникальных значений: {colStats.unique}</p>
              <p>Пропусков: {colStats.nulls}</p>
              {colStats.type === "numeric" && (
                <>
                  <p>Минимум: {colStats.min}</p>
                  <p>Максимум: {colStats.max}</p>
                  <p>Среднее: {colStats.mean?.toFixed(2)}</p>
                  <p>Медиана: {colStats.median?.toFixed(2)}</p>
                  <div>
                    <strong>Гистограмма:</strong>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, marginTop: 8 }}>
                      {colStats.histogram?.map((bucket, idx) => {
                        const height = (bucket.count / colStats.count) * 100; // процент от общего числа
                        return (
                          <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ backgroundColor: "#4caf50", width: "100%", height: `${height}px`, minHeight: "2px" }} />
                            <span style={{ fontSize: "10px" }}>{bucket.bucket_start.toFixed(0)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </>
      )}

      <h3>Данные (первые строки)</h3>
      <pre style={{ background: "#222", padding: 12, borderRadius: 8 }}>
        {JSON.stringify(rowsData?.rows ?? [], null, 2)}
      </pre>
    </div>
  );
}
