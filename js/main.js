// ==============================
// MENU MOBILE
// ==============================
function toggleMenu() {
    const menu = document.getElementById("menu");
    if (menu) menu.classList.toggle("active");
}

// ==============================
// TDEE
// ==============================
function calcularTDEE() {
    let peso = parseFloat(document.getElementById("peso").value);
    let altura = parseFloat(document.getElementById("altura").value);
    let idade = parseInt(document.getElementById("idade").value);
    let sexo = document.getElementById("sexo").value;
    let atividade = parseFloat(document.getElementById("atividade").value);

    if (!peso || !altura || !idade || !atividade) {
        document.getElementById("resultado").innerText =
            "Preencha todos os campos corretamente!";
        return;
    }

    let tmb = (sexo === "masculino")
        ? (10 * peso) + (6.25 * altura) - (5 * idade) + 5
        : (10 * peso) + (6.25 * altura) - (5 * idade) - 161;

    let tdee = tmb * atividade;

    let cutting = tdee - 500;
    let bulking = tdee + 500;

    let classificacao = "";
    let dica = "";

    if (tdee < 2000) {
        classificacao = "Baixo gasto calórico";
        dica = "Ideal manter controle na dieta.";
    } else if (tdee < 2800) {
        classificacao = "Gasto moderado";
        dica = "Pequenos ajustes já trazem bons resultados.";
    } else {
        classificacao = "Alto gasto calórico";
        dica = "Ótimo para bulking ou recomposição.";
    }

    // salvar
    localStorage.setItem("tdee", tdee);
    localStorage.setItem("peso", peso);
    localStorage.setItem("altura", altura);
    localStorage.setItem("idade", idade);
    localStorage.setItem("sexo", sexo);
    localStorage.setItem("atividade", atividade);

    let resultado = document.getElementById("resultado");

    resultado.innerHTML = `
        🔥 TDEE: <strong>${Math.round(tdee)} kcal</strong><br>
        TMB: ${Math.round(tmb)} kcal<br><br>

        <strong>${classificacao}</strong><br>
        <span style="color:#9ca3af">${dica}</span>

        <hr style="margin:15px 0;">

        🔻 Cutting: ${Math.round(cutting)} kcal 
        <a href="macronutrientes.html" onclick="setObjetivo('cutting')">(usar)</a><br>

        ⚖️ Manutenção: ${Math.round(tdee)} kcal 
        <a href="macronutrientes.html" onclick="setObjetivo('manutencao')">(usar)</a><br>

        🔺 Bulking: ${Math.round(bulking)} kcal 
        <a href="macronutrientes.html" onclick="setObjetivo('bulking')">(usar)</a>
    `;
}

// ==============================
// OBJETIVO
// ==============================
function setObjetivo(tipo) {
    localStorage.setItem("objetivo", tipo);
}

// ==============================
// CUTTING
// ==============================
function calcularCutting() {
    let tdee = parseFloat(localStorage.getItem("tdee"));
    let deficit = parseFloat(document.getElementById("deficit").value);

    if (!tdee) {
        document.getElementById("resultado").innerText =
            "Calcule seu TDEE primeiro!";
        return;
    }

    let calorias = tdee - deficit;

    document.getElementById("resultado").innerHTML =
        `🔻 Calorias para Cutting: <strong>${Math.round(calorias)} kcal</strong>`;
}

// ==============================
// BULKING
// ==============================
function calcularBulking() {
    let tdee = parseFloat(localStorage.getItem("tdee"));
    let superavit = parseFloat(document.getElementById("superavit").value);

    if (!tdee) {
        document.getElementById("resultado").innerText =
            "Calcule seu TDEE primeiro!";
        return;
    }

    let calorias = tdee + superavit;

    document.getElementById("resultado").innerHTML =
        `🔺 Calorias para Bulking: <strong>${Math.round(calorias)} kcal</strong>`;
}

