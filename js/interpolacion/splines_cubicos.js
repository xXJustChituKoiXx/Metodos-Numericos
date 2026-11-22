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
    createSubscript,
    renderizarGraficaMultiplesPolinomios
} from "../factories.js";
import { mostrarError, formatearNumero, evaluarPolinomio, renderizarGrafica } from "../auxiliares.js";
import { conectApi } from "../conection.js";

function crearTextoConSubindice(base, subindice, sufijo = "") {
    const span = createSpan("", "", base);
    span.appendChild(createSubscript(subindice));
    if (sufijo) {
        span.appendChild(createSpan("", "", sufijo));
    }
    return span;
}

export function splines_init() {
    const article = document.querySelector("article");
    article.innerHTML = "";

    const sectionInput = createSection("main-section-splines", "main-section-splines");
    const inputDiv = createDiv("input-section-splines", "inputs-div");

    const titleH2 = document.createElement("h2");
    titleH2.textContent = "Spline Cúbico Natural";

    const labelPuntos = createLabel(
        "label-puntos-splines",
        "label-input",
        "",
        "Ingrese los puntos (x, y):"
    );

    const contenedorPuntos = createDiv("contenedor-filas-puntos", "contenedor-filas");
    contenedorPuntos.className = "contenedor-filas";

    const btnAgregar = createButton("btn-agregar-punto", "+ Agregar Punto");
    btnAgregar.className = "send-button btn-azul";
    btnAgregar.type = "button";

    function actualizarBotonesEliminar() {
        const filas = contenedorPuntos.querySelectorAll(".fila-punto");
        filas.forEach((fila, index) => {
            const btnEliminar = fila.querySelector(".btn-eliminar-fila");
            if (btnEliminar) {
                if (filas.length > 2 && index >= 2) {
                    btnEliminar.style.display = "inline-block";
                } else {
                    btnEliminar.style.display = "none";
                }
            }
        });
    }

    function agregarFilaPuntos(valX = "", valY = "") {
        const filaDiv = createDiv("", "fila-punto");
        filaDiv.className = "fila-punto";

        const inputX = createInput("", "input-text", "number", "Valor X");
        inputX.value = valX;
        inputX.step = "any";

        const inputY = createInput("", "input-text", "number", "Valor Y");
        inputY.value = valY;
        inputY.step = "any";

        const btnEliminar = createButton("btn-eliminar-fila", "X");
        btnEliminar.className = "btn-eliminar-fila btn-azul-eliminar";
        btnEliminar.type = "button";

        btnEliminar.addEventListener("click", () => {
            if (contenedorPuntos.children.length > 2) {
                filaDiv.remove();
                actualizarBotonesEliminar();
            }
        });

        filaDiv.appendChild(inputX);
        filaDiv.appendChild(inputY);
        filaDiv.appendChild(btnEliminar);
        contenedorPuntos.appendChild(filaDiv);
        actualizarBotonesEliminar();
    }

    agregarFilaPuntos();
    agregarFilaPuntos();

    btnAgregar.addEventListener("click", () => {
        agregarFilaPuntos();
    });

    const labelEvaluar = createLabel(
        "label-evaluar-splines",
        "label-input",
        "input-evaluar-splines",
        "Evaluar el spline en x (opcional):"
    );

    const inputEvaluar = createInput(
        "input-evaluar-splines",
        "input-number",
        "number",
        "Ej: 1.5"
    );
    inputEvaluar.step = "any";

    const errorMensaje = createSpan(
        "error-splines",
        "error-message",
        ""
    );
    errorMensaje.style.display = "none";

    const buttonSend = createButton("send-button", "Calcular");

    inputDiv.appendChild(titleH2);
    inputDiv.appendChild(labelPuntos);
    inputDiv.appendChild(contenedorPuntos);
    inputDiv.appendChild(btnAgregar);
    inputDiv.appendChild(labelEvaluar);
    inputDiv.appendChild(inputEvaluar);
    inputDiv.appendChild(errorMensaje);
    inputDiv.appendChild(buttonSend);

    sectionInput.appendChild(inputDiv);
    article.appendChild(sectionInput);

    buttonSend.addEventListener("click", async () => {
        errorMensaje.style.display = "none";
        const xEvalStr = inputEvaluar.value.trim();

        const filas = contenedorPuntos.querySelectorAll(".fila-punto");
        const puntos = [];
        const vistas = [];

        for (const fila of filas) {
            const inputs = fila.querySelectorAll("input");
            const valX = inputs[0].value.trim();
            const valY = inputs[1].value.trim();

            if (valX === "" || valY === "") {
                mostrarError(errorMensaje, "Complete todos los campos de x e y.");
                return;
            }

            const x = Number(valX);
            const y = Number(valY);

            if (!isFinite(x) || !isFinite(y)) {
                mostrarError(errorMensaje, "Los valores deben ser números válidos.");
                return;
            }

            if (vistas.includes(x)) {
                mostrarError(errorMensaje, `La x = ${x} está repetida. Cada x debe ser única.`);
                return;
            }

            vistas.push(x);
            puntos.push([x, y]);
        }

        if (puntos.length < 2) {
            mostrarError(errorMensaje, "Debe ingresar al menos dos puntos.");
            return;
        }

        let xEvaluar = null;
        if (xEvalStr !== "") {
            if (!isFinite(Number(xEvalStr))) {
                mostrarError(errorMensaje, "El valor de x a evaluar debe ser un número válido.");
                return;
            }
            xEvaluar = Number(xEvalStr);
        }

        const body = JSON.stringify({
            puntos: puntos,
            x_evaluar: xEvaluar
        });

        const respuesta = await conectApi(body, "splines");
        if (!respuesta) {
            mostrarError(errorMensaje, "No se pudo conectar con el servidor.");
            return;
        }

        splines_result(respuesta, puntos);
    });
}

