from app.physics import predict, assess_safety

def optimize(well):
    """Joint (twin-point) optimization over the CSS operating point
    (soak_time, injection_pressure) and the SRP operating point
    (spm, stroke_length) at the same time, instead of tuning one
    subsystem while freezing the other."""
    candidates = []
    for soak in [16, 20, 24, 28, 32, 36]:
        for inj in [well.injection_pressure - 10, well.injection_pressure, well.injection_pressure + 10]:
            for spm in [4, 5, 6, 7, 8, 9]:
                for stroke in [well.stroke_length - 10, well.stroke_length, well.stroke_length + 10]:
                    params = {"soak_time": soak, "injection_pressure": max(60, inj), "spm": spm, "stroke_length": max(30, stroke)}
                    r = predict(well, params)
                    risk_penalty = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}[r["float_risk"]]
                    score = r["production"] - risk_penalty * well.production * 0.08
                    candidates.append((score, r))
    best = max(candidates, key=lambda x: x[0])[1]
    current = predict(well, {"soak_time": well.soak_time, "injection_pressure": well.injection_pressure,
                              "spm": well.spm, "stroke_length": well.stroke_length})
    impact = round((best["production"] / current["production"] - 1) * 100, 2) if current["production"] else 0
    safety = assess_safety(well, best["parameters"])
    return {
        "css_point": {"soak_time": best["parameters"]["soak_time"], "injection_pressure": best["parameters"]["injection_pressure"]},
        "srp_point": {"spm": best["parameters"]["spm"], "stroke_length": best["parameters"]["stroke_length"]},
        "current": current,
        "optimal": best,
        "expected_impact_percent": impact,
        "safety": safety,
        # kept for backward compatibility with callers expecting the old shape
        "parameters": best["parameters"],
        "production": best["production"],
    }
