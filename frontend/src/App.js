// Scroll to top on route change
import { useLocation } from 'react-router-dom';
import { useLayoutEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }, 100);
  }, [pathname]);
  return null;
}
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import GaugeChart from 'react-gauge-chart';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Ensure Roboto font is loaded (for local dev, add to index.html as well)
// This import is for most build setups; fallback to Google Fonts CDN in index.html if needed


// Get backend URL from environment
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement);

// Fix Leaflet default markers
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// API service functions
const apiService = {
  async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`API Error - GET ${endpoint}:`, error);
      throw error;
    }
  },

  async post(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`API Error - POST ${endpoint}:`, error);
      throw error;
    }
  }
};

// Navigation Component
const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Accept animatedLogoStyle prop for morphing effect
  return (
    <nav className="sticky top-0 z-50 bg-white/20 dark:bg-[#18181b]/40 backdrop-blur-md w-full py-3 px-2 flex justify-center border-b border-[#e5e7eb]/30 dark:border-[#27272a]/60 transition-all duration-300">
      <div className="w-full max-w-7xl flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 px-2">
          <span className="bg-white dark:bg-[#232326] rounded-full px-6 py-2 flex items-center justify-center text-black dark:text-white text-2xl font-bold tracking-tight" style={{ fontFamily: 'monospace', letterSpacing: '0.01em' }}>
            <span className="sr-only">AquaVigil</span>
            <span style={{ fontWeight: 600, fontSize: 24, letterSpacing: '-0.04em' }}>AquaVigil</span>
          </span>
        </Link>
        {/* Nav links - now right aligned, buttons removed */}
        <div className="hidden md:flex items-center gap-2 bg-white dark:bg-[#232326] rounded-full px-6 py-2 shadow border border-[#e5e7eb] dark:border-[#27272a] ml-auto">
          <Link to="/" className="px-4 py-1 text-gray-700 dark:text-gray-100 font-semibold rounded-full transition-all duration-200 hover:bg-cyan-100 dark:hover:bg-[#232326] hover:text-cyan-700 dark:hover:text-cyan-300 tracking-wide" style={{ fontFamily: 'Poppins, Inter, Montserrat, Arial, sans-serif', fontWeight: 600, letterSpacing: '0.04em', fontSize: '1.08rem' }}>Home</Link>
          <Link to="/map" className="px-4 py-1 text-gray-700 dark:text-gray-100 font-semibold rounded-full transition-all duration-200 hover:bg-cyan-100 dark:hover:bg-[#232326] hover:text-cyan-700 dark:hover:text-cyan-300 tracking-wide" style={{ fontFamily: 'Poppins, Inter, Montserrat, Arial, sans-serif', fontWeight: 600, letterSpacing: '0.04em', fontSize: '1.08rem' }}>Map</Link>
          <Link to="/statistics" className="px-4 py-1 text-gray-700 dark:text-gray-100 font-semibold rounded-full transition-all duration-200 hover:bg-cyan-100 dark:hover:bg-[#232326] hover:text-cyan-700 dark:hover:text-cyan-300 tracking-wide" style={{ fontFamily: 'Poppins, Inter, Montserrat, Arial, sans-serif', fontWeight: 600, letterSpacing: '0.04em', fontSize: '1.08rem' }}>Statistics</Link>
          <Link to="/history" className="px-4 py-1 text-gray-700 dark:text-gray-100 font-semibold rounded-full transition-all duration-200 hover:bg-cyan-100 dark:hover:bg-[#232326] hover:text-cyan-700 dark:hover:text-cyan-300 tracking-wide" style={{ fontFamily: 'Poppins, Inter, Montserrat, Arial, sans-serif', fontWeight: 600, letterSpacing: '0.04em', fontSize: '1.08rem' }}>History</Link>
          <Link to="/contact" className="px-4 py-1 text-gray-700 dark:text-gray-100 font-semibold rounded-full transition-all duration-200 hover:bg-cyan-100 dark:hover:bg-[#232326] hover:text-cyan-700 dark:hover:text-cyan-300 tracking-wide" style={{ fontFamily: 'Poppins, Inter, Montserrat, Arial, sans-serif', fontWeight: 600, letterSpacing: '0.04em', fontSize: '1.08rem' }}>Contact</Link>
        </div>
      </div>
    </nav>
  );
};

