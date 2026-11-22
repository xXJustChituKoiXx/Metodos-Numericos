from auxiliares import (
    escalar_coeficientes,
    evaluar_coeficientes,
    limpiar_ceros,
    multiplicar_por_factor,
    sumar_coeficientes,
)


def _coeficientes_interpolantes(xs, ys):
    """Construye los coeficientes [a_m, ..., a_1, a_0] del polinomio interpolante."""
    n = len(xs)
    acumulado = [0.0]

    for i in range(n):
        xi = xs[i]
        yi = ys[i]
        Li = [1.0]
        denominador = 1.0

        for j in range(n):
            if j != i:
                xj = xs[j]
                Li = multiplicar_por_factor(Li, xj)
                denominador *= (xi - xj)

        Li = escalar_coeficientes(Li, 1.0 / denominador)
        acumulado = sumar_coeficientes(acumulado, escalar_coeficientes(Li, yi))

    return limpiar_ceros(acumulado)


def _parse_puntos(puntos):
    if isinstance(puntos, list):
        pares = []
        for p in puntos:
            if not isinstance(p, (list, tuple)) or len(p) != 2:
                raise ValueError(f"Punto invalido: '{p}'")
            pares.append([float(p[0]), float(p[1])])
        return pares

    txt = str(puntos).replace("\n", ";")
    pares = []
    for chunk in txt.split(";"):
        chunk = chunk.strip()
        if not chunk:
            continue
        vals = chunk.split(",")
        if len(vals) != 2:
            raise ValueError(f"Punto invalido: '{chunk}' (debe ser 'x,y')")
        pares.append([float(vals[0].strip()), float(vals[1].strip())])
    return pares


def _neville(puntos, x_eval):
    if x_eval is None:
        return {"resultado": None, "tabla": [], "mensaje": "Debe ingresar x a evaluar"}

    x_val = float(x_eval)
    pares = _parse_puntos(puntos)
    n = len(pares)

    if n < 2:
        return {"resultado": None, "tabla": [], "mensaje": "Se requieren al menos 2 puntos"}

    xs = [p[0] for p in pares]
    ys = [p[1] for p in pares]

    N = [[0.0] * n for _ in range(n)]
    for i in range(n):
        N[i][0] = ys[i]

    for j in range(1, n):
        for i in range(n - j):
            denom = xs[i] - xs[i + j]
            if abs(denom) < 1e-15:
                return {"resultado": None, "tabla": [], "mensaje": "Nodos repetidos"}
            N[i][j] = (
                (x_val - xs[i + j]) * N[i][j - 1]
                - (x_val - xs[i]) * N[i + 1][j - 1]
            ) / denom

    tabla = []
    for i in range(n):
        fila = [i]
        for j in range(n):
            fila.append(N[i][j] if j <= n - 1 - i else None)
        tabla.append(fila)

    coeficientes = _coeficientes_interpolantes(xs, ys)

    return {
        "resultado": N[0][n - 1],
        "coeficientes": coeficientes,
        "grado": len(coeficientes) - 1,
        "evaluacion": {
            "x": x_val,
            "y": evaluar_coeficientes(coeficientes, x_val),
        },
        "tabla": tabla,
        "n": n,
        "x_evaluar": x_val,
        "mensaje": f"Polinomio interpolante evaluado en x = {x_val}",
    }


def ctr_neville(data):
    try:
        return _neville(data.puntos, data.x_evaluar)
    except Exception as e:
        return {"resultado": None, "tabla": [], "mensaje": f"Error: {e}"}