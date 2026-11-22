import {
    createSection,
    createLabel,
    createInput,
    createButton,
    createDiv,
    createSpan,
    createGenericTable,
    createPolynomial,
    createChartCanvas,
    renderizarGraficaMultiplesPolinomios
} from "../factories.js";
import {
    mostrarError,
    formatearNumero,
    renderizarGrafica
} from "../auxiliares.js";
import { conectApi } from "../conection.js";

function graficarFuncion3Puntos(data, expr) {
    const x0 = Number(data.x_evaluar);
    const h = Math.abs(Number(data.h)) || 0.01;
    if (!expr || !isFinite(x0)) return;

    const { sin, cos, tan, asin, acos, atan, exp, log, log10, sqrt, abs, PI: pi, E: e } = Math;
    const f = new Function(
        "x", "sin", "cos", "tan", "asin", "acos", "atan", "exp", "log", "log10", "sqrt", "abs", "pi", "e",
        `return (${expr.replace(/\bmath\./g, "").replace(/\^/g, "**")});`
    );

    const radio = Math.max(h * 2.5, 0.5);
    const curva = [];
    for (let i = 0; i <= 100; i++) {
        const x = (x0 - radio) + (i * (2 * radio)) / 100;
        const y = Number(f(x, sin, cos, tan, asin, acos, atan, exp, log, log10, sqrt, abs, pi, e));
        if (isFinite(y)) curva.push({ x, y });
    }

    const nodos = Array.isArray(data.puntos)
        ? data.puntos.map(([x, y]) => ({ x, y }))
        : [];

    const sectionGrafica = createChartCanvas(
        "grafica-section-d3p",
        "derivacion3PuntosChart",
        "Gráfica de f(x) y Nodos (x0, x1, x2)"
    );
    document.querySelector("article").appendChild(sectionGrafica);

    renderizarGrafica("derivacion3PuntosChart", [
        { label: `f(x) = ${expr}`, data: curva, type: "line", borderColor: "#3b82f6", borderWidth: 2, fill: false, pointRadius: 0 },
        { label: "Nodos (x0, x1, x2)", data: nodos, type: "scatter", backgroundColor: "#f57eb6", pointRadius: 6 }
    ]);
}

