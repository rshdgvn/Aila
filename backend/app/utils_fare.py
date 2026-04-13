from .config_fare import FARE_SETTINGS

def calculate_transit_fare(vehicle_type: str, vehicle_name: str, line_name: str, distance_km: float, passenger_type: str = "regular"):
    cat = "jeepney"
    sub_cat = "traditional"
    
    v_type = vehicle_type.upper()
    v_name = vehicle_name.lower()
    l_name = line_name.lower()
    
    if v_type in ["BUS", "INTERCITY_BUS"]:
        cat = "bus"
        if "edsa" in l_name or "carousel" in l_name:
            sub_cat = "edsa_carousel"
        elif "p2p" in l_name or "p2p" in v_name:
            sub_cat = "p2p"
        elif "aircon" in v_name or "ac" in v_name:
            sub_cat = "aircon"
        else:
            sub_cat = "ordinary"
    elif v_type in ["HEAVY_RAIL", "SUBWAY", "TRAM", "COMMUTER_TRAIN"]:
        cat = "train"
        if "lrt" in l_name and "1" in l_name:
            sub_cat = "LRT1"
        elif "lrt" in l_name and "2" in l_name:
            sub_cat = "LRT2"
        else:
            sub_cat = "MRT3"
    elif v_type == "SHARE_TAXI":
        cat = "jeepney"
        if "modern" in v_name:
            sub_cat = "modern"
        else:
            sub_cat = "traditional"
    elif v_type == "TAXI":
        cat = "tnvs"
        sub_cat = "grab_car"
            
    config = FARE_SETTINGS.get(cat, {}).get(sub_cat)
    if not config:
        config = FARE_SETTINGS["jeepney"]["traditional"]
        
    base_fare = config.get("base_fare", 14.0)
    base_dist = config.get("base_distance_km", 4.0)
    per_km = config.get("per_km", 2.0)
    
    if distance_km <= base_dist:
        raw_fare = base_fare
    else:
        raw_fare = base_fare + ((distance_km - base_dist) * per_km)
        
    if "min_fare" in config and raw_fare < config["min_fare"]:
        raw_fare = config["min_fare"]
    if "max_fare" in config and raw_fare > config["max_fare"]:
        raw_fare = config["max_fare"]
        
    discount = config.get("discount", {}).get(passenger_type, 0.0)
    final_fare = raw_fare * (1.0 - discount)
    return round(final_fare, 2)