# Métodos Numéricos

## Instalación

```bash
pip install fastapi
pip install sympy
cd api
python -m uvicorn app:app --reload
```

## Estado de los métodos

| Símbolo | Significado |
|:---:|---|
| ✅ | Terminado |
| ⚠️ | En producción |
| ❗ | No empezado |

## Métodos numéricos (para raíces)

| Método | Responsable | Estado | Notas |
|---|:---:|:---:|---|
| Flotante a Bin | RICARDO | ✅ | Terminado |
| Bisección | ISIS | ✅ | Terminado |
| Secante | FERNANDO | ✅ | Terminado |
| Falsa posición | RICARDO | ✅ | Terminado |
| Newton-Raphson | RICARDO | ✅ | Terminado |
| Punto Fijo | FERNANDO | ✅ | Terminado |
| Steffensen | ISIS | ✅ | Terminado |
| Deflación | ISIS | ✅ | Terminado |
| Horner | FERNANDO | ✅ | Terminado |
| Müller | RICARDO | ✅ | Terminado |

## Interpolaciones

| Método | Responsable | Estado | Notas |
|---|---|:---:|---|
| Lagrange | FERNANDO | ✅ | Terminado |
| Neville | ISIS | ✅ | Terminado |
| Diferencias divididas | RICARDO | ✅ | Terminado |
| Igualmente espaciados | ISIS | ✅ | Terminado |
| Hermite | FERNANDO | ❗ | |
| Splines cúbicos | RICARDO | ✅ | Terminado |

## Derivación

| Método | Responsable | Estado | Notas |     
|---|:---:|:---:|---|
| Fórmula de 2 puntos (hacer serie de Taylor también) | ISIS | ✅ | Terminado |
| Fórmula 2 puntos igual espaciada | FERNANDO | ❗ |  |
| Fórmula 3 puntos igual espaciada | RICARDO | ✅ | Terminado |

## Integración

| Método | Responsable | Estado | Notas |
|---|:---:|:---:|---|
| Trapecio (simple y compuesto) | ISIS | ✅ | Terminado |
| Simpson 1/3 (simple y compuesto) | FERNANDO | ❗ |  |
| Simpson 3/8 (simple y compuesto) | RICARDO | ❗ |  |
| Extrapolación de Richardson y Romberg | FERNANDO | ❗ |  |
| Cuadratura adaptativa | RICARDO | ❗ |  |
| Cuadratura gaussiana (simple y compuesto) | ISIS | ✅ | Terminado |
| Integración múltiple (Trapecio compuesto...) | FERNANDO | ❗ |  |

## Ecuaciones Diferenciasles
| Método | Responsable | Estado | Notas |
|---|:---:|:---:|---|
| Euler | Ricardo | ❗ |  |
| Taylor de Orden n| Isis | ❗ |  |
| Runge Kutta 2 | Fernando | ❗ |  |
| Runge Kutta 4 | Ricardo | ❗ |  |
| Runge Kutta Fehlberg | Isis | ❗ |  |
| Adamds - Bashforth | Fernando | ❗ |  |
| Adams - Moulton | Ricardo | ❗ |  |

## Programas para testear

- Postman

## Clases reutilizables de CSS

- `.menu-metodos`
- `.inputs-div`
- `.send-button`
- `.error-message`

## Especificación de métodos

**Parámetros:** variable de función, intervalo 1, intervalo 2, error máximo, máximo de iteraciones

**Salida:**

```json
{
  "raiz": "",
  "tabla": "",
  "aproximaciones": ""
}
```

## Generales

- Hacer generador de tabla