from auxiliares import (
    escalar_coeficientes,
    evaluar_coeficientes,
    limpiar_ceros,
    multiplicar_por_factor,
    sumar_coeficientes,
)


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


def _resolver_thomas(sub, diag, sup, b):
    """Resuelve un sistema tridiagonal Ax = b"""
    # Eliminación hacia adelante (algoritmo de Thomas):
    # En cada fila i, restamos sub[i] veces la fila i - 1 ya normalizada;
    # conceptualmente esto hace 0 la subdiagonal sub[i] (a_i) y actualiza
    # el pivote efectivo denom = diag[i] - sub[i] * c_prima[i - 1].
    # Luego dividimos entre denom para normalizar conceptualmente la
    # diagonal principal diag[i] (b_i) a 1, obteniendo c_prima[i] y d_prima[i].
    # En código no hace falta sobrescribir sub[i] = 0.0 ni diag[i] = 1.0
    # porque esos arreglos originales ya no se vuelven a leer en la vuelta.
    m = len(diag)
    if m == 0:
        return []

    c_prima = [0.0] * m
    d_prima = [0.0] * m

    c_prima[0] = sup[0] / diag[0]
    d_prima[0] = b[0] / diag[0]

    for i in range(1, m):
        denom = diag[i] - sub[i] * c_prima[i - 1]
        if abs(denom) < 1e-15:
            raise ValueError("Sistema tridiagonal singular")
        c_prima[i] = (sup[i] / denom) if i < m - 1 else 0.0
        d_prima[i] = (b[i] - sub[i] * d_prima[i - 1]) / denom

    x = [0.0] * m
    x[-1] = d_prima[-1]
    for i in range(m - 2, -1, -1):
        x[i] = d_prima[i] - c_prima[i] * x[i + 1]

    return x


def _expandir_tramo_estandar(x_i, a_i, b_i, c_i, d_i):
    """Convierte a_i + b_i(x-x_i) + c_i(x-x_i)^2 + d_i(x-x_i)^3 a [c3, c2, c1, c0]."""
    factor = [1.0, -x_i]         # (x - x_i)
    factor_2 = multiplicar_por_factor(factor, x_i)   # (x - x_i)^2
    factor_3 = multiplicar_por_factor(factor_2, x_i) # (x - x_i)^3

    poly = [a_i]
    poly = sumar_coeficientes(poly, escalar_coeficientes(factor, b_i))
    poly = sumar_coeficientes(poly, escalar_coeficientes(factor_2, c_i))
    poly = sumar_coeficientes(poly, escalar_coeficientes(factor_3, d_i))
    return limpiar_ceros(poly)


def _seleccionar_tramo(xs, x_val):
    """Devuelve el indice i del tramo que contiene a x_val."""
    n_tramos = len(xs) - 1
    if x_val <= xs[0]:
        return 0
    if x_val >= xs[-1]:
        return n_tramos - 1

    for i in range(n_tramos):
        if xs[i] <= x_val <= xs[i + 1]:
            return i

    return n_tramos - 1


def spline_cubico_natural(puntos, x_evaluar=None) -> dict:
    pares = _parse_puntos(puntos)
    if len(pares) < 2:
        return {
            "polinomios": [],
            "coeficientes_tramos": [],
            "momentos": [],
            "tabla": [],
            "evaluacion": None,
            "mensaje": "Se requieren al menos 2 puntos.",
        }

    # Ordenar por x y validar nodos distintos
    pares = sorted(pares, key=lambda p: p[0])
    for i in range(len(pares) - 1):
        if abs(pares[i + 1][0] - pares[i][0]) < 1e-15:
            raise ValueError("Nodos repetidos en x")

    xs = [p[0] for p in pares]
    ys = [p[1] for p in pares]
    n = len(pares) - 1  # cantidad de tramos

    h = [xs[i + 1] - xs[i] for i in range(n)]
    m_sec = [(ys[i + 1] - ys[i]) / h[i] for i in range(n)]

    # Segundas derivadas M_0 = 0 y M_n = 0 (la segunda derivada de los extremos siempre es 0 en este metodo)
    M = [0.0] * (n + 1)
    if n > 1:
        tam = n - 1
        sub = [0.0] + [h[i] for i in range(1, tam)]
        diag = [2.0 * (h[i] + h[i + 1]) for i in range(tam)]
        sup = [h[i + 1] for i in range(tam - 1)] + [0.0]
        b = [6.0 * (m_sec[i + 1] - m_sec[i]) for i in range(tam)]

        M_internos = _resolver_thomas(sub, diag, sup, b)
        for idx, val in enumerate(M_internos, start=1):
            M[idx] = val

    polinomios = []
    coeficientes_tramos = []
    tabla = []

    for i in range(n):
        a_i = ys[i]
        b_i = m_sec[i] - (h[i] / 6.0) * (2.0 * M[i] + M[i + 1])
        c_i = M[i] / 2.0
        d_i = (M[i + 1] - M[i]) / (6.0 * h[i])

        coef_estandar = _expandir_tramo_estandar(xs[i], a_i, b_i, c_i, d_i)
        coeficientes_tramos.append(coef_estandar)

        tramo_info = {
            "tramo": i,
            "intervalo": [xs[i], xs[i + 1]],
            "grado": len(coef_estandar) - 1,
            "coeficientes": coef_estandar,
            "forma_local": {
                "x_i": xs[i],
                "a": a_i,
                "b": b_i,
                "c": c_i,
                "d": d_i,
            },
        }
        polinomios.append(tramo_info)
        tabla.append([i, xs[i], xs[i + 1], a_i, b_i, c_i, d_i, coef_estandar])

    evaluacion = None
    if x_evaluar is not None:
        x_val = float(x_evaluar)
        idx_tramo = _seleccionar_tramo(xs, x_val)
        y_val = evaluar_coeficientes(coeficientes_tramos[idx_tramo], x_val)
        evaluacion = {
            "x": x_val,
            "y": y_val,
            "tramo": idx_tramo,
            "intervalo": [xs[idx_tramo], xs[idx_tramo + 1]],
        }

    return {
        "n_tramos": n,
        "momentos": M,
        "polinomios": polinomios,
        "coeficientes_tramos": coeficientes_tramos,
        "tabla": tabla,
        "evaluacion": evaluacion,
        "mensaje": "Spline cubico natural calculado correctamente.",
    }


def ctr_splines(data) -> dict:
    try:
        x_eval = getattr(data, "x_evaluar", None)
        return spline_cubico_natural(data.puntos, x_eval)
    except Exception as e:
        return {
            "polinomios": [],
            "coeficientes_tramos": [],
            "momentos": [],
            "tabla": [],
            "evaluacion": None,
            "mensaje": f"Error: {e}",
        }