function renderizarGraficaSplines(idCanvas, tramos, puntosOriginales, puntoEvaluado) {
    if (!Array.isArray(tramos) || tramos.length === 0) return;

    const listaPolinomios = tramos.map(t => t.coeficientes);
    const listaIntervalos = tramos.map(t => {
        const xIni = Number(t.intervalo[0]);
        const xFin = Number(t.intervalo[1]);
        const yIni = evaluarPolinomio(t.coeficientes, xIni);
        const yFin = evaluarPolinomio(t.coeficientes, xFin);
        return [
            [xIni, yIni],
            [xFin, yFin]
        ];
    });

    renderizarGraficaMultiplesPolinomios(idCanvas, listaPolinomios, listaIntervalos);

    const canvas = document.getElementById(idCanvas);
    if (!canvas || !(window[idCanvas + "Instance"] instanceof Chart)) return;

    const chart = window[idCanvas + "Instance"];
    const datasets = chart.data.datasets.filter(ds => ds.label !== "Puntos Originales");

    if (Array.isArray(puntosOriginales) && puntosOriginales.length > 0) {
        datasets.push({
            label: "Puntos Originales",
            data: puntosOriginales.map(p => ({ x: p[0], y: p[1] })),
            type: "scatter",
            backgroundColor: "#f57eb6",
            pointRadius: 6,
            pointHoverRadius: 8
        });
    }

    if (puntoEvaluado && isFinite(puntoEvaluado.x) && isFinite(puntoEvaluado.y)) {
        datasets.push({
            label: `Evaluado (${formatearNumero(puntoEvaluado.x)}, ${formatearNumero(puntoEvaluado.y)})`,
            data: [{ x: puntoEvaluado.x, y: puntoEvaluado.y }],
            type: "scatter",
            backgroundColor: "#4ade80",
            borderColor: "#ffffff",
            borderWidth: 1.5,
            pointRadius: 8,
            pointHoverRadius: 10
        });
    }

    renderizarGrafica(idCanvas, datasets);
}

