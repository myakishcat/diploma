import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function DatasetList() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDate = (isoDate) => {
    if (!isoDate) return "—";
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  };

  const formatFileSize = (kb) => {
    if (!kb && kb !== 0) return "—";
    if (kb < 1024) return `${kb} КБ`;
    return `${(kb / 1024).toFixed(1)} МБ`;
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return "—";
    return num.toLocaleString("ru-RU");
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/datasets/");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setError(String(e));
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div style={{ padding: 40 }}>Загрузка...</div>;
  if (error) return <div style={{ padding: 40, color: "red" }}>Ошибка: {error}</div>;
  if (!items || items.length === 0) return <div style={{ padding: 40 }}>Нет датасетов</div>;

  return (
    <div className="dataset-list-container">
      <h1>Список датасетов</h1>
      <ul style={{ padding: 0 }}>
        {items.map((item) => (
          <li key={item.id} className="dataset-list-item">
            <div className="dataset-title">
              <Link to={`/dataset/${encodeURIComponent(item.id)}`}>
                {item.title || item.id}
              </Link>
            </div>
            <div className="dataset-meta-wrapper">
              <div className="dataset-meta">
                <span>{formatNumber(item.rows_count)} строк</span>
                <span>Размер: {formatFileSize(item.file_size_kb)}</span>
                <span>Обновлен: {formatDate(item.modified)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}