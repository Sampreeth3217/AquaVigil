import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import GaugeChart from 'react-gauge-chart';
import 'leaflet/dist/leaflet.css';
import './App.css';

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

// Mock Firebase data based on the user's Firebase structure
const mockFirebaseData = {
  sensors1: {
    id: 'sensors1',
    name: 'Pipeline Module A1',
    location: 'Rural District North',
    coordinates: [28.6139, 77.2090], // Delhi
    ph: 7.2,
    tds: 350,
    water_flow: 15.5,
    water_level: 85,
    temperature: 24.5,
    gps: { lat: 28.6139, lng: 77.2090 },
    timestamp: new Date().toISOString(),
    status: 'active'
  },
  sensors2: {
    id: 'sensors2', 
    name: 'Pipeline Module B2',
    location: 'Rural District East',
    coordinates: [28.5355, 77.3910], // Noida
    ph: 6.8,
    tds: 425,
    water_flow: 12.3,
    water_level: 78,
    temperature: 26.1,
    gps: { lat: 28.5355, lng: 77.3910 },
    timestamp: new Date().toISOString(),
    status: 'active'
  },
  sensors3: {
    id: 'sensors3',
    name: 'Pipeline Module C3', 
    location: 'Rural District West',
    coordinates: [28.4595, 77.0266], // Gurgaon
    ph: 7.5,
    tds: 280,
    water_flow: 18.7,
    water_level: 92,
    temperature: 23.8,
    gps: { lat: 28.4595, lng: 77.0266 },
    timestamp: new Date().toISOString(),
    status: 'active'
  },
  sensors4: {
    id: 'sensors4',
    name: 'Pipeline Module D4',
    location: 'Rural District South', 
    coordinates: [28.4817, 77.1873], // South Delhi
    ph: 6.9,
    tds: 390,
    water_flow: 14.2,
    water_level: 67,
    temperature: 25.3,
    gps: { lat: 28.4817, lng: 77.1873 },
    timestamp: new Date().toISOString(),
    status: 'maintenance'
  }
};

// Navigation Component
const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-blue-900 to-cyan-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-white text-2xl font-bold">
            🌊 AquaVIGIL
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            <Link to="/" className="text-white hover:text-cyan-200 transition duration-300">Home</Link>
            <Link to="/map" className="text-white hover:text-cyan-200 transition duration-300">Map</Link>
            <Link to="/statistics" className="text-white hover:text-cyan-200 transition duration-300">Statistics</Link>
            <Link to="/history" className="text-white hover:text-cyan-200 transition duration-300">History</Link>
            <Link to="/contact" className="text-white hover:text-cyan-200 transition duration-300">Contact</Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <Link to="/" className="block text-white py-2 hover:text-cyan-200">Home</Link>
            <Link to="/map" className="block text-white py-2 hover:text-cyan-200">Map</Link>
            <Link to="/statistics" className="block text-white py-2 hover:text-cyan-200">Statistics</Link>
            <Link to="/history" className="block text-white py-2 hover:text-cyan-200">History</Link>
            <Link to="/contact" className="block text-white py-2 hover:text-cyan-200">Contact</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

// Homepage Component
const Homepage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-900 to-cyan-700 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            AquaVIGIL
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            "Ensuring Clean, Efficient, and Accountable Water Distribution"
          </p>
          <p className="text-lg md:text-xl mb-10 max-w-4xl mx-auto opacity-90">
            Solar-powered IoT modules monitoring water supply conditions in real-time through advanced sensors including TDS, pH, water level, flow rate, and GPS tracking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/map" className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 rounded-lg font-semibold transition duration-300 transform hover:scale-105">
              View Live Map
            </Link>
            <Link to="/statistics" className="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-300">
              View Statistics
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-16">How AquaVIGIL Works</h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🔧</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">IoT Installation</h3>
              <p className="text-gray-600">Solar-powered IoT modules are installed directly into water pipeline systems</p>
            </div>
            
            <div className="text-center">
              <div className="bg-cyan-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Real-time Monitoring</h3>
              <p className="text-gray-600">Sensors continuously monitor TDS, pH, water flow, level, and GPS coordinates</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🌐</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Data Analysis</h3>
              <p className="text-gray-600">All data is stored and analyzed to ensure water quality and distribution efficiency</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Preview */}
      <section className="bg-gradient-to-r from-blue-900 to-cyan-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Current Impact</h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">4</div>
              <div className="text-lg">Active Modules</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2,450L</div>
              <div className="text-lg">Water Monitored Daily</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4</div>
              <div className="text-lg">Regions Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-lg">Quality Score</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Map Page Component  