export function derivacion_3puntos_init() {
    const article = document.querySelector("article");

    const sectionInput = createSection("main-section-d3p", "main-section-d3p");
    const inputDiv = createDiv("input-section-d3p", "inputs-div");

    const h2 = document.createElement("h2");
    h2.textContent = "Derivacion numerica: 3 puntos igualmente espaciados.";

    const labelModo = createLabel("label-modo-d3p", "label-input", "select-modo-d3p", "Modo de entrada:");
    const selectModo = document.createElement("select");
    selectModo.id = "select-modo-d3p";
    selectModo.className = "input-text";

    const optPuntos = document.createElement("option");
    optPuntos.value = "puntos";
    optPuntos.textContent = "3 Puntos (Lagrange)";

    const optFuncion = document.createElement("option");
    optFuncion.value = "funcion";
    optFuncion.textContent = "Funcion f(x) y paso h";

    selectModo.appendChild(optPuntos);
    selectModo.appendChild(optFuncion);

    const divModoPuntos = createDiv("modo-puntos-d3p", "modo-container");
    const labelPuntos = createLabel("label-puntos-d3p", "label-input", "", "Ingrese 3 puntos equidistantes (x0, x1, x2):");
    const contenedorPuntos = createDiv("contenedor-puntos-d3p", "contenedor-filas");

    for (let i = 0; i < 3; i++) {
        const filaDiv = createDiv("", "fila-punto");
        const inputX = createInput("", "input-text", "number", `x${i}`);
        inputX.step = "any";
        const inputY = createInput("", "input-text", "number", `y${i}`);
        inputY.step = "any";
        filaDiv.appendChild(inputX);
        filaDiv.appendChild(inputY);
        contenedorPuntos.appendChild(filaDiv);
    }

    const labelXEvals = createLabel("label-xeval-d3p", "label-input", "input-xeval-d3p", "Evaluar derivada en x (opcional, por defecto x1):");
    const inputXEvals = createInput("input-xeval-d3p", "input-number", "number", "Ej: 1.5");
    inputXEvals.step = "any";

    divModoPuntos.appendChild(labelPuntos);
    divModoPuntos.appendChild(contenedorPuntos);
    divModoPuntos.appendChild(labelXEvals);
    divModoPuntos.appendChild(inputXEvals);

    const divModoFuncion = createDiv("modo-funcion-d3p", "modo-container");
    const lF = createLabel("label-f-d3p", "label-input", "input-f-d3p", "Funcion f(x):");
    const iF = createInput("input-f-d3p", "input-text", "text", "Ej: exp(x) o sin(x)");

    const lX = createLabel("label-x-d3p", "label-input", "input-x-d3p", "Punto central x1:");
    const iX = createInput("input-x-d3p", "input-number", "number", "Ej: 1.0");
    iX.step = "any";

    const lH = createLabel("label-h-d3p", "label-input", "input-h-d3p", "Paso h:");
    const iH = createInput("input-h-d3p", "input-number", "number", "Ej: 0.01");
    iH.step = "any";
    iH.value = "0.01";

    divModoFuncion.appendChild(lF);
    divModoFuncion.appendChild(iF);
    divModoFuncion.appendChild(lX);
    divModoFuncion.appendChild(iX);
    divModoFuncion.appendChild(lH);
    divModoFuncion.appendChild(iH);

    const errorMensaje = createSpan("error-d3p", "error-message", "");
    errorMensaje.style.display = "none";

    const buttonSend = createButton("send-button", "Calcular");

    function actualizarVisibilidadModo() {
        errorMensaje.style.display = "none";
        if (selectModo.value === "puntos") {
            divModoPuntos.style.display = "block";
            divModoFuncion.style.display = "none";
            iF.value = "";
            iX.value = "";
        } else {
            divModoPuntos.style.display = "none";
            divModoFuncion.style.display = "block";
            inputXEvals.value = "";
            contenedorPuntos.querySelectorAll("input").forEach((inp) => {
                inp.value = "";
            });
        }
    }

    selectModo.addEventListener("change", actualizarVisibilidadModo);
    actualizarVisibilidadModo();

    inputDiv.appendChild(h2);
    inputDiv.appendChild(labelModo);
    inputDiv.appendChild(selectModo);
    inputDiv.appendChild(divModoPuntos);
    inputDiv.appendChild(divModoFuncion);
    inputDiv.appendChild(errorMensaje);
    inputDiv.appendChild(buttonSend);

    sectionInput.appendChild(inputDiv);
    article.appendChild(sectionInput);

    buttonSend.addEventListener("click", async () => {
        errorMensaje.style.display = "none";
        const modoActual = selectModo.value;
        let payload = null;
        let exprFunc = "";

        if (modoActual === "puntos") {
            if (iF.value.trim() !== "") {
                mostrarError(errorMensaje, "Estas en modo Puntos: no debes ingresar funcion.");
                return;
            }

            const filas = contenedorPuntos.querySelectorAll(".fila-punto");
            const puntos = [];
            const vistasX = [];

            for (const fila of filas) {
                const inputs = fila.querySelectorAll("input");
                const rawX = inputs[0].value.trim();
                const rawY = inputs[1].value.trim();

                if (rawX === "" || rawY === "") {
                    mostrarError(errorMensaje, "Complete los valores (x, y) de los 3 puntos.");
                    return;
                }

                const valX = Number(rawX);
                const valY = Number(rawY);

                if (!isFinite(valX) || !isFinite(valY)) {
                    mostrarError(errorMensaje, "Los valores de los puntos deben ser numeros validos.");
                    return;
                }

                if (vistasX.includes(valX)) {
                    mostrarError(errorMensaje, `El valor x = ${valX} esta repetido.`);
                    return;
                }

                vistasX.push(valX);
                puntos.push([valX, valY]);
            }

            const ordenados = [...puntos].sort((a, b) => a[0] - b[0]);
            const h1 = ordenados[1][0] - ordenados[0][0];
            const h2 = ordenados[2][0] - ordenados[1][0];
            if (Math.abs(h1) < 1e-12 || Math.abs(h2) < 1e-12 || Math.abs(h1 - h2) > 1e-7) {
                mostrarError(errorMensaje, "Los 3 puntos deben estar igualmente espaciados (h != 0).");
                return;
            }

            let xEvalNum = null;
            if (inputXEvals.value.trim() !== "") {
                xEvalNum = Number(inputXEvals.value);
                if (!isFinite(xEvalNum)) {
                    mostrarError(errorMensaje, "El valor de x a evaluar debe ser un numero valido.");
                    return;
                }
            }

            payload = { puntos: puntos, x: xEvalNum };
        } else if (modoActual === "funcion") {
            const f = iF.value.trim();
            const rawX = iX.value.trim();
            const rawH = iH.value.trim();

            if (f === "" || rawX === "" || rawH === "") {
                mostrarError(errorMensaje, "Complete funcion, punto x1 y paso h.");
                return;
            }

            const x = Number(rawX);
            const h = Number(rawH);

            if (!isFinite(x) || !isFinite(h)) {
                mostrarError(errorMensaje, "x y h deben ser numeros validos.");
                return;
            }

            if (h === 0) {
                mostrarError(errorMensaje, "El paso h debe ser distinto de 0.");
                return;
            }

            payload = { function: f, x: x, h: h };
            exprFunc = f;
        } else {
            mostrarError(errorMensaje, "Seleccione un modo valido (Puntos o Funcion).");
            return;
        }

        const respuesta = await conectApi(JSON.stringify(payload), "derivacion_3puntos");
        if (!respuesta) {
            mostrarError(errorMensaje, "No se pudo conectar con el servidor.");
            return;
        }

        derivacion_3puntos_result(respuesta, exprFunc);
    });
}

