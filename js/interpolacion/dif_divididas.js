import {
    createSection,
    createLabel,
    createInput,
    createButton,
    createDiv,
    createSpan,
    createGenericTable,
    createPolynomial,
    createChartCanvas
} from "../factories.js";
import { mostrarError, formatearNumero, evaluarPolinomio, renderizarGrafica } from "../auxiliares.js";
import { conectApi } from "../conection.js";

export function diferencias_divididas_init() {
    const article = document.querySelector("article");
    article.innerHTML = "";

    const sectionInput = createSection("main-section-difdiv", "main-section-difdiv");
    const inputDiv = createDiv("input-section-difdiv", "inputs-div");

    const titleH2 = document.createElement("h2");
    titleH2.textContent = "Diferencias Divididas de Newton";

    const labelPuntos = createLabel(
        "label-puntos-difdiv",
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
        "label-evaluar-difdiv",
        "label-input",
        "input-evaluar-difdiv",
        "Evaluar el polinomio en x (opcional):"
    );

    const inputEvaluar = createInput(
        "input-evaluar-difdiv",
        "input-number",
        "number",
        "Ej: 3"
    );
    inputEvaluar.step = "any";

    const errorMensaje = createSpan("error-difdiv", "error-message", "");
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

        const respuesta = await conectApi(body, "diferencias_divididas");
        if (!respuesta) {
            mostrarError(errorMensaje, "No se pudo conectar con el servidor.");
            return;
        }

        diferencias_divididas_result(respuesta, puntos);
    });
}

function renderizarGraficaDifDiv(idCanvas, coeficientes, puntosOriginales, puntoEvaluado) {
    const datasets = [];

    if (Array.isArray(coeficientes) && coeficientes.length > 0 && Array.isArray(puntosOriginales) && puntosOriginales.length > 0) {
        const xs = puntosOriginales.map(p => p[0]);
        if (puntoEvaluado && isFinite(puntoEvaluado.x)) {
            xs.push(puntoEvaluado.x);
        }

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const pasos = 100;
        const paso = maxX !== minX ? (maxX - minX) / pasos : 1;

        const puntosCurva = [];
        for (let i = 0; i <= pasos; i++) {
            const x = minX + i * paso;
            puntosCurva.push({
                x: x,
                y: evaluarPolinomio(coeficientes, x)
            });
        }

        datasets.push({
            label: "Polinomio P(x)",
            data: puntosCurva,
            type: "line",
            borderColor: "#3b82f6",
            borderWidth: 2,
            fill: false,
            pointRadius: 0
        });
    }

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

export function diferencias_divididas_result(data, puntosIngresados = []) {
    const article = document.querySelector("article");

    const anteriorRes = document.getElementById("result-section-difdiv");
    if (anteriorRes) anteriorRes.remove();

    const anteriorGraf = document.getElementById("grafica-section-difdiv");
    if (anteriorGraf) anteriorGraf.remove();

    const sectionResult = createSection("result-section-difdiv", "main-section-difdiv");
    sectionResult.className = "main-section-difdiv section-resultados";

    const resultDiv = createDiv("result-div-difdiv", "inputs-div container-res");

    const titleH2 = document.createElement("h2");
    titleH2.textContent = "Resultados de Diferencias Divididas";
    resultDiv.appendChild(titleH2);

    if (!data.coeficientes || data.coeficientes.length === 0) {
        resultDiv.appendChild(
            createSpan(
                "aviso-difdiv",
                "error-message",
                data.mensaje || "No se pudo construir el polinomio."
            )
        );
        sectionResult.appendChild(resultDiv);
        article.appendChild(sectionResult);
        return;
    }

    const cardInfo = createDiv("", "resultado-card");
    cardInfo.appendChild(
        createSpan(
            "grado-difdiv",
            "resultado-texto",
            "Grado del polinomio: " + data.grado
        )
    );

    if (data.evaluacion) {
        cardInfo.appendChild(
            createSpan(
                "evaluacion-difdiv",
                "resultado-texto",
                `Evaluación -> P(${formatearNumero(data.evaluacion.x)}) = ${formatearNumero(data.evaluacion.y)}`
            )
        );
    }
    resultDiv.appendChild(cardInfo);

    if (Array.isArray(data.tabla) && data.tabla.length > 0) {
        const headers = ["i", "x(i)", "y(i)"];
        const numNiveles = data.tabla[0].length - 3;
        for (let k = 1; k <= numNiveles; k++) {
            headers.push(`Dif ${k}`);
        }

        const tabla = createGenericTable(
            "tabla-difdiv",
            "tabla-iteraciones",
            headers,
            data.tabla,
            (valor, indiceCol) => {
                if (valor === null || valor === undefined) return "";
                if (indiceCol === 0) return valor;
                return formatearNumero(valor);
            }
        );
        resultDiv.appendChild(tabla);
    }

    const cardPolinomio = createDiv("", "resultado-card");
    const filaPoly = createDiv("", "polynomial-container");
    filaPoly.appendChild(createSpan("", "poly-variable", "P(x) = "));
    filaPoly.appendChild(createPolynomial("polinomio-difdiv", "resultado-polinomio", data.coeficientes));
    cardPolinomio.appendChild(filaPoly);
    resultDiv.appendChild(cardPolinomio);

    sectionResult.appendChild(resultDiv);
    article.appendChild(sectionResult);

    const sectionGrafica = createChartCanvas(
        "grafica-section-difdiv",
        "difDivChart",
        "Gráfica del Polinomio"
    );
    article.appendChild(sectionGrafica);

    const puntoEvaluado = data.evaluacion && isFinite(Number(data.evaluacion.x)) && isFinite(Number(data.evaluacion.y))
        ? { x: Number(data.evaluacion.x), y: Number(data.evaluacion.y) }
        : null;

    renderizarGraficaDifDiv("difDivChart", data.coeficientes, puntosIngresados, puntoEvaluado);
}