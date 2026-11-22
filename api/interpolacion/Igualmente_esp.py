import re

from auxiliares import (
    escalar_coeficientes,
    evaluar_coeficientes,
    limpiar_ceros,
    multiplicar_por_factor,
    sumar_coeficientes,
)


def _parse_yvals(y_vals):
    if isinstance(y_vals, list):
        return [float(v) for v in y_vals]
    return [float(v) for v in re.split(r"[,\s]+", str(y_vals).strip()) if v]


def _coeficientes_newton_adelante(x0, h, dif):
    n = len(dif)
    acumulado = [0.0]
    base_poly = [1.0]
    fact = 1.0
    h_potencia = 1.0

    for k in range(n):
        if k > 0:
            nodo_anterior = x0 + (k - 1) * h
            base_poly = multiplicar_por_factor(base_poly, nodo_anterior)
            fact *= k
            h_potencia *= h

        termino = escalar_coeficientes(base_poly, dif[k][0] / (fact * h_potencia))
        acumulado = sumar_coeficientes(acumulado, termino)

    return limpiar_ceros(acumulado)

def _newton_adelante(x0, h, y_vals, x_eval=None):
    ys = _parse_yvals(y_vals)
    n = len(ys)
    if n < 1:
        return {"resultado": None, "tabla": [], "mensaje": "Sin valores"}
    if float(h) == 0:
        return {"resultado": None, "tabla": [], "mensaje": "h debe ser distinto de 0"}

    x0_val = float(x0)
    h_val = float(h)

    dif = [ys[:]]
    for _ in range(1, n):
        prev = dif[-1]
        dif.append([prev[i + 1] - prev[i] for i in range(len(prev) - 1)])

    tabla_out = []
    for k in range(n):
        fila = [f"Δ^{k} y"]
        fila.extend(dif[k])
        while len(fila) < n + 1:
            fila.append(None)
        tabla_out.append(fila)

    coeficientes = _coeficientes_newton_adelante(x0_val, h_val, dif)

    s = None
    resultado = None
    evaluacion = None
    x_val = None
    mensaje = "Polinomio de diferencias progresivas calculado."

    if x_eval is not None:
        x_val = float(x_eval)
        s = (x_val - x0_val) / h_val
        resultado = dif[0][0]
        term_s, fact = 1.0, 1.0
        for k in range(1, n):
            term_s *= (s - (k - 1))
            fact *= k
            resultado += (term_s / fact) * dif[k][0]

        evaluacion = {
            "x": x_val,
            "y": evaluar_coeficientes(coeficientes, x_val),
        }
        mensaje = f"s = (x - x0)/h = ({x_val} - {x0_val}) / {h_val} = {s:.6f}"

    return {
        "resultado": resultado,
        "coeficientes": coeficientes,
        "grado": len(coeficientes) - 1,
        "evaluacion": evaluacion,
        "s": s,
        "tabla": tabla_out,
        "n": n,
        "x0": x0_val,
        "h": h_val,
        "x_evaluar": x_val,
        "mensaje": mensaje,
    }


def ctr_igualmente_espaciados(data):
    try:
        x_eval = getattr(data, "x_evaluar", None)
        return _newton_adelante(data.x0, data.h, data.y_vals, x_eval)
    except Exception as e:
        return {"resultado": None, "tabla": [], "mensaje": f"Error: {e}"}