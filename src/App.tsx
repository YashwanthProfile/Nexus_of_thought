import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';

const Home = lazy(() => import('./views/Home').then(m => ({ default: m.Home })));
const Post = lazy(() => import('./views/Post').then(m => ({ default: m.Post })));
const Essays = lazy(() => import('./views/Essays').then(m => ({ default: m.Essays })));
const Graph = lazy(() => import('./views/Graph').then(m => ({ default: m.Graph })));
const Authors = lazy(() => import('./views/Authors').then(m => ({ default: m.Authors })));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-[#fdfdfc] transition-colors duration-300">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/post/:slug" element={<Post />} />
              <Route path="/essays" element={<Essays />} />
              <Route path="/graph" element={<Graph />} />
              <Route path="/authors" element={<Authors />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}

