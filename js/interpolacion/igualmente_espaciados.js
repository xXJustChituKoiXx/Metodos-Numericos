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

export function igualmente_espaciados_init() {
    const article = document.querySelector("article");
    article.innerHTML = "";

    const sectionInput = createSection("main-section-igesp", "main-section-igesp");
    const inputDiv = createDiv("input-section-igesp", "inputs-div");

    const h2 = document.createElement("h2");
    h2.textContent = "Metodo de puntos igualmente espaciados (Newton hacia adelante)";

    const labelPuntos = createLabel(
        "label-puntos-igesp",
        "label-input",
        "",
        "Ingrese los puntos igualmente espaciados (x, y):"
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

    const labelX = createLabel(
        "label-x-igesp",
        "label-input",
        "input-x-igesp",
        "x a evaluar (opcional):"
    );

    const inputX = createInput(
        "input-x-igesp",
        "input-number",
        "number",
        "Ej: 0.5"
    );
    inputX.step = "any";

    const errorMensaje = createSpan("error-igesp", "error-message", "");
    errorMensaje.style.display = "none";

    const buttonSend = createButton("send-button", "Calcular");

    inputDiv.appendChild(h2);
    inputDiv.appendChild(labelPuntos);
    inputDiv.appendChild(contenedorPuntos);
    inputDiv.appendChild(btnAgregar);
    inputDiv.appendChild(labelX);
    inputDiv.appendChild(inputX);
    inputDiv.appendChild(errorMensaje);
    inputDiv.appendChild(buttonSend);

    sectionInput.appendChild(inputDiv);
    article.appendChild(sectionInput);

    buttonSend.addEventListener("click", async () => {
        errorMensaje.style.display = "none";

        const filas = contenedorPuntos.querySelectorAll(".fila-punto");
        const puntosArray = [];
        const yVals = [];
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
            puntosArray.push([x, y]);
            yVals.push(y);
        }

        if (puntosArray.length < 2) {
            mostrarError(errorMensaje, "Debe ingresar al menos dos puntos.");
            return;
        }

        const x0 = puntosArray[0][0];
        const h = puntosArray[1][0] - puntosArray[0][0];

        if (Math.abs(h) < 1e-12) {
            mostrarError(errorMensaje, "El espaciamiento h no puede ser cero.");
            return;
        }

        for (let i = 1; i < puntosArray.length - 1; i++) {
            const pasoActual = puntosArray[i + 1][0] - puntosArray[i][0];
            if (Math.abs(pasoActual - h) > 1e-6) {
                mostrarError(
                    errorMensaje,
                    "Los valores de x deben estar igualmente espaciados."
                );
                return;
            }
        }

        const xEvalStr = inputX.value.trim();
        let xEvaluar = null;
        if (xEvalStr !== "") {
            if (!isFinite(Number(xEvalStr))) {
                mostrarError(errorMensaje, "Ingrese un valor válido de x a evaluar.");
                return;
            }
            xEvaluar = Number(xEvalStr);
        }

        const body = JSON.stringify({
            x0: x0,
            h: h,
            y_vals: yVals.join(", "),
            x_evaluar: xEvaluar
        });

        const respuesta = await conectApi(body, "igualmente_espaciados");
        if (!respuesta) {
            mostrarError(errorMensaje, "No se pudo conectar con el servidor.");
            return;
        }

        igualmente_espaciados_result(respuesta, puntosArray, xEvaluar, x0, h);
    });
}

function renderizarGraficaIgEsp(idCanvas, coeficientes, puntosOriginales, puntoEvaluado) {
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

function igualmente_espaciados_result(data, puntosIngresados = [], xEvaluar = null, x0 = null, h = null) {
    const article = document.querySelector("article");

    const anteriorRes = document.getElementById("result-section-igesp");
    if (anteriorRes) anteriorRes.remove();

    const anteriorGraf = document.getElementById("grafica-section-igesp");
    if (anteriorGraf) anteriorGraf.remove();

    const section = createSection("result-section-igesp", "main-section-igesp");
    section.className = "main-section-igesp section-resultados";

    const div = createDiv("result-div-igesp", "inputs-div container-res");

    const h2 = document.createElement("h2");
    h2.textContent = "Resultados";
    div.appendChild(h2);

    const tieneCoeficientes = Array.isArray(data.coeficientes) && data.coeficientes.length > 0;
    const tieneResultado = data.resultado !== null && data.resultado !== undefined;

    if (!tieneCoeficientes && !tieneResultado) {
        div.appendChild(
            createSpan(
                "aviso-igesp",
                "error-message",
                data.mensaje || "No se pudo interpolar."
            )
        );
        section.appendChild(div);
        article.appendChild(section);
        return;
    }

    const xEvalNum = data.x_evaluar !== undefined && data.x_evaluar !== null
        ? Number(data.x_evaluar)
        : (xEvaluar !== null ? Number(xEvaluar) : NaN);
    const yEvalNum = data.evaluacion && data.evaluacion.y !== undefined && data.evaluacion.y !== null
        ? Number(data.evaluacion.y)
        : (tieneResultado ? Number(data.resultado) : NaN);

    const cardResultado = createDiv("", "resultado-card");
    const labelRes = createLabel("", "", "", "Parámetros y Evaluación:");
    cardResultado.appendChild(labelRes);

    if (tieneResultado && isFinite(xEvalNum)) {
        cardResultado.appendChild(
            createSpan(
                "raiz-igesp",
                "resultado-texto",
                `P(${formatearNumero(xEvalNum)}) = ${formatearNumero(data.resultado)}`
            )
        );
    }

    if (x0 !== null && h !== null) {
        cardResultado.appendChild(
            createSpan(
                "params-igesp",
                "resultado-texto",
                `x0 = ${formatearNumero(x0)} | h = ${formatearNumero(h)}`
            )
        );
    }

    if (data.mensaje) {
        cardResultado.appendChild(createSpan("msg-igesp", "resultado-texto", data.mensaje));
    }

    div.appendChild(cardResultado);

    if (data.tabla && data.tabla.length > 0) {
        const headers = ["Diferencias"];
        for (let j = 0; j < data.n; j++) headers.push(`Pos ${j}`);

        const tabla = createGenericTable(
            "tabla-igesp",
            "tabla-iteraciones",
            headers,
            data.tabla,
            (valor, indiceCol) => {
                if (valor === null || valor === undefined) return "";
                if (indiceCol === 0) return valor;
                return formatearNumero(valor);
            }
        );
        div.appendChild(tabla);
    }

    if (tieneCoeficientes) {
        const cardPolinomio = createDiv("", "resultado-card");
        const filaPoly = createDiv("", "polynomial-container");
        filaPoly.appendChild(createSpan("", "poly-variable", "P(x) = "));
        filaPoly.appendChild(createPolynomial("polinomio-igesp", "resultado-polinomio", data.coeficientes));
        cardPolinomio.appendChild(filaPoly);
        div.appendChild(cardPolinomio);
    }

    section.appendChild(div);
    article.appendChild(section);

    const sectionGrafica = createChartCanvas(
        "grafica-section-igesp",
        "igespChart",
        "Gráfica de Interpolación"
    );
    article.appendChild(sectionGrafica);

    const puntoEvaluado = isFinite(xEvalNum) && isFinite(yEvalNum)
        ? { x: xEvalNum, y: yEvalNum }
        : null;

    renderizarGraficaIgEsp("igespChart", data.coeficientes, puntosIngresados, puntoEvaluado);
}