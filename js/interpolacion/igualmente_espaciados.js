import {
    createSection, createLabel, createInput, createButton,
    createDiv, createSpan, createGenericTable
} from "../factories.js";
import { mostrarError, formatearNumero } from "../auxiliares.js";
import { conectApi } from "../conection.js";

export function igualmente_espaciados_init() {
    const article = document.querySelector("article");

    const sectionInput = createSection("main-section-igesp", "main-section-igesp");
    const inputDiv = createDiv("input-section-igesp", "inputs-div");

    const h2 = document.createElement("h2");
    h2.textContent = "Metodo de puntos igualmente espaciados (Newton hacia adelante).";

    const lX0 = createLabel("label-x0-igesp", "label-input",
        "input-x0-igesp", "Primer nodo x0:");
    const iX0 = createInput("input-x0-igesp", "input-number", "number", "Ej: 0.0");

    const lH = createLabel("label-h-igesp", "label-input",
        "input-h-igesp", "Espaciamiento h:");
    const iH = createInput("input-h-igesp", "input-number", "number", "Ej: 0.3");

    const lY = createLabel("label-y-igesp", "label-input",
        "input-y-igesp", "Valores y (separados por coma o espacio):");
    const iY = createInput("input-y-igesp", "input-text", "text",
        "Ej: 0, 0.2955, 0.5646, 0.7833");

    const lX = createLabel("label-x-igesp", "label-input",
        "input-x-igesp", "x a evaluar:");
    const iX = createInput("input-x-igesp", "input-number", "number", "Ej: 0.5");

    const errorMensaje = createSpan("error-igesp", "error-message", "");
    errorMensaje.style.display = "none";

    const buttonSend = createButton("send-button", "Calcular");

    inputDiv.appendChild(h2);
    inputDiv.appendChild(lX0); inputDiv.appendChild(iX0);
    inputDiv.appendChild(lH);  inputDiv.appendChild(iH);
    inputDiv.appendChild(lY);  inputDiv.appendChild(iY);
    inputDiv.appendChild(lX);  inputDiv.appendChild(iX);
    inputDiv.appendChild(errorMensaje);
    inputDiv.appendChild(buttonSend);

    sectionInput.appendChild(inputDiv);
    article.appendChild(sectionInput);

    buttonSend.addEventListener("click", async () => {
        const x0 = iX0.value, h = iH.value;
        const yv = iY.value.trim(), xEval = iX.value;

        if (x0 === "" || h === "" || yv === "" || xEval === "") {
            mostrarError(errorMensaje, "Complete todos los campos."); return;
        }
        errorMensaje.style.display = "none";

        const body = JSON.stringify({
            x0: Number(x0), h: Number(h),
            y_vals: yv,
            x_evaluar: Number(xEval)
        });
        const respuesta = await conectApi(body, "igualmente_espaciados");
        if (!respuesta) {
            mostrarError(errorMensaje, "No se pudo conectar con el servidor.");
            return;
        }
        igualmente_espaciados_result(respuesta);
    });
}

function igualmente_espaciados_result(data) {
    const article = document.querySelector("article");
    const anterior = document.getElementById("result-section-igesp");
    if (anterior) anterior.remove();

    const section = createSection("result-section-igesp", "main-section-igesp");
    const div = createDiv("result-div-igesp", "inputs-div");

    const h2 = document.createElement("h2");
    h2.textContent = "Resultados";
    div.appendChild(h2);

    if (data.resultado === null || data.resultado === undefined) {
        div.appendChild(createSpan("aviso-igesp", "error-message",
            data.mensaje || "No se pudo interpolar."));
        section.appendChild(div);
        article.appendChild(section);
        return;
    }

    div.appendChild(createSpan("raiz-igesp", "resultado-texto",
        "P(x) = " + formatearNumero(data.resultado)));
    if (data.mensaje) {
        div.appendChild(createSpan("msg-igesp", "resultado-texto", data.mensaje));
    }

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

    section.appendChild(div);
    article.appendChild(section);
}