import re

def _parse_yvals(y_vals):
    if isinstance(y_vals, list):
        return [float(v) for v in y_vals]
    return [float(v) for v in re.split(r"[,\s]+", y_vals.strip()) if v]


def _newton_adelante(x0, h, y_vals, x_eval):
    ys = _parse_yvals(y_vals)
    n = len(ys)
    if n < 1:
        return {"resultado": None, "tabla": [], "mensaje": "Sin valores"}
    if h == 0:
        return {"resultado": None, "tabla": [], "mensaje": "h debe ser distinto de 0"}

    # Tabla de diferencias progresivas (triangular)
    dif = [ys[:]]
    for _ in range(1, n):
        prev = dif[-1]
        dif.append([prev[i + 1] - prev[i] for i in range(len(prev) - 1)])

    s = (x_eval - x0) / h
    resultado = dif[0][0]
    term_s, fact = 1.0, 1.0
    for k in range(1, n):
        term_s *= (s - (k - 1))
        fact *= k
        resultado += (term_s / fact) * dif[k][0]

    tabla_out = []
    for k in range(n):
        fila = [f"Δ^{k} y"]
        fila.extend(dif[k])
        while len(fila) < n + 1:
            fila.append(None)
        tabla_out.append(fila)

    return {"resultado": resultado, "s": s, "tabla": tabla_out, "n": n,
            "x0": x0, "h": h, "x_evaluar": x_eval,
            "mensaje": f"s = (x - x0)/h = ({x_eval} - {x0}) / {h} = {s:.6f}"}


def ctr_igualmente_espaciados(data):
    try:
        return _newton_adelante(data.x0, data.h, data.y_vals, data.x_evaluar)
    except Exception as e:
        return {"resultado": None, "tabla": [], "mensaje": f"Error: {e}"}