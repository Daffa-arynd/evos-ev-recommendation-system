import { useState, useRef } from "react";
import { recommendVehicles } from "./utils/api";
import { useGSAPScrollTrigger } from "./hooks/useGSAP";
import { useToast } from "./components/Toast";

import Hero           from "./components/Hero";
import PreferenceForm from "./components/PreferenceForm";
import ResultsPanel   from "./components/ResultsPanel";
import ParticleCanvas from "./components/ParticleCanvas";
import ClusterBadge   from "./components/ClusterBadge";
import Navbar         from "./components/Navbar";
import StatisticsPage from "./components/StatisticsPage";
import OnboardingTour from "./components/OnboardingTour";
import ComparePanel   from "./components/ComparePanel";
import BookmarkPanel  from "./components/BookmarkPanel";
import HistoryPanel   from "./components/HistoryPanel";
import "./styles/globals.css";

export default function App() {
  const [page, setPage]               = useState("home");
  const [profile, setProfile]         = useState("performance");
  const [loading, setLoading]         = useState(false);
  const [results, setResults]         = useState(null);
  const [error, setError]             = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [bookmarks, setBookmarks]     = useState(() => {
    try { return JSON.parse(localStorage.getItem("evos_bookmarks") || "[]"); }
    catch { return []; }
  });

  const resultsRef = useRef(null);
  const showToast  = useToast();

  useGSAPScrollTrigger();

  // ── Recommend ──────────────────────────────────────────────
  const handleRecommend = async (preferences, weights) => {
    setLoading(true); setError(null); setResults(null);
    try {
      const data = await recommendVehicles({
        ...preferences, cluster_profile: profile, weights, top_k: 5,
      });
      setResults(data);

      // Simpan ke History
      try {
        const history = JSON.parse(localStorage.getItem("evos_history") || "[]");
        const topRec  = data.recommendations?.[0];
        const newEntry = {
          id:          Date.now(),
          timestamp:   new Date().toISOString(),
          profile,
          preferences,
          weights,
          resultCount: data.recommendations?.length || 0,
          topResult: topRec ? {
            manufacturer: topRec.vehicle.manufacturer,
            model:        topRec.vehicle.model,
            similarity:   topRec.similarity_pct,
          } : null,
        };
        const updated = [newEntry, ...history].slice(0, 20);
        localStorage.setItem("evos_history", JSON.stringify(updated));
      } catch (e) {
        console.error("History save error:", e);
      }

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);

    } catch (err) {
      setError(err.message || "Recommendation failed.");
    } finally {
      setLoading(false);
    }
  };

  // ── Load History ───────────────────────────────────────────
  const handleLoadHistory = (h) => {
    setProfile(h.profile);
    showToast("🕐 History loaded!", "info");
  };

  // ── Compare ────────────────────────────────────────────────
  const toggleCompare = (vehicle) => {
    setCompareList(prev => {
      const exists = prev.find(v => v.vehicle_id === vehicle.vehicle_id);
      if (exists) {
        showToast("Removed from compare list", "warning");
        return prev.filter(v => v.vehicle_id !== vehicle.vehicle_id);
      }
      if (prev.length >= 3) {
        showToast("Maximum 3 EVs in compare!", "error");
        return prev;
      }
      showToast("⚖️ Added to compare list!", "success");
      return [...prev, vehicle];
    });
  };

  // ── Bookmark ───────────────────────────────────────────────
  const toggleBookmark = (vehicle) => {
    setBookmarks(prev => {
      const exists = prev.find(v => v.vehicle_id === vehicle.vehicle_id);
      const updated = exists
        ? prev.filter(v => v.vehicle_id !== vehicle.vehicle_id)
        : [...prev, vehicle];
      localStorage.setItem("evos_bookmarks", JSON.stringify(updated));
      if (exists) {
        showToast("Removed from bookmarks", "warning");
      } else {
        showToast("❤️ Saved to bookmarks!", "success");
      }
      return updated;
    });
  };

  const isBookmarked = (id) => bookmarks.some(v => v.vehicle_id === id);
  const isInCompare  = (id) => compareList.some(v => v.vehicle_id === id);

  return (
    <div className="app">
      <ParticleCanvas />
      <OnboardingTour />

      <Navbar
        page={page}
        onNavigate={setPage}
        bookmarkCount={bookmarks.length}
        compareCount={compareList.length}
        onShowCompare={() => setShowCompare(true)}
      />

      {/* Compare Panel */}
      {showCompare && compareList.length > 0 && (
        <ComparePanel
          vehicles={compareList}
          onClose={() => setShowCompare(false)}
          onRemove={(id) => {
            setCompareList(p => p.filter(v => v.vehicle_id !== id));
            showToast("Removed from compare", "warning");
          }}
        />
      )}

      {/* Home Page */}
      {page === "home" && (
        <div className="app-inner">
          <Hero />

          <section className="section gsap-reveal">
            <ClusterBadge selected={profile} onSelect={setProfile} />
          </section>

          <section className="section gsap-reveal">
            <PreferenceForm
              profile={profile}
              onSubmit={handleRecommend}
              loading={loading}
            />
          </section>

          <div ref={resultsRef}>
            {(results || loading || error) && (
              <section className="section">
                <ResultsPanel
                  results={results}
                  loading={loading}
                  error={error}
                  onToggleCompare={toggleCompare}
                  onToggleBookmark={toggleBookmark}
                  isInCompare={isInCompare}
                  isBookmarked={isBookmarked}
                  compareCount={compareList.length}
                />
              </section>
            )}
          </div>

          {/* History Panel floating button */}
          <HistoryPanel onLoadHistory={handleLoadHistory} />
        </div>
      )}

      {/* Statistics Page */}
      {page === "statistics" && <StatisticsPage />}

      {/* Bookmarks Page */}
      {page === "bookmarks" && (
        <BookmarkPanel
          bookmarks={bookmarks}
          onRemove={toggleBookmark}
          onToggleCompare={toggleCompare}
          isInCompare={isInCompare}
        />
      )}
    </div>
  );
}