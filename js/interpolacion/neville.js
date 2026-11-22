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

export function neville_init() {
    const article = document.querySelector("article");
    article.innerHTML = "";

    const sectionInput = createSection("main-section-neville", "main-section-neville");
    const inputDiv = createDiv("input-section-neville", "inputs-div");

    const titleH2 = document.createElement("h2");
    titleH2.textContent = "Metodo de Neville";

    const labelPuntos = createLabel(
        "label-puntos-neville",
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

    const labelX = createLabel(
        "label-x-neville",
        "label-input",
        "input-x-neville",
        "x a evaluar:"
    );

    const inputX = createInput(
        "input-x-neville",
        "input-number",
        "number",
        "Ej: 0.8"
    );
    inputX.step = "any";

    const errorMensaje = createSpan("error-neville", "error-message", "");
    errorMensaje.style.display = "none";

    const buttonSend = createButton("send-button", "Calcular");

    inputDiv.appendChild(titleH2);
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
        const puntosStrList = [];
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
            puntosStrList.push(`${x},${y}`);
        }

        if (puntosArray.length < 2) {
            mostrarError(errorMensaje, "Debe ingresar al menos dos puntos.");
            return;
        }

        const xEvalStr = inputX.value.trim();
        if (xEvalStr === "" || !isFinite(Number(xEvalStr))) {
            mostrarError(errorMensaje, "Ingrese un valor válido de x a evaluar.");
            return;
        }

        const xEvaluar = Number(xEvalStr);

        const body = JSON.stringify({
            puntos: puntosStrList.join("; "),
            x_evaluar: xEvaluar
        });

        const respuesta = await conectApi(body, "neville");
        if (!respuesta) {
            mostrarError(errorMensaje, "No se pudo conectar con el servidor.");
            return;
        }

        neville_result(respuesta, puntosArray, xEvaluar);
    });
}

function renderizarGraficaNeville(idCanvas, coeficientes, puntosOriginales, puntoEvaluado) {
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
            label: "Polinomio N(x)",
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

function neville_result(data, puntosIngresados = [], xEvaluar = null) {
    const article = document.querySelector("article");

    const anteriorRes = document.getElementById("result-section-neville");
    if (anteriorRes) anteriorRes.remove();

    const anteriorGraf = document.getElementById("grafica-section-neville");
    if (anteriorGraf) anteriorGraf.remove();

    const section = createSection("result-section-neville", "main-section-neville");
    section.className = "main-section-neville section-resultados";

    const div = createDiv("result-div-neville", "inputs-div container-res");

    const h2 = document.createElement("h2");
    h2.textContent = "Resultados de Neville";
    div.appendChild(h2);

    if (data.resultado === null || data.resultado === undefined) {
        div.appendChild(
            createSpan(
                "aviso-neville",
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
        : Number(xEvaluar);
    const yEvalNum = data.evaluacion && data.evaluacion.y !== undefined
        ? Number(data.evaluacion.y)
        : Number(data.resultado);

    const cardResultado = createDiv("", "resultado-card");
    const labelRes = createLabel("", "", "", "Valor Interpolado:");
    cardResultado.appendChild(labelRes);

    const textoEval = isFinite(xEvalNum)
        ? `N(${formatearNumero(xEvalNum)}) = ${formatearNumero(data.resultado)}`
        : `N(x) = ${formatearNumero(data.resultado)}`;

    cardResultado.appendChild(createSpan("raiz-neville", "resultado-texto", textoEval));

    if (data.mensaje) {
        cardResultado.appendChild(createSpan("msg-neville", "resultado-texto", data.mensaje));
    }

    div.appendChild(cardResultado);

    if (data.tabla && data.tabla.length > 0) {
        const headers = ["i"];
        for (let j = 0; j < data.n; j++) headers.push(`N[i][${j}]`);

        const tabla = createGenericTable(
            "tabla-neville",
            "tabla-iteraciones",
            headers,
            data.tabla,
            (valor, indiceCol) => {
                if (valor === null || valor === undefined) return "";
                return indiceCol === 0 ? valor : formatearNumero(valor);
            }
        );
        div.appendChild(tabla);
    }

    // Polinomio hasta abajo en formato N(x) = <polinomio>
    if (Array.isArray(data.coeficientes) && data.coeficientes.length > 0) {
        const cardPolinomio = createDiv("", "resultado-card");
        const filaPoly = createDiv("", "polynomial-container");
        filaPoly.appendChild(createSpan("", "poly-variable", "N(x) = "));
        filaPoly.appendChild(createPolynomial("polinomio-neville", "resultado-polinomio", data.coeficientes));
        cardPolinomio.appendChild(filaPoly);
        div.appendChild(cardPolinomio);
    }

    section.appendChild(div);
    article.appendChild(section);

    const sectionGrafica = createChartCanvas(
        "grafica-section-neville",
        "nevilleChart",
        "Gráfica de Interpolación"
    );
    article.appendChild(sectionGrafica);

    const puntoEvaluado = isFinite(xEvalNum) && isFinite(yEvalNum)
        ? { x: xEvalNum, y: yEvalNum }
        : null;

    renderizarGraficaNeville("nevilleChart", data.coeficientes, puntosIngresados, puntoEvaluado);
}