import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function DatasetPage() {
  const { id } = useParams();
  const [meta, setMeta] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

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

      <h3>Данные (первые строки)</h3>
      <pre style={{ background: "#222", padding: 12, borderRadius: 8 }}>
        {JSON.stringify(rowsData?.rows ?? [], null, 2)}
      </pre>
    </div>
  );
}
