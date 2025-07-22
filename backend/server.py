from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from datetime import datetime, timedelta
import json
import uuid

# Initialize FastAPI app
app = FastAPI(title="AquaVIGIL API", description="Water Monitoring System API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock Firebase data structure based on user's screenshot
mock_firebase_data = {
    "sensors1": {
        "id": "sensors1",
        "name": "Pipeline Module A1",
        "location": "Rural District North",
        "coordinates": [28.6139, 77.2090],  # Delhi
        "ph": 7.2,
        "tds": 350,
        "water_flow": 15.5,
        "water_level": 85,
        "temperature": 24.5,
        "gps": {"lat": 28.6139, "lng": 77.2090},
        "timestamp": "2025-01-27T10:30:00Z",
        "status": "active",
        "installation_date": "2024-12-01",
        "last_maintenance": "2025-01-15"
    },
    "sensors2": {
        "id": "sensors2",
        "name": "Pipeline Module B2",
        "location": "Rural District East",
        "coordinates": [28.5355, 77.3910],  # Noida
        "ph": 6.8,
        "tds": 425,
        "water_flow": 12.3,
        "water_level": 78,
        "temperature": 26.1,
        "gps": {"lat": 28.5355, "lng": 77.3910},
        "timestamp": "2025-01-27T10:30:00Z",
        "status": "active",
        "installation_date": "2024-11-15",
        "last_maintenance": "2025-01-10"
    },
    "sensors3": {
        "id": "sensors3",
        "name": "Pipeline Module C3",
        "location": "Rural District West",
        "coordinates": [28.4595, 77.0266],  # Gurgaon
        "ph": 7.5,
        "tds": 280,
        "water_flow": 18.7,
        "water_level": 92,
        "temperature": 23.8,
        "gps": {"lat": 28.4595, "lng": 77.0266},
        "timestamp": "2025-01-27T10:30:00Z",
        "status": "active",
        "installation_date": "2024-10-20",
        "last_maintenance": "2025-01-08"
    },
    "sensors4": {
        "id": "sensors4",
        "name": "Pipeline Module D4",
        "location": "Rural District South",
        "coordinates": [28.4817, 77.1873],  # South Delhi
        "ph": 6.9,
        "tds": 390,
        "water_flow": 14.2,
        "water_level": 67,
        "temperature": 25.3,
        "gps": {"lat": 28.4817, "lng": 77.1873},
        "timestamp": "2025-01-27T10:30:00Z",
        "status": "maintenance",
        "installation_date": "2024-09-10",
        "last_maintenance": "2025-01-20"
    }
}

# Pydantic models
class SensorReading(BaseModel):
    ph: float
    tds: int
    water_flow: float
    water_level: int
    temperature: float
    timestamp: str

class SensorModule(BaseModel):
    id: str
    name: str
    location: str
    coordinates: List[float]
    ph: float
    tds: int
    water_flow: float
    water_level: int
    temperature: float
    gps: Dict[str, float]
    timestamp: str
    status: str
    installation_date: Optional[str] = None
    last_maintenance: Optional[str] = None

class ContactMessage(BaseModel):
    name: str
    email: str
    subject: Optional[str] = ""
    message: str

class SystemStats(BaseModel):
    total_modules: int
    active_modules: int
    maintenance_modules: int
    total_flow_rate: float
    average_ph: float
    average_tds: int
    average_temperature: float
    regions_covered: int
    uptime_percentage: float

# Utility function to simulate real-time data updates
def update_sensor_data(sensor_id: str) -> Dict[str, Any]:
    """Simulate slight variations in sensor readings for real-time effect"""
    import random
    
    base_data = mock_firebase_data.get(sensor_id)
    if not base_data:
        return None
    
    # Add small random variations to simulate real-time changes
    updated_data = base_data.copy()
    updated_data.update({
        "ph": round(base_data["ph"] + random.uniform(-0.1, 0.1), 1),
        "tds": base_data["tds"] + random.randint(-5, 5),
        "water_flow": round(base_data["water_flow"] + random.uniform(-0.5, 0.5), 1),
        "water_level": base_data["water_level"] + random.randint(-2, 2),
        "temperature": round(base_data["temperature"] + random.uniform(-0.2, 0.2), 1),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })
    
    # Ensure realistic bounds
    updated_data["ph"] = max(6.0, min(8.5, updated_data["ph"]))
    updated_data["tds"] = max(200, min(600, updated_data["tds"]))
    updated_data["water_flow"] = max(0, updated_data["water_flow"])
    updated_data["water_level"] = max(0, min(100, updated_data["water_level"]))
    updated_data["temperature"] = max(15, min(35, updated_data["temperature"]))
    
    return updated_data

# API Routes

@app.get("/")
async def root():
    return {"message": "AquaVIGIL API - Water Monitoring System", "version": "1.0.0", "status": "active"}

@app.get("/api/modules", response_model=List[SensorModule])
async def get_all_modules():
    """Get all sensor modules data"""
    try:
        modules = []
        for sensor_id in mock_firebase_data.keys():
            updated_data = update_sensor_data(sensor_id)
            if updated_data:
                modules.append(SensorModule(**updated_data))
        return modules
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching modules: {str(e)}")

@app.get("/api/modules/{module_id}", response_model=SensorModule)
async def get_module_data(module_id: str):
    """Get specific sensor module data with real-time updates"""
    try:
        updated_data = update_sensor_data(module_id)
        if not updated_data:
            raise HTTPException(status_code=404, detail=f"Module {module_id} not found")
        
        return SensorModule(**updated_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching module data: {str(e)}")

@app.get("/api/modules/{module_id}/history")
async def get_module_history(module_id: str, hours: int = 24):
    """Get historical data for a specific module (simulated)"""
    try:
        if module_id not in mock_firebase_data:
            raise HTTPException(status_code=404, detail=f"Module {module_id} not found")
        
        # Simulate historical data points
        import random
        base_data = mock_firebase_data[module_id]
        history = []
        
        for i in range(hours):
            timestamp = datetime.utcnow() - timedelta(hours=i)
            history_point = {
                "timestamp": timestamp.isoformat() + "Z",
                "ph": round(base_data["ph"] + random.uniform(-0.3, 0.3), 1),
                "tds": base_data["tds"] + random.randint(-10, 10),
                "water_flow": round(base_data["water_flow"] + random.uniform(-1.0, 1.0), 1),
                "water_level": base_data["water_level"] + random.randint(-5, 5),
                "temperature": round(base_data["temperature"] + random.uniform(-0.5, 0.5), 1)
            }
            
            # Ensure bounds
            history_point["ph"] = max(6.0, min(8.5, history_point["ph"]))
            history_point["tds"] = max(200, min(600, history_point["tds"]))
            history_point["water_flow"] = max(0, history_point["water_flow"])
            history_point["water_level"] = max(0, min(100, history_point["water_level"]))
            history_point["temperature"] = max(15, min(35, history_point["temperature"]))
            
            history.append(history_point)
        
        return {"module_id": module_id, "history": list(reversed(history))}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")

@app.get("/api/statistics", response_model=SystemStats)
async def get_system_statistics():
    """Get overall system statistics"""
    try:
        modules = list(mock_firebase_data.values())
        active_modules = [m for m in modules if m["status"] == "active"]
        maintenance_modules = [m for m in modules if m["status"] == "maintenance"]
        
        total_flow = sum(m["water_flow"] for m in modules)
        avg_ph = sum(m["ph"] for m in modules) / len(modules)
        avg_tds = sum(m["tds"] for m in modules) // len(modules)
        avg_temp = sum(m["temperature"] for m in modules) / len(modules)
        
        stats = SystemStats(
            total_modules=len(modules),
            active_modules=len(active_modules),
            maintenance_modules=len(maintenance_modules),
            total_flow_rate=round(total_flow, 1),
            average_ph=round(avg_ph, 1),
            average_tds=avg_tds,
            average_temperature=round(avg_temp, 1),
            regions_covered=4,  # Based on our mock data
            uptime_percentage=98.5
        )
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating statistics: {str(e)}")

@app.get("/api/map-data")
async def get_map_data():
    """Get all modules data formatted for map display"""
    try:
        map_data = []
        for sensor_id in mock_firebase_data.keys():
            updated_data = update_sensor_data(sensor_id)
            if updated_data:
                map_point = {
                    "id": updated_data["id"],
                    "name": updated_data["name"],
                    "location": updated_data["location"],
                    "coordinates": updated_data["coordinates"],
                    "status": updated_data["status"],
                    "ph": updated_data["ph"],
                    "tds": updated_data["tds"],
                    "water_flow": updated_data["water_flow"],
                    "water_level": updated_data["water_level"]
                }
                map_data.append(map_point)
        
        return {"modules": map_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching map data: {str(e)}")

@app.post("/api/contact")
async def submit_contact_message(message: ContactMessage):
    """Handle contact form submissions"""
    try:
        # In a real implementation, this would save to database or send email
        print(f"New contact message from {message.name} ({message.email})")
        print(f"Subject: {message.subject}")
        print(f"Message: {message.message}")
        
        # Simulate processing
        response = {
            "id": str(uuid.uuid4()),
            "status": "received",
            "message": "Thank you for your message! We will get back to you soon.",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        return JSONResponse(content=response, status_code=201)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing contact message: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "1.0.0",
        "modules_count": len(mock_firebase_data),
        "active_modules": len([m for m in mock_firebase_data.values() if m["status"] == "active"])
    }

@app.get("/api/alerts")
async def get_system_alerts():
    """Get current system alerts based on sensor thresholds"""
    try:
        alerts = []
        
        for sensor_id, data in mock_firebase_data.items():
            # Check pH levels (optimal range: 6.5-8.5)
            if data["ph"] < 6.5 or data["ph"] > 8.5:
                alerts.append({
                    "id": f"ph-{sensor_id}",
                    "module_id": sensor_id,
                    "module_name": data["name"],
                    "type": "pH Alert",
                    "severity": "warning" if 6.0 <= data["ph"] <= 9.0 else "critical",
                    "message": f"pH level {data['ph']} is outside optimal range (6.5-8.5)",
                    "timestamp": data["timestamp"]
                })
            
            # Check TDS levels (optimal: <500 ppm)
            if data["tds"] > 500:
                alerts.append({
                    "id": f"tds-{sensor_id}",
                    "module_id": sensor_id,
                    "module_name": data["name"],
                    "type": "TDS Alert",
                    "severity": "warning" if data["tds"] <= 600 else "critical",
                    "message": f"TDS level {data['tds']} ppm exceeds recommended limit (500 ppm)",
                    "timestamp": data["timestamp"]
                })
            
            # Check water level (critical if <30%)
            if data["water_level"] < 30:
                alerts.append({
                    "id": f"level-{sensor_id}",
                    "module_id": sensor_id,
                    "module_name": data["name"],
                    "type": "Water Level Alert",
                    "severity": "critical",
                    "message": f"Low water level: {data['water_level']}%",
                    "timestamp": data["timestamp"]
                })
            
            # Check module status
            if data["status"] == "maintenance":
                alerts.append({
                    "id": f"status-{sensor_id}",
                    "module_id": sensor_id,
                    "module_name": data["name"],
                    "type": "Maintenance Required",
                    "severity": "info",
                    "message": f"Module is currently under maintenance",
                    "timestamp": data["timestamp"]
                })
        
        return {"alerts": alerts, "count": len(alerts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alerts: {str(e)}")

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found", "status_code": 404}
    )

@app.exception_handler(500)
async def internal_server_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "status_code": 500}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)