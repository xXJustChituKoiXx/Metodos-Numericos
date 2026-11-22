from auxiliares import (
    construir_funcion,
    evaluar_coeficientes,
    parse_puntos,
)
from interpolacion.lagrange import Lagrange


def _derivar_coeficientes(coeficientes: list) -> list:
    grado = len(coeficientes) - 1
    if grado <= 0:
        return [0.0]
    return [coeficientes[i] * (grado - i) for i in range(grado)]


def _validar_equiespaciados(puntos: list, tol: float = 1e-7) -> float:
    if len(puntos) != 3:
        raise ValueError("Se requieren exactamente 3 puntos.")

    ordenados = sorted(puntos, key=lambda p: p[0])
    h1 = ordenados[1][0] - ordenados[0][0]
    h2 = ordenados[2][0] - ordenados[1][0]

    if abs(h1) < 1e-12 or abs(h2) < 1e-12:
        raise ValueError("El paso h debe ser distinto de 0.")
    if abs(h1 - h2) > tol:
        raise ValueError(
            f"Los puntos no estan igualmente espaciados (h1={h1:g}, h2={h2:g})."
        )

    return (h1 + h2) / 2.0


def _resolver_modo_puntos(data) -> dict:
    puntos = sorted(parse_puntos(data.puntos), key=lambda p: p[0])
    h = _validar_equiespaciados(puntos)

    interp = Lagrange(puntos)
    coeficientes = interp["coeficientes"]
    coeficientes_derivada = _derivar_coeficientes(coeficientes)

    x0, y0 = puntos[0]
    x1, y1 = puntos[1]
    x2, y2 = puntos[2]

    d_x0 = evaluar_coeficientes(coeficientes_derivada, x0)
    d_x1 = evaluar_coeficientes(coeficientes_derivada, x1)
    d_x2 = evaluar_coeficientes(coeficientes_derivada, x2)

    x_eval = float(data.x) if data.x is not None else x1
    y_eval = evaluar_coeficientes(coeficientes_derivada, x_eval)

    tabla = [
        [1, "Progresiva (x0)", x0, y0, d_x0, "(h²/3)·f'''(ξ)"],
        [2, "Central (x1)", x1, y1, d_x1, "-(h²/6)·f'''(ξ)"],
        [3, "Retro (x2)", x2, y2, d_x2, "(h²/3)·f'''(ξ₂)"],
    ]

    return {
        "modo": "puntos",
        "h": h,
        "puntos": puntos,
        "coeficientes": coeficientes,
        "coeficientes_derivada": coeficientes_derivada,
        "x_evaluar": x_eval,
        "resultado": y_eval,
        "tabla": tabla,
        "notas": [
            "f'(x0) ≈ [-3f(x0) + 4f(x1) - f(x2)] / (2h)   | Error: (h²/3)·f'''(ξ)",
            "f'(x1) ≈ [-f(x0) + f(x2)] / (2h)            | Error: -(h²/6)·f'''(ξ)",
            "f'(x2) ≈ [f(x0) - 4f(x1) + 3f(x2)] / (2h)   | Error: (h²/3)·f'''(ξ₂)",
        ],
        "mensaje": "Derivada calculada con P2'(x) sobre 3 nodos equidistantes (x0, x1, x2).",
    }


def _resolver_modo_funcion(data) -> dict:
    if data.x is None or data.h is None:
        raise ValueError("Para el modo 'funcion' debes enviar 'x' y 'h'.")
    if data.h == 0:
        raise ValueError("El paso 'h' debe ser distinto de 0.")

    f = construir_funcion(data.function)
    x1 = float(data.x)
    h = float(data.h)

    # Tomamos x1 como nodo central: x0 = x1 - h, x1, x2 = x1 + h
    x0, x2 = x1 - h, x1 + h
    y0, y1, y2 = f(x0), f(x1), f(x2)

    prog_x0 = (-3.0 * y0 + 4.0 * y1 - y2) / (2.0 * h)
    cent_x1 = (-y0 + y2) / (2.0 * h)
    retro_x2 = (y0 - 4.0 * y1 + 3.0 * y2) / (2.0 * h)

    tabla = [
        [1, "Progresiva (x0)", x0, y0, prog_x0, "(h²/3)·f'''(ξ)"],
        [2, "Central (x1)", x1, y1, cent_x1, "-(h²/6)·f'''(ξ)"],
        [3, "Retro (x2)", x2, y2, retro_x2, "(h²/3)·f'''(ξ₂)"],
    ]

    return {
        "modo": "funcion",
        "h": h,
        "puntos": [[x0, y0], [x1, y1], [x2, y2]],
        "x_evaluar": x1,
        "resultado": cent_x1,
        "progresiva_3pts": prog_x0,
        "central_3pts": cent_x1,
        "retro_3pts": retro_x2,
        "tabla": tabla,
        "notas": [
            "f'(x0) ≈ [-3f(x0) + 4f(x1) - f(x2)] / (2h)   | Error: (h²/3)·f'''(ξ)",
            "f'(x1) ≈ [-f(x0) + f(x2)] / (2h)            | Error: -(h²/6)·f'''(ξ)",
            "f'(x2) ≈ [f(x0) - 4f(x1) + 3f(x2)] / (2h)   | Error: (h²/3)·f'''(ξ₂)",
        ],
        "mensaje": "Fórmulas de 3 puntos equidistantes evaluadas en x0, x1 y x2.",
    }


def _derivacion_3puntos(data) -> dict:
    if data.puntos is not None and str(data.puntos).strip() != "":
        return _resolver_modo_puntos(data)
    if data.function is not None and data.function.strip() != "":
        return _resolver_modo_funcion(data)
    raise ValueError(
        "Debes proporcionar 'puntos' (3 puntos) o 'function' con 'x' y 'h'."
    )


def ctr_derivacion_3puntos(data) -> dict:
    try:
        return _derivacion_3puntos(data)
    except Exception as e:
        return {"resultado": None, "tabla": [], "mensaje": f"Error: {e}"}