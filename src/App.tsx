import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WelcomePage from "@/pages/WelcomePage";
import HomePage from "@/pages/HomePage";
import MemberDetailPage from "@/pages/MemberDetailPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/member/:id" element={<MemberDetailPage />} />
      </Routes>
    </Router>
  );
}
