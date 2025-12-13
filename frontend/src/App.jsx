import { Routes, Route } from "react-router-dom";
import DatasetList from "./components/DatasetList";
import DatasetPage from "./components/DatasetPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DatasetList />} />
      <Route path="/dataset/:id" element={<DatasetPage />} />
    </Routes>
  );
}