// ==============================
// MACROS
// ==============================
function calcularMacros() {
    let tdee = parseFloat(localStorage.getItem("tdee"));
    let peso = parseFloat(localStorage.getItem("peso"));

    if (!tdee || !peso) {
        document.getElementById("resultado").innerText =
            "Calcule seu TDEE primeiro!";
        return;
    }

    let objetivo = document.getElementById("objetivo").value;
    let intensidade = document.getElementById("intensidade")?.value;

    let calorias = tdee;
    let ajuste = 0;

    if (objetivo === "cutting") {
        if (intensidade === "leve") ajuste = -250;
        if (intensidade === "moderado") ajuste = -500;
        if (intensidade === "agressivo") ajuste = -750;
    }

    if (objetivo === "bulking") {
        if (intensidade === "leve") ajuste = 250;
        if (intensidade === "moderado") ajuste = 500;
        if (intensidade === "agressivo") ajuste = 750;
    }

    calorias += ajuste;

    let proteina = peso * (objetivo === "cutting" ? 2 : 1.8);
    let gordura = peso * (objetivo === "bulking" ? 1 : 0.8);
    let carbo = (calorias - (proteina * 4 + gordura * 9)) / 4;

    carbo = Math.max(0, carbo);

    let estimativa = "";

    if (ajuste !== 0) {
        let kg = (Math.abs(ajuste) * 7) / 7700;
        estimativa = objetivo === "cutting"
            ? `Perda estimada: ${kg.toFixed(2)} kg/semana`
            : `Ganho estimado: ${kg.toFixed(2)} kg/semana`;
    } else {
        estimativa = "Manutenção de peso";
    }

    // ==========================
    // RESULTADO TEXTO
    // ==========================
    document.getElementById("resultado").innerHTML = `
        🔥 Calorias: ${Math.round(calorias)} kcal <br><br>
        🥩 Proteína: ${Math.round(proteina)}g <br>
        🥑 Gordura: ${Math.round(gordura)}g <br>
        🍞 Carboidratos: ${Math.round(carbo)}g <br><br>
        <span style="color:#9ca3af">${estimativa}</span>
    `;

    // ==========================
    // GRÁFICO
    // ==========================
    const canvas = document.getElementById("graficoMacros");

    if (!canvas) return;

    // destruir gráfico anterior
    if (window.grafico) {
        window.grafico.destroy();
    }

    const totalMacros = proteina + carbo + gordura;

    const ctx = canvas.getContext("2d");

    window.grafico = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Proteína", "Carboidrato", "Gordura"],
            datasets: [{
                data: [proteina, carbo, gordura],
                backgroundColor: [
                    "#3b82f6",
                    "#22c55e",
                    "#eab308"
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: {
                duration: 800,
                easing: "easeOutQuart"
            },
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#e5e7eb",
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let value = context.raw;
                            let percent = ((value / totalMacros) * 100).toFixed(1);

                            return `${context.label}: ${Math.round(value)}g (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ==============================
// ATUALIZAÇÃO GLOBAL AO CARREGAR
// ==============================
document.addEventListener("DOMContentLoaded", function () {

    let tdee = localStorage.getItem("tdee");
    let objetivoSalvo = localStorage.getItem("objetivo");

    // preencher TDEE nas páginas
    let tdeeEl = document.getElementById("tdee");
    if (tdeeEl && tdee) {
        tdeeEl.innerText = Math.round(tdee) + " kcal";
    }

    let tdeeMacro = document.getElementById("tdee-macro");
    if (tdeeMacro && tdee) {
        tdeeMacro.innerText = Math.round(tdee);
    }

    // auto selecionar objetivo na página de macros
    let objetivoSelect = document.getElementById("objetivo");
    if (objetivoSelect && objetivoSalvo) {
        objetivoSelect.value = objetivoSalvo;
    }

    // mostrar intensidade corretamente
    function atualizarIntensidade() {
        let container = document.getElementById("intensidade-container");
        if (!container || !objetivoSelect) return;

        container.style.display =
            (objetivoSelect.value === "cutting" || objetivoSelect.value === "bulking")
                ? "block"
                : "none";
    }

    if (objetivoSelect) {
        objetivoSelect.addEventListener("change", atualizarIntensidade);
        atualizarIntensidade();
    }
});