// Minimalistic animated bubble background overlay
const BubbleBackground = ({ containerHeight }) => {
  const [bubbles, setBubbles] = useState([]);
  const bubblesRef = React.useRef([]);
  const containerRef = React.useRef();
  const maxBubbles = 36;

  // Helper to spawn a bubble at a random position with random velocity
  function spawnBubble(key) {
    // Random size: 18px to 56px
    const size = 18 + Math.random() * 38;
    // Spawn anywhere in the container (not just edges)
    const x = Math.random(); // 0-1
    const y = Math.random(); // 0-1
    // Random direction and slightly reduced speed
    const angle = Math.random() * 2 * Math.PI;
    const speed = 0.06 + Math.random() * 0.09; // 0.06-0.15 (slower)
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    // Random alpha for color and opacity, some lighter, some darker
    const minAlpha = 0.22, maxAlpha = 0.48;
    const colorAlpha = minAlpha + Math.random() * (maxAlpha - minAlpha);
    const opacity = colorAlpha; // match opacity to color alpha for more natural look
    return {
      key,
      size,
      x,
      y,
      vx,
      vy,
      opacity,
      born: Date.now(),
      color: `rgba(34,211,238,${colorAlpha})` // random cyan alpha
    };
  }

  // Animation loop
  const lastTimeRef = React.useRef(Date.now());
  useEffect(() => {
    let running = true;
    // Initialize bubblesRef
    if (bubblesRef.current.length === 0) {
      for (let i = 0; i < maxBubbles; i++) {
        bubblesRef.current.push(spawnBubble(Math.random().toString(36).slice(2)));
      }
      setBubbles([...bubblesRef.current]);
    }
    function animate() {
      if (!running) return;
      const now = Date.now();
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05); // seconds, cap at 50ms
      lastTimeRef.current = now;
      let arr = bubblesRef.current.map(b => {
        let { x, y, vx, vy, size, born } = b;
        // Bounce off edges
        if (x <= 0 && vx < 0) vx = -vx;
        if (x >= 1 && vx > 0) vx = -vx;
        if (y <= 0 && vy < 0) vy = -vy;
        if (y >= 1 && vy > 0) vy = -vy;
        // Move
        x += vx * dt;
        y += vy * dt;
        // Clamp
        x = Math.max(0, Math.min(1, x));
        y = Math.max(0, Math.min(1, y));
        // Fade out after 9s
        let age = (now - born) / 1000;
        let opacity = b.opacity * (age > 9 ? Math.max(0, 1 - (age - 9)) : 1);
        return { ...b, x, y, vx, vy, opacity };
      });
      // Remove bubbles older than 10s
      arr = arr.filter(b => now - b.born < 10000 && b.opacity > 0.01);
      // Spawn new if needed
      while (arr.length < maxBubbles) {
        arr.push(spawnBubble(Math.random().toString(36).slice(2)));
      }
      bubblesRef.current = arr;
      setBubbles([...arr]);
      requestAnimationFrame(animate);
    }
    animate();
    return () => { running = false; };
  }, []);

  // Get container size in px
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [containerHeight]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute left-0 top-0 w-full z-30 overflow-hidden"
      style={{ height: containerHeight }}
    >
      {bubbles.map(b => (
        <span
          key={b.key}
          style={{
            position: 'absolute',
            left: b.x * (containerSize.width - b.size),
            top: b.y * (containerSize.height - b.size),
            width: b.size,
            height: b.size,
            opacity: b.opacity,
            background: b.color,
            boxShadow: '0 2px 16px 0 rgba(34,211,238,0.12)',
            transition: 'opacity 0.3s',
            pointerEvents: 'none',
          }}
          className="rounded-full"
        />
      ))}
    </div>
  );
};

