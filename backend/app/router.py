from .fare_config import FARE_SETTINGS


def calculate_fare_logic(distance_km: float, transport_type: str, user_type: str = "regular") -> float:
    try:
        parts = transport_type.split(".", 1)
        if len(parts) != 2:
            print(f"❌ FARE ERROR: Invalid transport_type format '{transport_type}'. Expected 'category.sub'.")
            return 0.0

        category, sub = parts

        if category not in FARE_SETTINGS:
            print(f"❌ FARE ERROR: Category '{category}' not found in fare_config.py!")
            return 0.0

        if sub not in FARE_SETTINGS[category]:
            print(f"❌ FARE ERROR: Sub-type '{sub}' not found under '{category}' in fare_config.py!")
            available = list(FARE_SETTINGS[category].keys())
            print(f"   Available sub-types: {available}")
            return 0.0

        config = FARE_SETTINGS[category][sub]

        base_fare = config.get("base_fare", 0.0)
        base_km = config.get("base_distance_km", 0.0)
        per_km = config.get("per_km", 0.0)

        if distance_km <= base_km:
            final_fare = base_fare
        else:
            extra_km = distance_km - base_km
            final_fare = base_fare + (extra_km * per_km)

        if user_type in ["student", "senior", "pwd"]:
            discount_rate = config.get("discount", {}).get(user_type, 0.20)
            final_fare = final_fare * (1.0 - discount_rate)

        if category == "train":
            min_fare = config.get("min_fare", 0.0)
            max_fare = config.get("max_fare", float("inf"))
            final_fare = max(min_fare, min(final_fare, max_fare))

        if category == "bus" and sub == "edsa_carousel":
            max_fare = config.get("max_fare", float("inf"))
            final_fare = min(final_fare, max_fare)

        return round(final_fare, 2)

    except Exception as e:
        print(f"❌ Fare Calc Error for '{transport_type}': {e}")
        return 0.0


TIPID_PREFERRED = {"jeepney.traditional", "jeepney.modern", "train.LRT1", "train.LRT2", "train.MRT3"}
MABILIS_PREFERRED = {"motorcycle_taxi.angkas", "motorcycle_taxi.joyride", "train.LRT1", "train.LRT2", "train.MRT3"}
KOMPORTABLE_PREFERRED = {"tnvs.grab_car", "tnvs.grab_share", "bus.p2p", "train.LRT1", "train.LRT2", "train.MRT3"}

def score_route(route: dict, route_mode: str) -> float:
    fare = route.get("grand_total_fare", 9999)
    duration = route.get("total_duration_mins", 9999)
    legs = route.get("legs", [])
    transit_legs = [l for l in legs if l.get("type") == "TRANSIT"]
    num_transfers = max(0, len(transit_legs) - 1)

    if route_mode == "tipid":
        return fare + (duration * 0.1)

    elif route_mode == "mabilis":
        return duration + (num_transfers * 5)

    elif route_mode == "komportable":
        comfort_penalty = num_transfers * 20
        return duration * 0.3 + fare * 0.2 + comfort_penalty

    else: 
        return (duration * 0.4) + (fare * 0.4) + (num_transfers * 10)


def filter_routes_by_mode(routes: list, route_mode: str) -> list:
    filtered = []
    for route in routes:
        score = score_route(route, route_mode)
        route["route_score"] = round(score, 2)
        route["route_mode"] = route_mode
        filtered.append(route)

    filtered.sort(key=lambda r: r["route_score"])
    return filtered