import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function DatasetList() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/datasets/");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log("API /api/datasets response:", data);
        setItems(Array.isArray(data) ? data : []); // обязательно массив
      } catch (e) {
        console.error("Ошибка загрузки списка датасетов:", e);
        setError(String(e));
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, color: "white" }}>Загрузка...</div>;
  if (error) return <div style={{ padding: 40, color: "red" }}>Ошибка: {error}</div>;
  if (!items || items.length === 0) return <div style={{ padding: 40, color: "white" }}>Нет датасетов</div>;

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ color: "white" }}>Список датасетов</h1>
      <ul style={{ padding: 0 }}>
        {items.map(item => (
          <li key={item.id} style={{ listStyle: "none", marginBottom: 12 }}>
            <Link to={`/dataset/${encodeURIComponent(item.id)}`} style={{ color: "#5dc1ff", fontSize: 16 }}>
              {item.title || item.id}
            </Link>
            <div style={{ color: "#aaa", fontSize: 12 }}>{item.id}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
