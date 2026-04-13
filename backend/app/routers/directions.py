import os
import requests
from fastapi import APIRouter
from ..utils_fare import calculate_transit_fare

router = APIRouter(prefix="/api", tags=["Directions"])

@router.get("/routes")
def get_routes(
    origin: str, 
    destination: str, 
    mode: str = "transit", 
    gas_price: float = 60.0, 
    fuel_efficiency: float = 10.0,
    passenger_type: str = "regular"
):
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    gmaps_mode = "driving" if mode == "driving" else "transit"
    
    url = f"https://maps.googleapis.com/maps/api/directions/json?origin={origin}&destination={destination}&mode={gmaps_mode}&alternatives=true&key={api_key}"
    
    response = requests.get(url)
    data = response.json()
    
    if data.get("status") != "OK":
        return {"error": "Could not fetch routes"}
    
    parsed_routes = []
    
    for i, route in enumerate(data.get("routes", [])):
        leg = route["legs"][0]
        steps = []
        transit_lines = []
        
        total_distance_km = leg.get("distance", {}).get("value", 0) / 1000
        total_duration_mins = leg.get("duration", {}).get("value", 0) / 60
        
        grand_total_fare = 0.0
        transfer_count = 0
        
        for step in leg.get("steps", []):
            travel_mode = step.get("travel_mode")
            step_dist_km = step.get("distance", {}).get("value", 0) / 1000
            
            step_data = {
                "type": travel_mode,
                "distance_km": round(step_dist_km, 2),
                "duration_mins": round(step.get("duration", {}).get("value", 0) / 60, 2),
                "instructions": step.get("html_instructions", ""),
                "geometry": step.get("polyline", {}).get("points", "")
            }
            
            if travel_mode == "TRANSIT":
                transfer_count += 1
                details = step.get("transit_details", {})
                vehicle_info = details.get("line", {}).get("vehicle", {})
                v_type = vehicle_info.get("type", "DEFAULT_TRANSIT")
                v_name = vehicle_info.get("name", "Public Transport")
                l_name = details.get("line", {}).get("short_name", "") or details.get("line", {}).get("name", "")
                
                step_fare = calculate_transit_fare(v_type, v_name, l_name, step_dist_km, passenger_type)
                
                step_data["estimated_fare"] = step_fare
                grand_total_fare += step_fare
                transit_lines.append(v_name)
                
            steps.append(step_data)
            
        if mode == "driving":
            grand_total_fare = round((total_distance_km / fuel_efficiency) * gas_price, 2)
            
        summary = route.get("summary") or (f"via {', '.join(transit_lines)}" if transit_lines else f"Route {i+1}")
                
        parsed_routes.append({
            "route_index": i,
            "summary": summary,
            "total_distance_km": round(total_distance_km, 2),
            "total_duration_mins": round(total_duration_mins, 2),
            "grand_total_fare": round(grand_total_fare, 2),
            "transfer_count": transfer_count,
            "legs": steps,
            "insights": []
        })

    if parsed_routes:
        min_time = min(r["total_duration_mins"] for r in parsed_routes)
        min_fare = min(r["grand_total_fare"] for r in parsed_routes)
        min_transfers = min(r["transfer_count"] for r in parsed_routes)
        min_dist = min(r["total_distance_km"] for r in parsed_routes)

        for r in parsed_routes:
            if r["total_duration_mins"] == min_time:
                r["insights"].append("Fastest")
            
            if mode == "transit":
                if r["grand_total_fare"] == min_fare:
                    r["insights"].append("Cheapest")
                if r["transfer_count"] == min_transfers:
                    r["insights"].append("Most Comfortable")
            else:
                if r["grand_total_fare"] == min_fare:
                    r["insights"].append("Most Fuel Efficient")
                if r["total_distance_km"] == min_dist:
                    r["insights"].append("Most Direct")

    return {
        "origin_display": origin,
        "destination_display": destination,
        "route_mode": mode,
        "aila_tip": "I've generated the best routes! Check 'Aila Insights' to see which one is the fastest, cheapest, or most comfortable.",
        "gas_price_used": gas_price if mode == "driving" else None,
        "fuel_efficiency_used": fuel_efficiency if mode == "driving" else None,
        "passenger_type_used": passenger_type if mode == "transit" else None,
        "routes": parsed_routes
    }

@router.get("/autocomplete")
def autocomplete(q: str):
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    url = f"https://maps.googleapis.com/maps/api/place/autocomplete/json?input={q}&components=country:ph&key={api_key}"
    response = requests.get(url)
    return response.json()