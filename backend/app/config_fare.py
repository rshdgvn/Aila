COMMON_DISCOUNT = {"student": 0.20, "senior": 0.20, "pwd": 0.20}

FARE_SETTINGS = {
    "last_updated": "2026-04",
    "currency": "PHP",
    "jeepney": {
        "traditional": {
            "base_fare": 14.0,
            "base_distance_km": 4.0,
            "per_km": 2.0,
            "discount": COMMON_DISCOUNT
        },
        "modern": {
            "base_fare": 17.0,
            "base_distance_km": 4.0,
            "per_km": 2.3,
            "discount": COMMON_DISCOUNT
        }
    },
    "bus": {
        "ordinary": {
            "base_fare": 15.0,
            "base_distance_km": 5.0,
            "per_km": 2.49,
            "discount": COMMON_DISCOUNT
        },
        "aircon": {
            "base_fare": 18.0,
            "base_distance_km": 5.0,
            "per_km": 2.98,
            "discount": COMMON_DISCOUNT
        },
        "edsa_carousel": {
            "base_fare": 15.0,
            "base_distance_km": 5.0,
            "per_km": 2.65,
            "max_fare": 75.50,
            "discount": COMMON_DISCOUNT
        },
        "p2p": {
            "base_fare": 100.0,
            "base_distance_km": 10.0,
            "per_km": 3.50,
            "discount": COMMON_DISCOUNT,
            "comfort_score": 5,
        },
        "provincial_ordinary": {
            "base_fare": 12.0,
            "base_distance_km": 5.0,
            "per_km": 2.20,
            "discount": COMMON_DISCOUNT
        },
        "provincial_deluxe": {
            "base_fare": 60.0,
            "base_distance_km": 5.0,
            "per_km": 2.60,
            "discount": COMMON_DISCOUNT
        },
        "provincial_luxury": {
            "base_fare": 80.0,
            "base_distance_km": 5.0,
            "per_km": 3.35,
            "discount": COMMON_DISCOUNT
        }
    },
    "train": {
        "LRT1": {
            "base_fare": 16.25,
            "base_distance_km": 0,
            "per_km": 1.47,
            "min_fare": 15.0,
            "max_fare": 35.0,
            "discount": COMMON_DISCOUNT
        },
        "LRT2": {
            "base_fare": 13.29,
            "base_distance_km": 0,
            "per_km": 1.21,
            "min_fare": 15.0,
            "max_fare": 35.0,
            "discount": COMMON_DISCOUNT
        },
        "MRT3": {
            "base_fare": 13.29,
            "base_distance_km": 0,
            "per_km": 1.21,
            "min_fare": 15.0,
            "max_fare": 35.0,
            "discount": COMMON_DISCOUNT
        }
    },
    "tricycle": {
        "regular": {
            "base_fare": 10.0,
            "base_distance_km": 2.0,
            "per_km": 3.0,
            "discount": COMMON_DISCOUNT
        }
    },
    "fx_uv": {
        "regular": {
            "base_fare": 20.0,
            "base_distance_km": 5.0,
            "per_km": 3.0,
            "discount": COMMON_DISCOUNT
        }
    },
    "motorcycle_taxi": {
        "angkas": {
            "base_fare": 40.0,
            "base_distance_km": 4.0,
            "per_km": 8.0,
            "discount": {}
        },
        "joyride": {
            "base_fare": 35.0,
            "base_distance_km": 4.0,
            "per_km": 7.5,
            "discount": {}
        }
    },
    "tnvs": {
        "grab_car": {
            "base_fare": 80.0,
            "base_distance_km": 2.0,
            "per_km": 14.0,
            "discount": {}
        },
        "grab_share": {
            "base_fare": 50.0,
            "base_distance_km": 2.0,
            "per_km": 9.0,
            "discount": {}
        }
    }
}