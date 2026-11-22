import sys, os
ruta_api = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(ruta_api)

from auxiliares import construir_funcion


def _derivacion(data):
    f = construir_funcion(data.function)
    x, h = data.x, data.h
    if h == 0:
        return {"resultado": None, "tabla": [], "mensaje": "h debe ser distinto de 0"}

    fx  = f(x)
    fxp = f(x + h)
    fxm = f(x - h)

    prog = (fxp - fx) / h
    regr = (fx - fxm) / h
    cent = (fxp - fxm) / (2 * h)

    tabla = [
        [1, "Progresiva", fx, fxp, prog, "O(h)"],
        [2, "Regresiva",  fx, fxm, regr, "O(h)"],
        [3, "Central",    fxm, fxp, cent, "O(h²)"],
    ]

    return {
        "resultado": cent,
        "progresiva": prog, "regresiva": regr, "central": cent,
        "tabla": tabla,
        "taylor": [
            "Progresiva: f'(x) = [f(x+h) - f(x)]/h - (h/2)·f''(ξ)",
            "Regresiva : f'(x) = [f(x) - f(x-h)]/h + (h/2)·f''(ξ)",
            "Central   : f'(x) = [f(x+h) - f(x-h)]/(2h) - (h²/6)·f'''(ξ)",
        ],
        "mensaje": "El error de la central es O(h²); las otras son O(h).",
    }


def ctr_derivacion_2puntos(data):
    try:
        return _derivacion(data)
    except Exception as e:
        return {"resultado": None, "tabla": [], "mensaje": f"Error: {e}"}