function derivacion_3puntos_result(data, exprFunc = "") {
    const article = document.querySelector("article");

    const anteriorRes = document.getElementById("result-section-d3p");
    if (anteriorRes) anteriorRes.remove();

    const anteriorGraf = document.getElementById("grafica-section-d3p");
    if (anteriorGraf) anteriorGraf.remove();

    const section = createSection("result-section-d3p", "main-section-d3p section-resultados");
    const div = createDiv("result-div-d3p", "inputs-div container-res");

    const h2 = document.createElement("h2");
    h2.textContent = "Resultados";
    div.appendChild(h2);

    if (!data.tabla || data.tabla.length === 0 || data.resultado === null || data.resultado === undefined) {
        div.appendChild(createSpan("aviso-d3p", "error-message", data.mensaje || "No se pudo calcular."));
        section.appendChild(div);
        article.appendChild(section);
        return;
    }

    if (data.modo === "puntos") {
        const cardPoly = createDiv("", "resultado-card");
        cardPoly.appendChild(createLabel("", "", "", "Polinomio interpolante P2(x):"));
        cardPoly.appendChild(createPolynomial("polinomio-d3p", "resultado-polinomio", data.coeficientes || []));
        div.appendChild(cardPoly);

        const cardDeriv = createDiv("", "resultado-card");
        cardDeriv.appendChild(createLabel("", "", "", "Derivada P2'(x):"));
        cardDeriv.appendChild(createPolynomial("derivada-d3p", "resultado-polinomio", data.coeficientes_derivada || []));
        div.appendChild(cardDeriv);

        const cardEval = createDiv("", "resultado-card");
        cardEval.appendChild(createSpan(
            "res-puntos-d3p",
            "resultado-texto",
            `P2'(${formatearNumero(data.x_evaluar)}) = ${formatearNumero(data.resultado)}   (h = ${formatearNumero(data.h)})`
        ));
        div.appendChild(cardEval);
    } else {
        const cardDeriv = createDiv("", "resultado-card");
        cardDeriv.appendChild(createLabel("", "", "", "Derivada en nodo central f'(x1):"));
        cardDeriv.appendChild(createSpan(
            "central-d3p",
            "resultado-texto",
            `f'(${formatearNumero(data.x_evaluar)}) ≈ ${formatearNumero(data.resultado)}   (h = ${formatearNumero(data.h)})`
        ));
        div.appendChild(cardDeriv);
    }

    const headers = ["#", "Formula / Nodo", "x", "y", "f'(x)", "Error"];
    const tabla = createGenericTable(
        "tabla-d3p",
        "tabla-iteraciones",
        headers,
        data.tabla,
        (valor, indiceCol) => {
            if (indiceCol === 0 || indiceCol === 1 || indiceCol === 5) return valor;
            return formatearNumero(valor);
        }
    );
    div.appendChild(tabla);

    if (data.notas && data.notas.length) {
        const notasDiv = createDiv("notas-d3p", "resultado-texto");
        data.notas.forEach((linea) => {
            notasDiv.appendChild(createSpan("", "", linea));
            notasDiv.appendChild(document.createElement("br"));
        });
        div.appendChild(notasDiv);
    }

    section.appendChild(div);
    article.appendChild(section);

    if (data.modo === "puntos" && Array.isArray(data.coeficientes) && Array.isArray(data.puntos)) {
        const sectionGrafica = createChartCanvas(
            "grafica-section-d3p",
            "derivacion3PuntosChart",
            "Gráfica del Polinomio P2(x)"
        );
        article.appendChild(sectionGrafica);

        renderizarGraficaMultiplesPolinomios(
            "derivacion3PuntosChart",
            [data.coeficientes],
            [data.puntos]
        );
    } else {
        graficarFuncion3Puntos(data, exprFunc);
    }
}