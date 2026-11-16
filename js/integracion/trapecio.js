import {
    createSection, createLabel, createInput, createButton,
    createDiv, createSpan, createGenericTable
} from "../factories.js";
import { mostrarError, formatearNumero } from "../auxiliares.js";
import { conectApi } from "../conection.js";

export function trapecio_init() {
    const article = document.querySelector("article");

    const sectionInput = createSection("main-section-trap", "main-section-trap");
    const inputDiv = createDiv("input-section-trap", "inputs-div");

    const h2 = document.createElement("h2");
    h2.textContent = "Regla del trapecio (simple y compuesto).";

    const lF = createLabel("label-f-trap", "label-input", "input-f-trap", "Funcion f(x):");
    const iF = createInput("input-f-trap", "input-text", "text", "Ej: math.exp(x)");

    const lA = createLabel("label-a-trap", "label-input", "input-a-trap", "a:");
    const iA = createInput("input-a-trap", "input-number", "number", "Ej: 0");

    const lB = createLabel("label-b-trap", "label-input", "input-b-trap", "b:");
    const iB = createInput("input-b-trap", "input-number", "number", "Ej: 1");

    const lN = createLabel("label-n-trap", "label-input", "input-n-trap",
        "n (1 = simple, >1 = compuesto):");
    const iN = createInput("input-n-trap", "input-number", "number", "Ej: 4");

    iN.min = 1; iN.step = 1; iN.value = "4";

    const errorMensaje = createSpan("error-trap", "error-message", "");
    errorMensaje.style.display = "none";

    const buttonSend = createButton("send-button", "Calcular");

    inputDiv.appendChild(h2);
    inputDiv.appendChild(lF); inputDiv.appendChild(iF);
    inputDiv.appendChild(lA); inputDiv.appendChild(iA);
    inputDiv.appendChild(lB); inputDiv.appendChild(iB);
    inputDiv.appendChild(lN); inputDiv.appendChild(iN);
    inputDiv.appendChild(errorMensaje);
    inputDiv.appendChild(buttonSend);

    sectionInput.appendChild(inputDiv);
    article.appendChild(sectionInput);

    buttonSend.addEventListener("click", async () => {
        const f = iF.value.trim();
        const a = iA.value, b = iB.value, n = iN.value;
        if (f === "" || a === "" || b === "" || n === "") {
            mostrarError(errorMensaje, "Complete todos los campos."); return;
        }
        if (Number(n) < 1) {
            mostrarError(errorMensaje, "n debe ser >= 1."); return;
        }
        errorMensaje.style.display = "none";

        const body = JSON.stringify({
            function: f,
            a: Number(a), b: Number(b), n: Number(n)
        });
        const respuesta = await conectApi(body, "trapecio");
        if (!respuesta) {
            mostrarError(errorMensaje, "No se pudo conectar con el servidor.");
            return;
        }
        trapecio_result(respuesta);
    });
}

function trapecio_result(data) {
    const article = document.querySelector("article");
    const anterior = document.getElementById("result-section-trap");
    if (anterior) anterior.remove();

    const section = createSection("result-section-trap", "main-section-trap");
    const div = createDiv("result-div-trap", "inputs-div");

    const h2 = document.createElement("h2");
    h2.textContent = "Resultados";
    div.appendChild(h2);

    if (data.resultado === null || data.resultado === undefined) {
        div.appendChild(createSpan("aviso-trap", "error-message",
            data.mensaje || "No se pudo integrar."));
        section.appendChild(div);
        article.appendChild(section);
        return;
    }

    div.appendChild(createSpan("res-trap", "resultado-texto",
        "Integral ≈ " + formatearNumero(data.resultado)));
    if (data.mensaje) {
        const msgSpan = createSpan("msg-d2p", "resultado-texto", data.mensaje);
        msgSpan.style.marginLeft = "8px";   // ← separa visualmente
        div.appendChild(msgSpan);
    }

    if (data.tabla && data.tabla.length > 0) {
        const headers = ["i", "x_i", "f(x_i)", "Coeficiente", "Coef·f(x_i)"];
        const tabla = createGenericTable(
            "tabla-trap", "tabla-iteraciones",
            headers, data.tabla,
            (valor, indiceCol) => {
                if (indiceCol === 0 || indiceCol === 3) return valor;
                return formatearNumero(valor);
            }
        );
        div.appendChild(tabla);
    }

    section.appendChild(div);
    article.appendChild(section);
}