import {
    createSection, createLabel, createInput, createButton,
    createDiv, createSpan, createGenericTable
} from "../factories.js";
import { mostrarError, formatearNumero } from "../auxiliares.js";
import { conectApi } from "../conection.js";

export function derivacion_2puntos_init() {
    const article = document.querySelector("article");

    const sectionInput = createSection("main-section-d2p", "main-section-d2p");
    const inputDiv = createDiv("input-section-d2p", "inputs-div");

    const h2 = document.createElement("h2");
    h2.textContent = "Derivacion numerica: formula de 2 puntos.";

    const lF = createLabel("label-f-d2p", "label-input",
        "input-f-d2p", "Funcion f(x):");
    const iF = createInput("input-f-d2p", "input-text", "text", "Ej: math.exp(x)");

    const lX = createLabel("label-x-d2p", "label-input",
        "input-x-d2p", "Punto x:");
    const iX = createInput("input-x-d2p", "input-number", "number", "Ej: 1.0");

    const lH = createLabel("label-h-d2p", "label-input",
        "input-h-d2p", "Paso h:");
    const iH = createInput("input-h-d2p", "input-number", "number", "Ej: 0.01");

    iH.value = "0.01";

    const errorMensaje = createSpan("error-d2p", "error-message", "");
    errorMensaje.style.display = "none";

    const buttonSend = createButton("send-button", "Calcular");

    inputDiv.appendChild(h2);
    inputDiv.appendChild(lF); inputDiv.appendChild(iF);
    inputDiv.appendChild(lX); inputDiv.appendChild(iX);
    inputDiv.appendChild(lH); inputDiv.appendChild(iH);
    inputDiv.appendChild(errorMensaje);
    inputDiv.appendChild(buttonSend);

    sectionInput.appendChild(inputDiv);
    article.appendChild(sectionInput);

    buttonSend.addEventListener("click", async () => {
        const f = iF.value.trim(), x = iX.value, h = iH.value;
        if (f === "" || x === "" || h === "") {
            mostrarError(errorMensaje, "Complete todos los campos."); return;
        }
        if (Number(h) === 0) {
            mostrarError(errorMensaje, "h debe ser distinto de 0."); return;
        }
        errorMensaje.style.display = "none";

        const body = JSON.stringify({
            function: f, x: Number(x), h: Number(h)
        });
        const respuesta = await conectApi(body, "derivacion_2puntos");
        if (!respuesta) {
            mostrarError(errorMensaje, "No se pudo conectar con el servidor.");
            return;
        }
        derivacion_2puntos_result(respuesta);
    });
}

function derivacion_2puntos_result(data) {
    const article = document.querySelector("article");
    const anterior = document.getElementById("result-section-d2p");
    if (anterior) anterior.remove();

    const section = createSection("result-section-d2p", "main-section-d2p");
    const div = createDiv("result-div-d2p", "inputs-div");

    const h2 = document.createElement("h2");
    h2.textContent = "Resultados";
    div.appendChild(h2);

    if (data.tabla.length === 0) {
        div.appendChild(createSpan("aviso-d2p", "error-message",
            data.mensaje || "No se pudo calcular."));
        section.appendChild(div);
        article.appendChild(section);
        return;
    }

    div.appendChild(createSpan("central-d2p", "resultado-texto",
        "f'(x) ≈ " + formatearNumero(data.central) + "   (formula central)"));
    if (data.mensaje) {
        const msgSpan = createSpan("msg-d2p", "resultado-texto", data.mensaje);
        msgSpan.style.marginLeft = "8px";   // ← separa visualmente
        div.appendChild(msgSpan);
    }

    const headers = ["#", "Metodo", "f(x)", "f(x+h) / f(x-h)", "Aprox. f'(x)", "Error"];
    const tabla = createGenericTable(
        "tabla-d2p", "tabla-iteraciones",
        headers, data.tabla,
        (valor, indiceCol) => {
            if (indiceCol === 0 || indiceCol === 1 || indiceCol === 5) return valor;
            return formatearNumero(valor);
        }
    );
    div.appendChild(tabla);

    // Ecuaciones de Taylor
    if (data.taylor && data.taylor.length) {
        const taylorDiv = createDiv("taylor-d2p", "resultado-texto");
        data.taylor.forEach((linea) => {
            taylorDiv.appendChild(createSpan("", "", linea));
            taylorDiv.appendChild(document.createElement("br"));
        });
        div.appendChild(taylorDiv);
    }

    section.appendChild(div);
    article.appendChild(section);
}