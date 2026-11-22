import {
    createSection, createLabel, createInput, createButton,
    createDiv, createSpan, createGenericTable
} from "../factories.js";
import { mostrarError, formatearNumero } from "../auxiliares.js";
import { conectApi } from "../conection.js";

export function gaussiana_init() {
    const article = document.querySelector("article");

    const sectionInput = createSection("main-section-gauss", "main-section-gauss");
    const inputDiv = createDiv("input-section-gauss", "inputs-div");

    const h2 = document.createElement("h2");
    h2.textContent = "Cuadratura gaussiana (simple y compuesta).";

    const lF = createLabel("label-f-gauss", "label-input", "input-f-gauss", "Funcion f(x):");
    const iF = createInput("input-f-gauss", "input-text", "text", "Ej: math.sin(x)");

    const lA = createLabel("label-a-gauss", "label-input", "input-a-gauss", "a:");
    const iA = createInput("input-a-gauss", "input-number", "number", "Ej: 0");

    const lB = createLabel("label-b-gauss", "label-input", "input-b-gauss", "b:");
    const iB = createInput("input-b-gauss", "input-number", "number", "Ej: 3.1416");

    const lN = createLabel("label-n-gauss", "label-input", "input-n-gauss",
        "Nodos por subintervalo (2, 3 o 4):");
    const iN = createInput("input-n-gauss", "input-number", "number", "Ej: 2");
    iN.min = 2; iN.max = 4; iN.step = 1; iN.value = "2";

    const lM = createLabel("label-m-gauss", "label-input", "input-m-gauss",
        "Subintervalos m (1 = simple):");
    const iM = createInput("input-m-gauss", "input-number", "number", "Ej: 1");
    iM.min = 1; iM.step = 1; iM.value = "1";

    const errorMensaje = createSpan("error-gauss", "error-message", "");
    errorMensaje.style.display = "none";

    const buttonSend = createButton("send-button", "Calcular");

    inputDiv.appendChild(h2);
    inputDiv.appendChild(lF); inputDiv.appendChild(iF);
    inputDiv.appendChild(lA); inputDiv.appendChild(iA);
    inputDiv.appendChild(lB); inputDiv.appendChild(iB);
    inputDiv.appendChild(lN); inputDiv.appendChild(iN);
    inputDiv.appendChild(lM); inputDiv.appendChild(iM);
    inputDiv.appendChild(errorMensaje);
    inputDiv.appendChild(buttonSend);

    sectionInput.appendChild(inputDiv);
    article.appendChild(sectionInput);

    buttonSend.addEventListener("click", async () => {
        const f = iF.value.trim();
        const a = iA.value, b = iB.value, n = iN.value, m = iM.value;
        if (f === "" || a === "" || b === "" || n === "" || m === "") {
            mostrarError(errorMensaje, "Complete todos los campos."); return;
        }
        if (![2, 3, 4].includes(Number(n))) {
            mostrarError(errorMensaje, "n debe ser 2, 3 o 4."); return;
        }
        if (Number(m) < 1) {
            mostrarError(errorMensaje, "m debe ser >= 1."); return;
        }
        errorMensaje.style.display = "none";

        const body = JSON.stringify({
            function: f,
            a: Number(a), b: Number(b),
            n: Number(n), m: Number(m)
        });
        const respuesta = await conectApi(body, "gaussiana");
        if (!respuesta) {
            mostrarError(errorMensaje, "No se pudo conectar con el servidor.");
            return;
        }
        gaussiana_result(respuesta);
    });
}

function gaussiana_result(data) {
    const article = document.querySelector("article");
    const anterior = document.getElementById("result-section-gauss");
    if (anterior) anterior.remove();

    const section = createSection("result-section-gauss", "main-section-gauss");
    const div = createDiv("result-div-gauss", "inputs-div");

    const h2 = document.createElement("h2");
    h2.textContent = "Resultados";
    div.appendChild(h2);

    if (data.resultado === null || data.resultado === undefined) {
        div.appendChild(createSpan("aviso-gauss", "error-message",
            data.mensaje || "No se pudo integrar."));
        section.appendChild(div);
        article.appendChild(section);
        return;
    }

    div.appendChild(createSpan("res-gauss", "resultado-texto",
        "Integral ≈ " + formatearNumero(data.resultado)));
    if (data.mensaje) {
        const msgSpan = createSpan("msg-d2p", "resultado-texto", data.mensaje);
        msgSpan.style.marginLeft = "8px";   // ← separa visualmente
        div.appendChild(msgSpan);
    }

    if (data.tabla && data.tabla.length > 0) {
        const headers = ["Sub.", "Nodo", "t_i", "x_i", "w_i", "f(x_i)", "Contrib."];
        const tabla = createGenericTable(
            "tabla-gauss", "tabla-iteraciones",
            headers, data.tabla,
            (valor, indiceCol) => {
                if (indiceCol === 0 || indiceCol === 1) return valor;
                return formatearNumero(valor);
            }
        );
        div.appendChild(tabla);
    }

    section.appendChild(div);
    article.appendChild(section);
}