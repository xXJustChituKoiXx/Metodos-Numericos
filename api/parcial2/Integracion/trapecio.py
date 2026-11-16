import sys, os
ruta_api = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(ruta_api)

from auxiliares import construir_funcion


def _trapecio(data):
    f = construir_funcion(data.function)
    a, b, n = data.a, data.b, data.n
    if n < 1:
        return {"resultado": None, "tabla": [], "mensaje": "n debe ser >= 1"}
    if a == b:
        return {"resultado": 0.0, "tabla": [], "mensaje": "a = b → integral = 0"}

    h = (b - a) / n
    xs = [a + i * h for i in range(n + 1)]
    ys = [f(x) for x in xs]

    tabla = []
    for i, (xi, yi) in enumerate(zip(xs, ys)):
        coef = 1 if i in (0, n) else 2
        tabla.append([i, xi, yi, coef, coef * yi])

    resultado = h / 2 * (ys[0] + 2 * sum(ys[1:-1]) + ys[-1])
    etiqueta = "simple" if n == 1 else f"compuesto (n = {n})"
    return {"resultado": resultado, "tabla": tabla, "n": n, "h": h,
            "mensaje": f"Trapecio {etiqueta} con h = {h:.6f}"}


def ctr_trapecio(data):
    try:
        return _trapecio(data)
    except Exception as e:
        return {"resultado": None, "tabla": [], "mensaje": f"Error: {e}"}