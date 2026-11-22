from auxiliares import (
    escalar_coeficientes,
    evaluar_coeficientes,
    limpiar_ceros,
    multiplicar_por_factor,
    parse_puntos,
    sumar_coeficientes,
)

def diferencias_divididas(puntos):
    n = len(puntos)
    tabla = [[float(punto[1])] for punto in puntos]

    for nivel in range(1, n):
        for i in range(n - nivel):
            x1 = float(puntos[i][0])
            x2 = float(puntos[i + nivel][0])
            denom = x2 - x1
            if abs(denom) < 1e-15:
                raise ValueError("Nodos repetidos en x")

            y1 = tabla[i][nivel - 1]
            y2 = tabla[i + 1][nivel - 1]
            tabla[i].append((y2 - y1) / denom)

    return tabla


def _coeficientes_newton_dd(puntos, diffs_superiores):
    """Construye [a_m, ..., a_1, a_0] a partir de los coeficientes de diferencias divididas."""
    acumulado = [0.0]
    base_poly = [1.0]

    for i, c in enumerate(diffs_superiores):
        if i > 0:
            base_poly = multiplicar_por_factor(base_poly, float(puntos[i - 1][0]))
        acumulado = sumar_coeficientes(acumulado, escalar_coeficientes(base_poly, c))

    return limpiar_ceros(acumulado)


def formato_numero(valor):
    if abs(valor) < 1e-12:
        return "0"

    if abs(valor - round(valor)) < 1e-12:
        return str(int(round(valor)))

    return f"{valor:g}"


def construir_newton(puntos, coeficientes):
    n = len(puntos)
    polinomio = formato_numero(coeficientes[0])

    for i in range(1, n):
        coeficiente = coeficientes[i]
        if abs(coeficiente) < 1e-12:
            continue

        termino = ""
        if abs(abs(coeficiente) - 1) >= 1e-12:
            termino = formato_numero(abs(coeficiente))

        for j in range(i):
            x = puntos[j][0]
            if x >= 0:
                termino += f"(x-{formato_numero(x)})"
            else:
                termino += f"(x+{formato_numero(abs(x))})"

        if coeficiente < 0:
            polinomio += " - " + termino
        else:
            polinomio += " + " + termino

    return polinomio


def interpolacion_newton(puntos, x_evaluar=None):
    pares = parse_puntos(puntos)
    n = len(pares)
    if n < 2:
        return {
            "coeficientes": [],
            "tabla": [],
            "mensaje": "Se requieren al menos 2 puntos.",
        }

    tabla_raw = diferencias_divididas(pares)
    diffs_superiores = [tabla_raw[0][k] for k in range(n)]
    coeficientes = _coeficientes_newton_dd(pares, diffs_superiores)

    # Fila por punto: [i, x_i, y_i, f[x_i, x_{i+1}], ...]
    tabla_formateada = []
    for i in range(n):
        fila = [i, pares[i][0], pares[i][1]]
        for nivel in range(1, n):
            fila.append(tabla_raw[i][nivel] if i < n - nivel else None)
        tabla_formateada.append(fila)

    evaluacion = None
    if x_evaluar is not None:
        x_val = float(x_evaluar)
        evaluacion = {
            "x": x_val,
            "y": evaluar_coeficientes(coeficientes, x_val),
        }

    return {
        "coeficientes": coeficientes,
        "grado": len(coeficientes) - 1,
        "tabla": tabla_formateada,
        "n": n,
        "evaluacion": evaluacion,
        "polinomio_newton": construir_newton(pares, diffs_superiores),
    }


def init_dif_divididas(data):
    try:
        x_eval = getattr(data, "x_evaluar", None)
        return interpolacion_newton(data.puntos, x_eval)
    except Exception as e:
        return {
            "coeficientes": [],
            "tabla": [],
            "mensaje": f"Error: {e}",
        }