// Homepage Component
const Homepage = () => {
  // Animation state for cover card and header logo
  const [coverAnim, setCoverAnim] = useState(0); // 0 = full cover, 1 = fully scrolled
  useEffect(() => {
    function onScroll() {
      if (!pageRef.current) return;
      const rect = pageRef.current.getBoundingClientRect();
      // When top of card is at top of viewport, anim=0; when 220px up, anim=1
      const y = Math.max(0, Math.min(1, -rect.top / 220));
      setCoverAnim(y);
      // Expose to Navigation for logo morph
      if (typeof window !== 'undefined') {
        window.animatedLogoStyle = {
          opacity: 1 - y * 0.7,
          transform: `scale(${1 - y * 0.25})`,
          transition: 'all 0.4s cubic-bezier(.4,1.2,.4,1)',
        };
        window.animatedLogoTextStyle = {
          opacity: 0.3 + y * 0.7,
          transform: `scale(${0.7 + y * 0.3})`,
          transition: 'all 0.4s cubic-bezier(.4,1.2,.4,1)',
        };
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const [stats, setStats] = useState({
    total_modules: 4,
    active_modules: 3,
    total_flow_rate: 60.7,
    uptime_percentage: 95
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiService.get('/api/statistics');
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Keep fallback stats
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Ref to measure the height of the landing page
  const pageRef = React.useRef(null);
  const [height, setHeight] = useState('100vh');
  useEffect(() => {
    if (pageRef.current) {
      setHeight(`${pageRef.current.offsetHeight}px`);
    }
    const handleResize = () => {
      if (pageRef.current) {
        setHeight(`${pageRef.current.offsetHeight}px`);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Animated Section Helper ---
  const sectionRefs = [React.useRef(), React.useRef(), React.useRef()];
  const [sectionProgress, setSectionProgress] = useState([0, 0, 0]);
  // sectionProgress[i]: 0 = fully visible, 1 = minimized, animates as you scroll

  useEffect(() => {
    function onScroll() {
      const newProgress = sectionRefs.map((ref, i) => {
        if (!ref.current) return 1;
        const rect = ref.current.getBoundingClientRect();
        const vh = window.innerHeight;
        // Section is fully visible if its center is in the center of viewport
        const center = rect.top + rect.height / 2;
        // Progress: 0 when center is at 60% of viewport, 1 when at -40% (above)
        const prog = Math.max(0, Math.min(1, (vh * 0.6 - center) / (vh * 0.7)));
        return prog;
      });
      setSectionProgress(newProgress);
      // Animate logo for first section
      if (typeof window !== 'undefined') {
        window.animatedLogoStyle = {
          opacity: 1 - newProgress[0] * 0.7,
          transform: `scale(${1 - newProgress[0] * 0.25})`,
          transition: 'all 0.4s cubic-bezier(.4,1.2,.4,1)',
        };
        window.animatedLogoTextStyle = {
          opacity: 0.3 + newProgress[0] * 0.7,
          transform: `scale(${0.7 + newProgress[0] * 0.3})`,
          transition: 'all 0.4s cubic-bezier(.4,1.2,.4,1)',
        };
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Helper to animate a section
  function AnimatedSection({ children, index, className, style }) {
    const prog = sectionProgress[index] || 0;
    // For the last section, make the animation more pronounced
    const scale = index === 2 ? 1 - prog * 0.28 : 1 - prog * 0.18;
    const opacity = index === 2 ? 1 - prog * 0.85 : 1 - prog * 0.7;
    const boxShadow = index === 2
      ? `0 8px 40px 0 rgba(34,211,238,${0.18 + 0.22 * (1 - prog)}), 0 2px 24px 0 rgba(0,0,0,${0.10 + 0.10 * (1 - prog)}) inset`
      : undefined;
    return (
      <section
        ref={sectionRefs[index]}
        className={className}
        style={{
          opacity,
          transform: `scale(${scale})`,
          transition: 'all 0.5s cubic-bezier(.4,1.2,.4,1)',
          willChange: 'opacity, transform',
          boxShadow,
          ...style,
        }}
      >
        {children}
      </section>
    );
  }

  return (
    <div
      ref={pageRef}
      className="min-h-screen bg-gradient-to-b from-[#18181b] to-[#232326] dark:bg-gradient-to-b dark:from-[#18181b] dark:to-[#232326] relative overflow-x-hidden text-gray-100 font-sans"
      style={{ fontFamily: 'Inter, Poppins, Montserrat, Arial, sans-serif' }}
    >
      <BubbleBackground containerHeight={height} />
      {/* Hero Section */}
      <AnimatedSection
        index={0}
        className="relative bg-gradient-to-r from-cyan-900 via-cyan-800 to-blue-900 dark:from-cyan-900 dark:via-cyan-800 dark:to-blue-900 text-white py-20 shadow-xl"
        style={{
          borderBottomLeftRadius: `${36 - 28 * (sectionProgress[0] || 0)}px`,
          borderBottomRightRadius: `${36 - 28 * (sectionProgress[0] || 0)}px`,
          boxShadow: `0 8px 32px 0 rgba(34,211,238,${0.18 + 0.22 * (1 - (sectionProgress[0] || 0))}), 0 2px 24px 0 rgba(0,0,0,${0.10 + 0.10 * (1 - (sectionProgress[0] || 0))}) inset`,
          transition: 'border-radius 0.5s cubic-bezier(.4,1.2,.4,1), box-shadow 0.5s cubic-bezier(.4,1.2,.4,1)',
        }}
      >
        <div
          className="absolute inset-0 bg-black opacity-30 z-10"
          style={{
            borderBottomLeftRadius: `${36 - 28 * (sectionProgress[0] || 0)}px`,
            borderBottomRightRadius: `${36 - 28 * (sectionProgress[0] || 0)}px`,
            transition: 'border-radius 0.5s cubic-bezier(.4,1.2,.4,1)',
          }}
        ></div>
        <div className="relative max-w-7xl mx-auto px-4 text-center z-20">
          <div className="flex justify-center mb-6">
            <div
              className="relative flex items-center justify-center"
              style={{
                width: `${260 - 80 * (sectionProgress[0] || 0)}px`,
                height: `${260 - 80 * (sectionProgress[0] || 0)}px`,
                background:
                  'radial-gradient(circle at 60% 35%, rgba(255,255,255,0.10) 0%, rgba(34,211,238,0.10) 55%, rgba(34,211,238,0.18) 80%, rgba(34,211,238,0.32) 100%)',
                borderRadius: '50%',
                boxShadow:
                  '0 8px 32px 0 rgba(34,211,238,0.18), 0 2px 24px 0 rgba(0,0,0,0.18) inset',
                border: '2.5px solid rgba(34,211,238,0.12)',
                position: 'relative',
                overflow: 'visible',
                zIndex: 30,
                transition: 'all 0.4s cubic-bezier(.4,1.2,.4,1)',
              }}
            >
              {/* Bubble highlight */}
              <div
                style={{
                  position: 'absolute',
                  top: `${38 - 10 * (sectionProgress[0] || 0)}px`,
                  left: `${60 - 10 * (sectionProgress[0] || 0)}px`,
                  width: `${60 - 18 * (sectionProgress[0] || 0)}px`,
                  height: `${32 - 10 * (sectionProgress[0] || 0)}px`,
                  background:
                    'radial-gradient(circle at 60% 40%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 100%)',
                  borderRadius: '50%',
                  filter: 'blur(1.5px)',
                  opacity: 0.85,
                  pointerEvents: 'none',
                  transition: 'all 0.4s cubic-bezier(.4,1.2,.4,1)',
                }}
              />
              {/* Bubble shadow at bottom */}
              <div
                style={{
                  position: 'absolute',
                  bottom: `${24 - 8 * (sectionProgress[0] || 0)}px`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: `${110 - 30 * (sectionProgress[0] || 0)}px`,
                  height: `${38 - 12 * (sectionProgress[0] || 0)}px`,
                  background:
                    'radial-gradient(circle at 50% 60%, rgba(34,211,238,0.10) 0%, rgba(0,0,0,0.18) 100%)',
                  borderRadius: '50%',
                  filter: 'blur(2.5px)',
                  opacity: 0.7,
                  pointerEvents: 'none',
                  transition: 'all 0.4s cubic-bezier(.4,1.2,.4,1)',
                }}
              />
              {/* Bubble rim shine */}
              <div
                style={{
                  position: 'absolute',
                  top: `${18 - 6 * (sectionProgress[0] || 0)}px`,
                  right: `${38 - 10 * (sectionProgress[0] || 0)}px`,
                  width: `${38 - 12 * (sectionProgress[0] || 0)}px`,
                  height: `${18 - 6 * (sectionProgress[0] || 0)}px`,
                  background:
                    'radial-gradient(circle at 60% 40%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.01) 100%)',
                  borderRadius: '50%',
                  filter: 'blur(1.5px)',
                  opacity: 0.7,
                  pointerEvents: 'none',
                  transition: 'all 0.4s cubic-bezier(.4,1.2,.4,1)',
                }}
              />
              <h1
                className="akira-heading text-5xl md:text-7xl font-extrabold animate-fade-in text-cyan-300 drop-shadow-lg select-none"
                style={{
                  textShadow:
                    '0 2px 16px rgba(34,211,238,0.32), 0 1px 0 #232326',
                  letterSpacing: '0.04em',
                  userSelect: 'none',
                  fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif',
                  transition: 'all 0.4s cubic-bezier(.4,1.2,.4,1)',
                }}
              >
                AQUAVIGIL
              </h1>
            </div>
          </div>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-cyan-200 font-medium" style={{ fontFamily: 'Poppins, Inter, Montserrat, Arial, sans-serif' }}>
            "Ensuring Clean, Efficient, and Accountable Water Distribution"
          </p>
          <p className="text-lg md:text-xl mb-10 max-w-4xl mx-auto opacity-90 text-cyan-100 font-normal" style={{ fontFamily: 'Inter, Poppins, Montserrat, Arial, sans-serif' }}>
            Solar-powered IoT modules monitoring water supply conditions in real-time through advanced sensors including TDS, pH, water level, flow rate, and GPS tracking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/map"
              className="bg-cyan-400 hover:bg-cyan-500 text-white px-8 py-3 rounded-lg font-semibold transition duration-300 transform hover:scale-105 shadow-md"
              style={{ fontFamily: 'Poppins, Inter, Montserrat, Arial, sans-serif' }}
            >
              View Live Map
            </Link>
            <Link
              to="/statistics"
              className="bg-white text-cyan-700 px-8 py-3 rounded-lg font-semibold hover:bg-cyan-50 transition duration-300 border border-cyan-200 shadow-md"
              style={{ fontFamily: 'Poppins, Inter, Montserrat, Arial, sans-serif' }}
            >
              View Statistics
            </Link>
          </div>
        </div>
      </AnimatedSection>

      {/* How It Works Section */}
      <AnimatedSection
        index={1}
        className="py-20 px-4 flex justify-center items-center"
        style={{
          borderRadius: `${36 - 28 * (sectionProgress[1] || 0)}px`,
          transition: 'border-radius 0.5s cubic-bezier(.4,1.2,.4,1)',
        }}
      >
        <div className="relative max-w-5xl w-full mx-auto bg-transparent shadow-2xl border-2 border-cyan-900/60 p-10 flex flex-col items-center"
          style={{
            borderRadius: `${36 - 28 * (sectionProgress[1] || 0)}px`,
            background: 'rgba(35,35,38,0.7)',
            transition: 'border-radius 0.5s cubic-bezier(.4,1.2,.4,1), background 0.5s cubic-bezier(.4,1.2,.4,1)',
          }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: `${36 - 28 * (sectionProgress[1] || 0)}px` }}></div>
          <h2 className="text-4xl font-extrabold text-center text-cyan-200 mb-16 relative z-10" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>How AQUAVIGIL Works</h2>
          <div className="grid md:grid-cols-3 gap-12 relative z-10">
            <div className="text-center">
              <div className="bg-cyan-900/60 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl">🔧</span>
              </div>
              <h3 className="text-2xl font-bold text-cyan-100 mb-4" style={{ fontFamily: 'Poppins, Inter, Montserrat, Arial, sans-serif' }}>IoT Installation</h3>
              <p className="text-cyan-200">Solar-powered IoT modules are installed directly into water pipeline systems</p>
            </div>
            <div className="text-center">
              <div className="bg-cyan-800/60 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-cyan-100 mb-4" style={{ fontFamily: 'Poppins, Inter, Montserrat, Arial, sans-serif' }}>Real-time Monitoring</h3>
              <p className="text-cyan-200">Sensors continuously monitor TDS, pH, water flow, level, and GPS coordinates</p>
            </div>
            <div className="text-center">
              <div className="bg-cyan-700/60 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl">🌐</span>
              </div>
              <h3 className="text-2xl font-bold text-cyan-100 mb-4" style={{ fontFamily: 'Poppins, Inter, Montserrat, Arial, sans-serif' }}>Data Analysis</h3>
              <p className="text-cyan-200">All data is stored and analyzed to ensure water quality and distribution efficiency</p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Quick Stats Preview */}
      <AnimatedSection
        index={2}
        className="py-16 flex justify-center items-center bg-gradient-to-r from-cyan-900 via-cyan-800 to-blue-900 text-white"
      >
        <div className="relative max-w-5xl w-full mx-auto bg-gradient-to-br from-[#232326] via-[#232326] to-cyan-900 rounded-3xl shadow-2xl border-2 border-cyan-900/60 p-10 flex flex-col items-center">
          <div className="absolute inset-0 bg-white opacity-5 rounded-3xl pointer-events-none"></div>
          <h2 className="text-3xl font-extrabold text-center mb-12 text-cyan-200 drop-shadow relative z-10" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>Current Impact</h2>
          <div className="relative z-10 w-full">
            {loading ? (
              <div className="flex justify-center">
                <div className="loading-spinner"></div>
              </div>
            ) : (
              <div className="grid md:grid-cols-4 gap-8 text-center">
                <div className="rounded-2xl bg-cyan-900/60 p-6 shadow-lg card-hover transition-all duration-300">
                  <div className="text-4xl font-extrabold mb-2 text-cyan-300" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>{stats.total_modules}</div>
                  <div className="text-lg text-cyan-100 font-medium">Active Modules</div>
                </div>
                <div className="rounded-2xl bg-cyan-800/60 p-6 shadow-lg card-hover transition-all duration-300">
                  <div className="text-4xl font-extrabold mb-2 text-cyan-300" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>{stats.total_flow_rate}L</div>
                  <div className="text-lg text-cyan-100 font-medium">Water Monitored Daily</div>
                </div>
                <div className="rounded-2xl bg-cyan-700/60 p-6 shadow-lg card-hover transition-all duration-300">
                  <div className="text-4xl font-extrabold mb-2 text-cyan-300" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>{stats.regions_covered || 4}</div>
                  <div className="text-lg text-cyan-100 font-medium">Regions Covered</div>
                </div>
                <div className="rounded-2xl bg-cyan-600/60 p-6 shadow-lg card-hover transition-all duration-300">
                  <div className="text-4xl font-extrabold mb-2 text-cyan-300" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>{Math.round(stats.uptime_percentage)}%</div>
                  <div className="text-lg text-cyan-100 font-medium">Quality Score</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
};

// Map Page Component  
const MapPage = () => {
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const data = await apiService.get('/api/modules');
        setSensorData(data);
      } catch (error) {
        console.error('Failed to fetch map data:', error);
        setError('Failed to load sensor data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchMapData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#18181b] to-[#232326] flex items-center justify-center text-gray-100 font-sans">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-cyan-200">Loading sensor data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#18181b] to-[#232326] flex items-center justify-center text-gray-100 font-sans">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-semibold transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#18181b] to-[#232326] text-gray-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-cyan-200 drop-shadow-lg" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>IoT Module Locations</h1>
        {/* Map container */}
        <div className="bg-[#232326] rounded-3xl shadow-2xl border-2 border-cyan-900/60 overflow-hidden">
          <MapContainer
            center={[28.6139, 77.2090]}
            zoom={10}
            className="h-96 md:h-[600px] w-full z-10"
            style={{ zIndex: 10 }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {sensorData.map((sensor) => (
              <Marker key={sensor.id} position={sensor.coordinates}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-lg" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>{sensor.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{sensor.location}</p>
                    <div className="space-y-1 text-sm">
                      <div>pH: <span className="font-semibold">{sensor.ph}</span></div>
                      <div>TDS: <span className="font-semibold">{sensor.tds} ppm</span></div>
                      <div>Flow: <span className="font-semibold">{sensor.water_flow} L/min</span></div>
                      <div>Level: <span className="font-semibold">{sensor.water_level}%</span></div>
                    </div>
                    <Link
                      to={`/module/${sensor.id}`}
                      className="inline-block mt-3 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded text-sm font-semibold transition"
                    >
                      View Details
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Module Status Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {sensorData.map((sensor) => (
            <Link to={`/module/${sensor.id}`} key={sensor.id}>
              <div className="rounded-2xl bg-cyan-900/60 p-6 shadow-lg card-hover transition-all duration-300 cursor-pointer border border-cyan-800/40">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-cyan-100" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>{sensor.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${sensor.status === 'active' ? 'bg-green-900/60 text-green-200' : 'bg-yellow-900/60 text-yellow-200'}`}>
                    {sensor.status}
                  </span>
                </div>
                <p className="text-cyan-200 text-sm mb-3">{sensor.location}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>pH: <span className="font-semibold">{sensor.ph}</span></div>
                  <div>TDS: <span className="font-semibold">{sensor.tds}</span></div>
                  <div>Flow: <span className="font-semibold">{sensor.water_flow}L</span></div>
                  <div>Level: <span className="font-semibold">{sensor.water_level}%</span></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

// Module Data Page Component
const ModuleDataPage = () => {
  const { id } = useParams();
  const [sensor, setSensor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchModuleData = async () => {
      try {
        const data = await apiService.get(`/api/modules/${id}`);
        setSensor(data);
        
        // Save to history
        const history = JSON.parse(localStorage.getItem('aquavigil-history') || '[]');
        const existingIndex = history.findIndex(item => item.id === data.id);
        
        if (existingIndex >= 0) {
          history.splice(existingIndex, 1);
        }
        
        history.unshift({
          ...data,
          viewedAt: new Date().toISOString()
        });
        
        localStorage.setItem('aquavigil-history', JSON.stringify(history.slice(0, 20)));
      } catch (error) {
        console.error('Failed to fetch module data:', error);
        setError('Failed to load module data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchModuleData();
    
    // Set up real-time updates every 15 seconds for individual module
    const interval = setInterval(fetchModuleData, 15000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#18181b] to-[#232326] flex items-center justify-center text-gray-100 font-sans">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-cyan-200">Loading module data...</p>
        </div>
      </div>
    );
  }

  if (error || !sensor) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#18181b] to-[#232326] flex items-center justify-center text-gray-100 font-sans">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ {error || 'Module not found'}</div>
          <Link to="/map" className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-semibold transition">
            Back to Map
          </Link>
        </div>
      </div>
    );
  }

  const getQualityColor = (value, type) => {
    switch(type) {
      case 'ph':
        if (value >= 6.5 && value <= 8.5) return 'text-green-600';
        return 'text-red-600';
      case 'tds':
        if (value <= 500) return 'text-green-600';
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#18181b] to-[#232326] text-gray-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="rounded-2xl bg-cyan-900/60 shadow-lg p-6 mb-8 border border-cyan-800/40">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-cyan-200 mb-2" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>{sensor.name}</h1>
              <p className="text-cyan-100 mb-2">{sensor.location}</p>
              <p className="text-sm text-cyan-300">
                Last updated: {new Date(sensor.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                sensor.status === 'active'
                  ? 'bg-green-900/60 text-green-200'
                  : 'bg-yellow-900/60 text-yellow-200'
              }`}>
                {sensor.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Sensor Data Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* pH Level */}
          <div className="rounded-2xl bg-cyan-900/60 shadow-lg p-6 card-hover transition-all duration-300 border border-cyan-800/40">
            <h3 className="text-lg font-extrabold text-cyan-200 mb-4">pH Level</h3>
            <div className="flex flex-col items-center">
              <div className="mb-2">
                <span className="text-xs font-semibold text-cyan-200 tracking-wide px-2 py-1 rounded bg-cyan-900/40 shadow-sm" style={{fontFamily:'Poppins, Inter, Montserrat, Arial, sans-serif', letterSpacing:'0.04em'}}>
                  Optimal: 6.5-8.5
                </span>
              </div>
              <GaugeChart
                id="ph-gauge"
                nrOfLevels={30}
                percent={sensor.ph / 14}
                colors={["#EA4228", "#F5CD19", "#5BE12C"]}
                arcWidth={0.3}
                className="w-40 h-20"
                hideText={true}
              />
              <div className={`text-3xl font-extrabold ${getQualityColor(sensor.ph, 'ph')} mt-2`}>
                {sensor.ph}
              </div>
            </div>
          </div>

          {/* TDS Level */}
          <div className="rounded-2xl bg-cyan-800/60 shadow-lg p-6 card-hover transition-all duration-300 border border-cyan-800/40">
            <h3 className="text-lg font-extrabold text-green-200 mb-4">TDS Level</h3>
            <div className="flex flex-col items-center">
              <div className="mb-2">
                <span className="text-xs font-semibold text-green-200 tracking-wide px-2 py-1 rounded bg-cyan-800/40 shadow-sm" style={{fontFamily:'Poppins, Inter, Montserrat, Arial, sans-serif', letterSpacing:'0.04em'}}>
                  Optimal: &lt;500 ppm
                </span>
              </div>
              <GaugeChart
                id="tds-gauge"
                nrOfLevels={30}
                percent={sensor.tds / 1000}
                colors={["#5BE12C", "#F5CD19", "#EA4228"]}
                arcWidth={0.3}
                className="w-40 h-20"
                hideText={true}
              />
              <div className={`text-3xl font-extrabold ${getQualityColor(sensor.tds, 'tds')} mt-2`}>
                {sensor.tds} <span className="text-sm">ppm</span>
              </div>
            </div>
          </div>

          {/* Water Flow Rate */}
          <div className="rounded-2xl bg-cyan-700/60 shadow-lg p-6 card-hover transition-all duration-300 border border-cyan-800/40">
            <h3 className="text-lg font-extrabold text-cyan-200 mb-4">Flow Rate</h3>
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-4">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle cx="64" cy="64" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-cyan-950/40" />
                  <circle cx="64" cy="64" r="50" stroke="currentColor" strokeWidth="8" fill="transparent"
                    strokeDasharray={`${sensor.water_flow * 10} 314`}
                    className="text-cyan-400" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-extrabold text-cyan-200">{sensor.water_flow}</div>
                    <div className="text-xs text-cyan-300">L/min</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Water Level */}
          <div className="rounded-2xl bg-cyan-600/60 shadow-lg p-6 card-hover transition-all duration-300 border border-cyan-800/40">
            <h3 className="text-lg font-extrabold text-cyan-200 mb-4">Water Level</h3>
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-32 bg-cyan-950/40 rounded-lg overflow-hidden">
                <div
                  className="absolute bottom-0 w-full bg-gradient-to-t from-cyan-400 to-cyan-200 transition-all duration-1000"
                  style={{ height: `${sensor.water_level}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-cyan-100 font-extrabold">
                  {sensor.water_level}%
                </div>
              </div>
            </div>
          </div>

          {/* Temperature */}
          <div className="rounded-2xl bg-cyan-900/60 shadow-lg p-6 card-hover transition-all duration-300 border border-cyan-800/40">
            <h3 className="text-lg font-extrabold text-orange-200 mb-4">Temperature</h3>
            <div className="flex flex-col items-center">
              <div className="text-5xl mb-4">🌡️</div>
              <div className="text-3xl font-extrabold text-orange-200">{sensor.temperature}°C</div>
              <div className="text-sm text-cyan-300 mt-1">Current temp</div>
            </div>
          </div>

          {/* GPS Location */}
          <div className="rounded-2xl bg-cyan-800/60 shadow-lg p-6 card-hover transition-all duration-300 border border-cyan-800/40">
            <h3 className="text-lg font-extrabold text-cyan-200 mb-4">GPS Location</h3>
            <div className="flex flex-col items-center">
              <div className="text-4xl mb-4">📍</div>
              <div className="text-center">
                <div className="text-sm font-extrabold text-cyan-100">
                  {sensor.gps.lat.toFixed(4)}, {sensor.gps.lng.toFixed(4)}
                </div>
                <div className="text-xs text-cyan-300 mt-1">{sensor.location}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/map" className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition text-center">
            Back to Map
          </Link>
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition">
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
};

// Statistics Page Component
const StatisticsPage = () => {
  const [sensorData, setSensorData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modulesData, statisticsData] = await Promise.all([
          apiService.get('/api/modules'),
          apiService.get('/api/statistics')
        ]);
        
        setSensorData(modulesData);
        setStats(statisticsData);
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
        setError('Failed to load statistics. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Update every minute for statistics
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#18181b] to-[#232326] flex items-center justify-center text-gray-100 font-sans">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-cyan-200">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats || !sensorData.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#18181b] to-[#232326] flex items-center justify-center text-gray-100 font-sans">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ {error || 'Failed to load statistics'}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-semibold transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: sensorData.map(s => s.name),
    datasets: [
      {
        label: 'pH Levels',
        data: sensorData.map(s => s.ph),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }
    ]
  };

  const flowChartData = {
    labels: sensorData.map(s => s.name),
    datasets: [
      {
        label: 'Water Flow (L/min)',
        data: sensorData.map(s => s.water_flow),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        fill: false
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#18181b] to-[#232326] text-gray-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-cyan-200 drop-shadow-lg" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>System Statistics</h1>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="rounded-2xl bg-cyan-900/60 p-6 shadow-lg card-hover transition-all duration-300 text-center cursor-pointer border border-cyan-800/40">
            <div className="text-4xl font-extrabold text-cyan-300 mb-2" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>{stats.total_modules}</div>
            <div className="text-lg text-cyan-100 font-medium">Total Modules</div>
          </div>
          <div className="rounded-2xl bg-cyan-800/60 p-6 shadow-lg card-hover transition-all duration-300 text-center cursor-pointer border border-cyan-800/40">
            <div className="text-4xl font-extrabold text-green-300 mb-2" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>{stats.active_modules}</div>
            <div className="text-lg text-cyan-100 font-medium">Active Modules</div>
          </div>
          <div className="rounded-2xl bg-cyan-700/60 p-6 shadow-lg card-hover transition-all duration-300 text-center cursor-pointer border border-cyan-800/40">
            <div className="text-4xl font-extrabold text-cyan-300 mb-2" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>{stats.total_flow_rate}L</div>
            <div className="text-lg text-cyan-100 font-medium">Total Flow Rate</div>
          </div>
          <div className="rounded-2xl bg-cyan-600/60 p-6 shadow-lg card-hover transition-all duration-300 text-center cursor-pointer border border-cyan-800/40">
            <div className="text-4xl font-extrabold text-orange-300 mb-2" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>{stats.regions_covered}</div>
            <div className="text-lg text-cyan-100 font-medium">Regions Covered</div>
          </div>
        </div>

        {/* Average Quality Metrics */}
        <div className="rounded-2xl bg-cyan-800/60 shadow-lg p-6 mb-8 card-hover transition-all duration-300 border border-cyan-800/40">
          <h2 className="text-2xl font-extrabold text-cyan-200 mb-6" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>Average Quality Metrics</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center card-hover transition-all duration-300">
              <div className="text-3xl font-extrabold text-cyan-300 mb-2" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>{stats.average_ph}</div>
              <div className="text-lg text-cyan-100 font-medium">Average pH</div>
              <div className="text-sm text-cyan-200">Optimal: 6.5-8.5</div>
            </div>
            <div className="text-center card-hover transition-all duration-300">
              <div className="text-3xl font-extrabold text-green-300 mb-2" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>{stats.average_tds}</div>
              <div className="text-lg text-cyan-100 font-medium">Average TDS (ppm)</div>
              <div className="text-sm text-cyan-200">Optimal: &lt;500</div>
            </div>
            <div className="text-center card-hover transition-all duration-300">
              <div className="text-3xl font-extrabold text-cyan-300 mb-2" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>{stats.average_temperature}°C</div>
              <div className="text-lg text-cyan-100 font-medium">Average Temperature</div>
              <div className="text-sm text-cyan-200">Current status</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* pH Levels Chart */}
          <div className="rounded-2xl bg-cyan-900/60 shadow-lg p-6 card-hover transition-all duration-300 border border-cyan-800/40">
            <h3 className="text-xl font-extrabold text-cyan-200 mb-4" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>pH Levels by Module</h3>
            <Bar data={chartData} options={{
              responsive: true,
              plugins: { legend: { labels: { color: '#e0f2fe', font: { family: 'Montserrat, Poppins, Inter, Arial, sans-serif' } } } },
              scales: {
                y: { beginAtZero: true, max: 14, ticks: { color: '#bae6fd' } },
                x: { ticks: { color: '#bae6fd' } }
              }
            }} />
          </div>

          {/* Flow Rate Chart */}
          <div className="rounded-2xl bg-cyan-900/60 shadow-lg p-6 card-hover transition-all duration-300 border border-cyan-800/40">
            <h3 className="text-xl font-extrabold text-cyan-200 mb-4" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>Water Flow Rates</h3>
            <Line data={flowChartData} options={{
              responsive: true,
              plugins: { legend: { labels: { color: '#e0f2fe', font: { family: 'Montserrat, Poppins, Inter, Arial, sans-serif' } } } },
              scales: {
                y: { beginAtZero: true, ticks: { color: '#bae6fd' } },
                x: { ticks: { color: '#bae6fd' } }
              }
            }} />
          </div>
        </div>

        {/* System Health */}
        <div className="rounded-2xl bg-cyan-800/60 shadow-lg p-6 mt-8 card-hover transition-all duration-300 border border-cyan-800/40">
          <h2 className="text-2xl font-extrabold text-cyan-200 mb-6" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>System Health Overview</h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-extrabold text-green-300 mb-2">{stats.uptime_percentage}%</div>
              <div className="text-lg text-cyan-100 font-medium">Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-cyan-300 mb-2">24/7</div>
              <div className="text-lg text-cyan-100 font-medium">Monitoring</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-orange-300 mb-2">5min</div>
              <div className="text-lg text-cyan-100 font-medium">Update Interval</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-purple-300 mb-2">100%</div>
              <div className="text-lg text-cyan-100 font-medium">Solar Powered</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// History Page Component
const HistoryPage = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('aquavigil-history') || '[]');
    setHistory(savedHistory);
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('aquavigil-history');
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#18181b] to-[#232326] text-gray-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-cyan-200" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>Access History</h1>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              Clear History
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-extrabold text-cyan-200 mb-2">No History Yet</h2>
            <p className="text-cyan-100 mb-6">Visit some module data pages to see them here</p>
            <Link to="/map" className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition">
              Explore Map
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item, index) => (
              <Link to={`/module/${item.id}`} key={`${item.id}-${index}`}>
                <div className="rounded-2xl bg-cyan-900/60 p-6 shadow-lg card-hover transition-all duration-300 cursor-pointer border border-cyan-800/40">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-cyan-100" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>{item.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.status === 'active'
                        ? 'bg-green-900/60 text-green-200'
                        : 'bg-yellow-900/60 text-yellow-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <p className="text-cyan-200 text-sm mb-3">{item.location}</p>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <div>pH: <span className="font-semibold">{item.ph}</span></div>
                    <div>TDS: <span className="font-semibold">{item.tds} ppm</span></div>
                    <div>Flow: <span className="font-semibold">{item.water_flow} L/min</span></div>
                    <div>Level: <span className="font-semibold">{item.water_level}%</span></div>
                  </div>

                  <div className="text-xs text-cyan-300">
                    Viewed: {new Date(item.viewedAt).toLocaleString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Contact Page Component
const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await apiService.post('/api/contact', formData);
      setSubmitMessage('Thank you for your message! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Contact form submission failed:', error);
      setSubmitMessage('Sorry, there was an error sending your message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#18181b] to-[#232326] text-gray-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-cyan-200 drop-shadow-lg" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>Contact Us</h1>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Team Information */}
          <div>
            <h2 className="text-2xl font-extrabold text-cyan-200 mb-6" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>Development Team</h2>

            <div className="grid gap-6">
              {/* Sampreeth */}
            <div className="rounded-2xl bg-cyan-900/60 p-7 flex flex-col gap-2 border-l-4 border-cyan-400 shadow-lg card-hover transition-all duration-300">
              <h3 className="text-2xl font-extrabold text-cyan-200 mb-1 tracking-tight" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>N. Sampreeth Chowdary</h3>
              <p className="text-base text-cyan-100 font-medium mb-1">Project Lead, Full-Stack Developer &amp; IoT Engineer</p>
              <p className="text-sm text-cyan-300 mb-2">Specializes in IoT systems and sensor integration for water monitoring solutions.</p>
              <a href="mailto:nschowdary1234@gmail.com" className="text-cyan-300 hover:underline text-sm font-semibold">nschowdary1234@gmail.com</a>
            </div>
            <div className="rounded-2xl bg-cyan-800/60 p-7 flex flex-col gap-2 border-l-4 border-green-400 shadow-lg card-hover transition-all duration-300">
              <h3 className="text-2xl font-extrabold text-green-200 mb-1 tracking-tight" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>G. Gowtham Chowdary</h3>
              <p className="text-base text-cyan-100 font-medium mb-1">Full-Stack Developer &amp; IoT Engineer</p>
              <p className="text-sm text-cyan-300 mb-2">Develops web applications and data visualization systems for real-time monitoring.</p>
              <a href="mailto:garapatigowtham6@gmail.com" className="text-green-200 hover:underline text-sm font-semibold">garapatigowtham6@gmail.com</a>
            </div>
            <div className="rounded-2xl bg-cyan-700/60 p-7 flex flex-col gap-2 border-l-4 border-purple-400 shadow-lg card-hover transition-all duration-300">
              <h3 className="text-2xl font-extrabold text-purple-200 mb-1 tracking-tight" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>P. Sai Advaith</h3>
              <p className="text-base text-cyan-100 font-medium mb-1">Data Scientist &amp; Analytics Expert</p>
              <p className="text-sm text-cyan-300 mb-2">Focuses on water quality analysis and predictive modeling for distribution systems.</p>
              <a href="mailto:advaithparimisetti@gmail.com" className="text-purple-200 hover:underline text-sm font-semibold">advaithparimisetti@gmail.com</a>
            </div>
            <div className="rounded-2xl bg-cyan-600/60 p-7 flex flex-col gap-2 border-l-4 border-pink-400 shadow-lg card-hover transition-all duration-300">
              <h3 className="text-2xl font-extrabold text-pink-200 mb-1 tracking-tight" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>K. Sai Lalith</h3>
              <p className="text-base text-cyan-100 font-medium mb-1">Cloud Solutions Architect</p>
              <p className="text-sm text-cyan-300 mb-2">Focuses on water quality analysis and predictive modeling for distribution systems.</p>
              <a href="mailto:mrsailalith@gmail.com" className="text-pink-200 hover:underline text-sm font-semibold">mrsailalith@gmail.com</a>
            </div>
            <div className="rounded-2xl bg-cyan-900/60 p-7 flex flex-col gap-2 border-l-4 border-blue-400 shadow-lg card-hover transition-all duration-300">
              <h3 className="text-2xl font-extrabold text-blue-200 mb-1 tracking-tight" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>Venkata Ruthvik Mundlamudi</h3>
              <p className="text-base text-cyan-100 font-medium mb-1">QA/Test Engineer</p>
              <p className="text-sm text-cyan-300 mb-2">Focuses on water quality analysis and predictive modeling for distribution systems.</p>
              <a href="mailto:m.v.ruthvik123@gmail.com" className="text-blue-200 hover:underline text-sm font-semibold">m.v.ruthvik123@gmail.com</a>
            </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-extrabold text-cyan-200 mb-6" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>Get in Touch</h2>
            
            <div
              className="rounded-2xl bg-[#10181b]/80 shadow-lg p-6 card-hover transition-all duration-300 border border-cyan-400/60 relative"
              style={{
                boxShadow:
                  '0 0 32px 4px rgba(34,211,238,0.35), 0 0 0 2px #22d3ee, 0 8px 32px 0 rgba(34,211,238,0.18)',
                border: '1.5px solid #22d3ee',
                background: 'rgba(16,24,27,0.92)',
              }}
            >
              {submitMessage && (
                <div className={`p-4 rounded-lg mb-6 ${
                  submitMessage.includes('error') || submitMessage.includes('Sorry')
                    ? 'bg-red-900/60 text-red-200 border border-red-400'
                    : 'bg-green-900/60 text-green-200 border border-green-400'
                }`}>
                  {submitMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-cyan-100 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 border border-cyan-700 rounded-lg focus:ring-cyan-400 focus:border-cyan-400 disabled:bg-cyan-950/40 bg-cyan-950/40 text-cyan-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-100 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 border border-cyan-700 rounded-lg focus:ring-cyan-400 focus:border-cyan-400 disabled:bg-cyan-950/40 bg-cyan-950/40 text-cyan-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-100 mb-2">
                    Subject
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 border border-cyan-700 rounded-lg focus:ring-cyan-400 focus:border-cyan-400 disabled:bg-cyan-950/40 bg-cyan-950/40 text-cyan-100"
                  >
                    <option value="">Select a subject</option>
                    <option value="demo">Request Demo</option>
                    <option value="partnership">Partnership Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="general">General Question</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-100 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    rows="6"
                    className="w-full px-4 py-2 border border-cyan-700 rounded-lg focus:ring-cyan-400 focus:border-cyan-400 disabled:bg-cyan-950/40 bg-cyan-950/40 text-cyan-100"
                    placeholder="Tell us about your water monitoring needs or questions..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300 disabled:bg-cyan-900/60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <div className="loading-spinner mr-2"></div>
                      Sending...
                    </span>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            </div>

            {/* Additional Contact Information */}
            <div className="mt-8 bg-gradient-to-r from-cyan-900 to-cyan-700 text-cyan-100 rounded-lg p-6">
              <h3 className="text-lg font-extrabold mb-4" style={{ fontFamily: 'Montserrat, Poppins, Inter, Arial, sans-serif' }}>Project Information</h3>
              <div className="space-y-2 text-sm">
                <div>📧 General: info@aquavigil.com</div>
                <div>🔧 Technical Support: aquavigil@gmail.com</div>
                <div>🤝 Partnerships: aquavigil@gmail.com</div>
                <div>📱 Emergency: +91 9988994648</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  // Remove redundant scroll-to-top on mount; handled by ScrollToTop for all loads
  return (
    <Router>
      <ScrollToTop />
      <div className="App min-h-screen bg-[#f4f4f8] dark:bg-[#18181b] text-gray-900 dark:text-gray-100" style={{ fontFamily: 'Roboto, Arial, sans-serif' }}>
        <Navigation />
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/module/:id" element={<ModuleDataPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

// Tailwind CSS keyframes for bubble animation (add to App.css):
// @keyframes bubble {
//   0% { transform: translateY(0) scale(1); opacity: 0.2; }
//   10% { opacity: 0.4; }
//   80% { opacity: 0.4; }
//   100% { transform: translateY(-90vh) scale(1.08); opacity: 0; }
// }
// .animate-bubble {
//   animation: bubble linear infinite;
// }