from math import sqrt

from auxiliares import construir_funcion

from auxiliares import construir_funcion

GAUSS_NODES = {
    2: ([-1 / sqrt(3), 1 / sqrt(3)], [1.0, 1.0]),
    3: ([-sqrt(3 / 5), 0.0, sqrt(3 / 5)], [5 / 9, 8 / 9, 5 / 9]),
    4: ([-0.8611363115940526, -0.3399810435848563,
         0.3399810435848563,  0.8611363115940526],
        [0.3478548451374538, 0.6521451548625461,
         0.6521451548625461, 0.3478548451374538]),
}


def _gauss_simple(f, a, b, n):
    nodes, weights = GAUSS_NODES[n]
    c = (b - a) / 2
    d = (b + a) / 2
    return c * sum(w * f(c * t + d) for t, w in zip(nodes, weights))


def _gaussiana(data):
    f = construir_funcion(data.function)
    a, b, n, m = data.a, data.b, data.n, data.m

    if n not in GAUSS_NODES:
        return {"resultado": None, "tabla": [],
                "mensaje": "n debe ser 2, 3 o 4"}
    if m < 1:
        return {"resultado": None, "tabla": [], "mensaje": "m debe ser >= 1"}

    h = (b - a) / m
    total = 0.0
    tabla = []

    for i in range(m):
        ai, bi = a + i * h, a + (i + 1) * h
        nodes, weights = GAUSS_NODES[n]
        c = (bi - ai) / 2
        d = (bi + ai) / 2

        for k, (t, w) in enumerate(zip(nodes, weights)):
            x_k = c * t + d
            fx = f(x_k)
            contrib = w * fx * c
            total += contrib
            tabla.append([i + 1, k + 1, t, x_k, w, fx, contrib])

    etiqueta = "simple" if m == 1 else f"compuesta (m = {m})"
    return {"resultado": total, "tabla": tabla, "n": n, "m": m, "h": h,
            "mensaje": f"Gauss-Legendre n={n} {etiqueta}"}


def ctr_gaussiana(data):
    try:
        return _gaussiana(data)
    except Exception as e:
        return {"resultado": None, "tabla": [], "mensaje": f"Error: {e}"}