const MapPage = () => {
  const sensorData = Object.values(mockFirebaseData);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">IoT Module Locations</h1>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <MapContainer 
            center={[28.6139, 77.2090]} 
            zoom={10} 
            className="h-96 md:h-[600px] w-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {sensorData.map((sensor) => (
              <Marker key={sensor.id} position={sensor.coordinates}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-lg">{sensor.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{sensor.location}</p>
                    <div className="space-y-1 text-sm">
                      <div>pH: <span className="font-semibold">{sensor.ph}</span></div>
                      <div>TDS: <span className="font-semibold">{sensor.tds} ppm</span></div>
                      <div>Flow: <span className="font-semibold">{sensor.water_flow} L/min</span></div>
                      <div>Level: <span className="font-semibold">{sensor.water_level}%</span></div>
                    </div>
                    <Link 
                      to={`/module/${sensor.id}`}
                      className="inline-block mt-3 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
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
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300 cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-gray-800">{sensor.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${sensor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {sensor.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{sensor.location}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>pH: {sensor.ph}</div>
                  <div>TDS: {sensor.tds}</div>
                  <div>Flow: {sensor.water_flow}L</div>
                  <div>Level: {sensor.water_level}%</div>
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
  const sensor = mockFirebaseData[id];

  if (!sensor) {
    return <div className="min-h-screen flex items-center justify-center">Module not found</div>;
  }

  // Save to history
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('aquavigil-history') || '[]');
    const existingIndex = history.findIndex(item => item.id === sensor.id);
    
    if (existingIndex >= 0) {
      history.splice(existingIndex, 1);
    }
    
    history.unshift({
      ...sensor,
      viewedAt: new Date().toISOString()
    });
    
    localStorage.setItem('aquavigil-history', JSON.stringify(history.slice(0, 20)));
  }, [sensor]);

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{sensor.name}</h1>
              <p className="text-gray-600 mb-2">{sensor.location}</p>
              <p className="text-sm text-gray-500">
                Last updated: {new Date(sensor.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                sensor.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {sensor.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Sensor Data Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* pH Level */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">pH Level</h3>
            <div className="flex flex-col items-center">
              <GaugeChart 
                id="ph-gauge"
                nrOfLevels={30}
                percent={sensor.ph / 14}
                colors={["#EA4228", "#F5CD19", "#5BE12C"]}
                arcWidth={0.3}
                className="w-40 h-20"
              />
              <div className={`text-3xl font-bold ${getQualityColor(sensor.ph, 'ph')} mt-2`}>
                {sensor.ph}
              </div>
              <div className="text-sm text-gray-500">Optimal: 6.5-8.5</div>
            </div>
          </div>

          {/* TDS Level */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">TDS Level</h3>
            <div className="flex flex-col items-center">
              <GaugeChart 
                id="tds-gauge"
                nrOfLevels={30}
                percent={sensor.tds / 1000}
                colors={["#5BE12C", "#F5CD19", "#EA4228"]}
                arcWidth={0.3}
                className="w-40 h-20"
              />
              <div className={`text-3xl font-bold ${getQualityColor(sensor.tds, 'tds')} mt-2`}>
                {sensor.tds} <span className="text-sm">ppm</span>
              </div>
              <div className="text-sm text-gray-500">Optimal: &lt;500 ppm</div>
            </div>
          </div>

          {/* Water Flow Rate */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Flow Rate</h3>
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-4">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle cx="64" cy="64" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200"/>
                  <circle cx="64" cy="64" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" 
                    strokeDasharray={`${sensor.water_flow * 10} 314`}
                    className="text-blue-500" strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{sensor.water_flow}</div>
                    <div className="text-xs text-gray-500">L/min</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Water Level */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Water Level</h3>
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-32 bg-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-cyan-400 transition-all duration-1000"
                  style={{ height: `${sensor.water_level}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
                  {sensor.water_level}%
                </div>
              </div>
            </div>
          </div>

          {/* Temperature */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Temperature</h3>
            <div className="flex flex-col items-center">
              <div className="text-5xl mb-4">🌡️</div>
              <div className="text-3xl font-bold text-orange-600">{sensor.temperature}°C</div>
              <div className="text-sm text-gray-500 mt-1">Current temp</div>
            </div>
          </div>

          {/* GPS Location */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">GPS Location</h3>
            <div className="flex flex-col items-center">
              <div className="text-4xl mb-4">📍</div>
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-700">
                  {sensor.gps.lat.toFixed(4)}, {sensor.gps.lng.toFixed(4)}
                </div>
                <div className="text-xs text-gray-500 mt-1">{sensor.location}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/map" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-center">
            Back to Map
          </Link>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition">
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
};

// Statistics Page Component
const StatisticsPage = () => {
  const sensorData = Object.values(mockFirebaseData);
  
  const avgPh = (sensorData.reduce((sum, s) => sum + s.ph, 0) / sensorData.length).toFixed(1);
  const avgTds = Math.round(sensorData.reduce((sum, s) => sum + s.tds, 0) / sensorData.length);
  const totalFlow = sensorData.reduce((sum, s) => sum + s.water_flow, 0).toFixed(1);
  const activeModules = sensorData.filter(s => s.status === 'active').length;

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">System Statistics</h1>
        
        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{sensorData.length}</div>
            <div className="text-gray-600">Total Modules</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">{activeModules}</div>
            <div className="text-gray-600">Active Modules</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-cyan-600 mb-2">{totalFlow}L</div>
            <div className="text-gray-600">Total Flow Rate</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">4</div>
            <div className="text-gray-600">Regions Covered</div>
          </div>
        </div>

        {/* Average Quality Metrics */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Average Quality Metrics</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{avgPh}</div>
              <div className="text-gray-600">Average pH</div>
              <div className="text-sm text-gray-500">Optimal: 6.5-8.5</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{avgTds}</div>
              <div className="text-gray-600">Average TDS (ppm)</div>
              <div className="text-sm text-gray-500">Optimal: &lt;500</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600 mb-2">
                {Math.round((sensorData.reduce((sum, s) => sum + s.water_level, 0) / sensorData.length))}%
              </div>
              <div className="text-gray-600">Average Level</div>
              <div className="text-sm text-gray-500">Current status</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* pH Levels Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">pH Levels by Module</h3>
            <Bar data={chartData} options={{
              responsive: true,
              scales: {
                y: { beginAtZero: true, max: 14 }
              }
            }} />
          </div>

          {/* Flow Rate Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Water Flow Rates</h3>
            <Line data={flowChartData} options={{
              responsive: true,
              scales: {
                y: { beginAtZero: true }
              }
            }} />
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">System Health Overview</h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600 mb-2">98%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">Monitoring</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600 mb-2">5min</div>
              <div className="text-gray-600">Update Interval</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 mb-2">100%</div>
              <div className="text-gray-600">Solar Powered</div>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Access History</h1>
          {history.length > 0 && (
            <button 
              onClick={clearHistory}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Clear History
            </button>
          )}
        </div>
        
        {history.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-600 mb-2">No History Yet</h2>
            <p className="text-gray-500 mb-6">Visit some module data pages to see them here</p>
            <Link to="/map" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
              Explore Map
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item, index) => (
              <Link to={`/module/${item.id}`} key={`${item.id}-${index}`}>
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300 cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">{item.location}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <div>pH: <span className="font-semibold">{item.ph}</span></div>
                    <div>TDS: <span className="font-semibold">{item.tds} ppm</span></div>
                    <div>Flow: <span className="font-semibold">{item.water_flow} L/min</span></div>
                    <div>Level: <span className="font-semibold">{item.water_level}%</span></div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
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

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Contact Us</h1>
        
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Team Information */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Development Team</h2>
            
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-blue-600 mb-2">Dr. Sarah Chen</h3>
                <p className="text-gray-600 mb-2">Project Lead & IoT Engineer</p>
                <p className="text-sm text-gray-500 mb-3">Specializes in IoT systems and sensor integration for water monitoring solutions.</p>
                <a href="mailto:sarah.chen@aquavigil.com" className="text-blue-600 hover:underline">
                  sarah.chen@aquavigil.com
                </a>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-green-600 mb-2">Mark Rodriguez</h3>
                <p className="text-gray-600 mb-2">Full-Stack Developer</p>
                <p className="text-sm text-gray-500 mb-3">Develops web applications and data visualization systems for real-time monitoring.</p>
                <a href="mailto:mark.rodriguez@aquavigil.com" className="text-blue-600 hover:underline">
                  mark.rodriguez@aquavigil.com
                </a>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-purple-600 mb-2">Priya Patel</h3>
                <p className="text-gray-600 mb-2">Data Scientist & Analytics Expert</p>
                <p className="text-sm text-gray-500 mb-3">Focuses on water quality analysis and predictive modeling for distribution systems.</p>
                <a href="mailto:priya.patel@aquavigil.com" className="text-blue-600 hover:underline">
                  priya.patel@aquavigil.com
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Get in Touch</h2>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a subject</option>
                    <option value="demo">Request Demo</option>
                    <option value="partnership">Partnership Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="general">General Question</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tell us about your water monitoring needs or questions..."
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Additional Contact Information */}
            <div className="mt-8 bg-gradient-to-r from-blue-900 to-cyan-700 text-white rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Project Information</h3>
              <div className="space-y-2 text-sm">
                <div>📧 General: info@aquavigil.com</div>
                <div>🔧 Technical Support: support@aquavigil.com</div>
                <div>🤝 Partnerships: partners@aquavigil.com</div>
                <div>📱 Emergency: +1 (555) 123-AQUA</div>
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
  return (
    <Router>
      <div className="App">
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