export function splines_result(data, puntosIngresados = []) {
    const article = document.querySelector("article");

    const anteriorRes = document.getElementById("result-section-splines");
    if (anteriorRes) anteriorRes.remove();

    const anteriorGraf = document.getElementById("grafica-section-splines");
    if (anteriorGraf) anteriorGraf.remove();

    const sectionResult = createSection("result-section-splines", "main-section-splines");
    sectionResult.className = "main-section-splines section-resultados";

    const resultDiv = createDiv("result-div-splines", "inputs-div container-res");

    const titleH2 = document.createElement("h2");
    titleH2.textContent = "Resultados del Spline Cúbico";
    resultDiv.appendChild(titleH2);

    const tienePolinomios = Array.isArray(data.polinomios) && data.polinomios.length > 0;

    if (!tienePolinomios) {
        resultDiv.appendChild(
            createSpan(
                "aviso-splines",
                "error-message",
                data.mensaje || "No se pudieron calcular los splines."
            )
        );
        sectionResult.appendChild(resultDiv);
        article.appendChild(sectionResult);
        return;
    }

    const cardInfo = createDiv("", "resultado-card");
    cardInfo.appendChild(
        createSpan(
            "tramos-splines",
            "resultado-texto",
            "Número de tramos: " + data.n_tramos
        )
    );

    if (Array.isArray(data.momentos) && data.momentos.length > 0) {
        const momentosSpan = createSpan("momentos-splines", "resultado-texto", "");
        momentosSpan.appendChild(createSpan("", "", "Momentos "));
        momentosSpan.appendChild(crearTextoConSubindice("M", "i", ": ["));
        data.momentos.forEach((m, idx) => {
            momentosSpan.appendChild(createSpan("", "", formatearNumero(m)));
            if (idx < data.momentos.length - 1) {
                momentosSpan.appendChild(createSpan("", "", ", "));
            }
        });
        momentosSpan.appendChild(createSpan("", "", "]"));
        cardInfo.appendChild(momentosSpan);
    }

    if (data.evaluacion) {
        cardInfo.appendChild(
            createSpan(
                "evaluacion-splines",
                "resultado-texto",
                `Evaluación (Tramo ${data.evaluacion.tramo}) -> S(${formatearNumero(data.evaluacion.x)}) = ${formatearNumero(data.evaluacion.y)}`
            )
        );
    }
    resultDiv.appendChild(cardInfo);

    if (Array.isArray(data.tabla) && data.tabla.length > 0) {
        const encabezados = [
            "Tramo",
            crearTextoConSubindice("x", "i"),
            crearTextoConSubindice("x", "i+1"),
            crearTextoConSubindice("a", "i"),
            crearTextoConSubindice("b", "i"),
            crearTextoConSubindice("c", "i"),
            crearTextoConSubindice("d", "i"),
            crearTextoConSubindice("S", "i", "(x)")
        ];
        const tabla = createGenericTable(
            "tabla-splines",
            "tabla-iteraciones",
            encabezados,
            data.tabla,
            (valor, indiceCol) => {
                if (valor === null || valor === undefined) return "";
                if (indiceCol === 0) return valor;
                if (indiceCol === 7) {
                    return createPolynomial("", "poly-celda", valor);
                }
                return formatearNumero(valor);
            }
        );
        resultDiv.appendChild(tabla);
    }

    const cardPolinomios = createDiv("", "resultado-card");
    const labelPolys = createLabel("", "", "", "Polinomios por Tramo:");
    cardPolinomios.appendChild(labelPolys);

    data.polinomios.forEach((tramo) => {
        const filaPoly = createDiv("", "polynomial-container");
        const rangoStr = `[${formatearNumero(tramo.intervalo[0])}, ${formatearNumero(tramo.intervalo[1])}]`;
        filaPoly.appendChild(crearTextoConSubindice("S", String(tramo.tramo), `(x) en ${rangoStr} = `));
        filaPoly.appendChild(createPolynomial(`polinomio-splines-${tramo.tramo}`, "resultado-polinomio", tramo.coeficientes));
        cardPolinomios.appendChild(filaPoly);
    });

    resultDiv.appendChild(cardPolinomios);
    sectionResult.appendChild(resultDiv);
    article.appendChild(sectionResult);

    const sectionGrafica = createChartCanvas(
        "grafica-section-splines",
        "splinesChart",
        "Gráfica de Splines Cúbicos"
    );
    article.appendChild(sectionGrafica);

    const puntoEvaluado = data.evaluacion && isFinite(Number(data.evaluacion.x)) && isFinite(Number(data.evaluacion.y))
        ? { x: Number(data.evaluacion.x), y: Number(data.evaluacion.y) }
        : null;

    renderizarGraficaSplines("splinesChart", data.polinomios, puntosIngresados, puntoEvaluado);
}