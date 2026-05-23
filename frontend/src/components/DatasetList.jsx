import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function DatasetList() {
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("modified");
  const [sortOrder, setSortOrder] = useState("desc");

  const [filters, setFilters] = useState({
    modifiedMin: "", modifiedMax: "",
    validMin: "", validMax: "",
    createdMin: "", createdMax: "",
    rowsCountMin: "", rowsCountMax: "",
    fileSizeKbMin: "", fileSizeKbMax: "",
    subject: "",
  });

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

  const applySorting = (items) => {
    const sorted = [...items];
    sorted.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === "modified" || sortBy === "valid" || sortBy === "created") {
        valA = valA || "";
        valB = valB || "";
      }
      if (sortBy === "rows_count" || sortBy === "file_size_kb") {
        valA = valA || 0;
        valB = valB || 0;
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  const applyFilters = () => {
    let result = [...allItems];
    // Фильтрация
    if (filters.modifiedMin) result = result.filter(item => item.modified >= filters.modifiedMin);
    if (filters.modifiedMax) result = result.filter(item => item.modified <= filters.modifiedMax);
    if (filters.validMin) result = result.filter(item => item.valid >= filters.validMin);
    if (filters.validMax) result = result.filter(item => item.valid <= filters.validMax);
    if (filters.createdMin) result = result.filter(item => item.created >= filters.createdMin);
    if (filters.createdMax) result = result.filter(item => item.created <= filters.createdMax);
    const rowsMin = parseFloat(filters.rowsCountMin);
    const rowsMax = parseFloat(filters.rowsCountMax);
    if (!isNaN(rowsMin)) result = result.filter(item => item.rows_count >= rowsMin);
    if (!isNaN(rowsMax)) result = result.filter(item => item.rows_count <= rowsMax);
    const sizeMin = parseFloat(filters.fileSizeKbMin);
    const sizeMax = parseFloat(filters.fileSizeKbMax);
    if (!isNaN(sizeMin)) result = result.filter(item => item.file_size_kb >= sizeMin);
    if (!isNaN(sizeMax)) result = result.filter(item => item.file_size_kb <= sizeMax);

    if (filters.subject.trim() !== "") {
      const queryKeywords = filters.subject.split(',').map(k => k.trim().toLowerCase()).filter(k => k !== "");
      result = result.filter(item => {
        const titleLower = (item.title || "").toLowerCase();
        const subjectLower = (item.subject || "").toLowerCase();
        // Для каждого слова из запроса проверяем, содержится ли оно в title или в subject
        return queryKeywords.every(qk => titleLower.includes(qk) || subjectLower.includes(qk));
      });
    }

    // Сортировка
    result = applySorting(result);
    setFilteredItems(result);
  };

  const resetFilters = () => {
    setFilters({
      modifiedMin: "", modifiedMax: "", validMin: "", validMax: "",
      createdMin: "", createdMax: "", rowsCountMin: "", rowsCountMax: "",
      fileSizeKbMin: "", fileSizeKbMax: "", subject: "",
    });
    setFilteredItems(applySorting(allItems));
  };

  useEffect(() => {
    if (allItems.length) applyFilters();
  }, [allItems]);

  useEffect(() => {
    if (allItems.length && filteredItems.length) {
      setFilteredItems(prev => applySorting(prev));
    }
  }, [sortBy, sortOrder]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSortByChange = (e) => setSortBy(e.target.value);
  const handleSortOrderChange = (e) => setSortOrder(e.target.value);

  // Загрузка данных
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/datasets/");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAllItems(Array.isArray(data) ? data : []);
        setFilteredItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div style={{ padding: 40 }}>Загрузка...</div>;
  if (error) return <div style={{ padding: 40, color: "red" }}>Ошибка: {error}</div>;

  return (
    <div className="dataset-list-layout">
      {/* Левая панель – только фильтры */}
      <div className="filters-panel">
        <h3>Фильтры</h3>
        <div className="filter-group">
          <label>Дата изменения (modified)</label>
          <div className="range-inputs">
            <input type="date" name="modifiedMin" value={filters.modifiedMin} onChange={handleFilterChange} />
            <span>–</span>
            <input type="date" name="modifiedMax" value={filters.modifiedMax} onChange={handleFilterChange} />
          </div>
        </div>
        <div className="filter-group">
          <label>Действителен до (valid)</label>
          <div className="range-inputs">
            <input type="date" name="validMin" value={filters.validMin} onChange={handleFilterChange} />
            <span>–</span>
            <input type="date" name="validMax" value={filters.validMax} onChange={handleFilterChange} />
          </div>
        </div>
        <div className="filter-group">
          <label>Дата создания (created)</label>
          <div className="range-inputs">
            <input type="date" name="createdMin" value={filters.createdMin} onChange={handleFilterChange} />
            <span>–</span>
            <input type="date" name="createdMax" value={filters.createdMax} onChange={handleFilterChange} />
          </div>
        </div>
        <div className="filter-group">
          <label>Количество строк (rows_count)</label>
          <div className="range-inputs">
            <input type="number" name="rowsCountMin" value={filters.rowsCountMin} onChange={handleFilterChange} placeholder="от" />
            <span>–</span>
            <input type="number" name="rowsCountMax" value={filters.rowsCountMax} onChange={handleFilterChange} placeholder="до" />
          </div>
        </div>
        <div className="filter-group">
          <label>Размер файла (КБ)</label>
          <div className="range-inputs">
            <input type="number" name="fileSizeKbMin" value={filters.fileSizeKbMin} onChange={handleFilterChange} placeholder="от" />
            <span>–</span>
            <input type="number" name="fileSizeKbMax" value={filters.fileSizeKbMax} onChange={handleFilterChange} placeholder="до" />
          </div>
        </div>
        <div className="filter-group">
          <label>Поиск (название, ключевые слова)</label>
          <input
            type="text"
            name="subject"
            value={filters.subject}
            onChange={handleFilterChange}
            placeholder="микроперепись, население"
            className="text-filter-input"
          />
        </div>
        <div className="filter-buttons">
          <button onClick={applyFilters} className="apply-btn">Применить фильтры</button>
          <button onClick={resetFilters} className="reset-btn">Сбросить фильтры</button>
        </div>
      </div>

      {/* Правая часть */}
      <div className="datasets-list">
        <h1>Список датасетов</h1>

        {/* Блок сортировки */}
        <div className="sorting-panel">
          <span className="sort-label">Сортировать по:</span>
          <select value={sortBy} onChange={handleSortByChange} className="sort-select">
            <option value="modified">Дате изменения</option>
            <option value="valid">Дате действия</option>
            <option value="created">Дате создания</option>
            <option value="rows_count">Количеству строк</option>
            <option value="file_size_kb">Размеру файла</option>
          </select>
          <select value={sortOrder} onChange={handleSortOrderChange} className="sort-order">
            <option value="desc">По убыванию</option>
            <option value="asc">По возрастанию</option>
          </select>
        </div>

        {filteredItems.length === 0 ? (
          <div className="no-results">Нет датасетов, соответствующих фильтрам</div>
        ) : (
          <ul style={{ padding: 0 }}>
            {filteredItems.map((item) => (
              <li key={item.id} className="dataset-list-item">
                <div className="dataset-title">
                  <Link to={`/dataset/${encodeURIComponent(item.id)}`}>{item.title || item.id}</Link>
                </div>
                <div className="dataset-meta-wrapper">
                  <div className="dataset-meta">
                    <span>📊 {formatNumber(item.rows_count)} строк</span>
                    <span>💾 {formatFileSize(item.file_size_kb)}</span>
                    <span>🕒 {formatDate(item.modified)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}