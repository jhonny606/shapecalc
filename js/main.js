// ==============================
// MENU MOBILE
// ==============================
function toggleMenu() {
    const menu = document.getElementById("menu");
    const logo = document.getElementById("logo");
    const button = document.querySelector(".menu-toggle");

    menu.classList.toggle("active");
    logo.classList.toggle("hidden");
    button.classList.toggle("active");
}

// Fechar menu ao clicar em link
document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll("nav a");
    navLinks.forEach(link => {
        link.addEventListener("click", function () {
            const menu = document.getElementById("menu");
            const logo = document.getElementById("logo");
            const button = document.querySelector(".menu-toggle");
            if (menu && menu.classList.contains("active")) {
                menu.classList.remove("active");
                logo && logo.classList.remove("hidden");
                button && button.classList.remove("active");
            }
        });
    });
});

// ==============================
// TDEE
// ==============================
function calcularTDEE() {
    let peso = parseFloat(document.getElementById("peso").value);
    let altura = parseFloat(document.getElementById("altura").value);
    let idade = parseInt(document.getElementById("idade").value);
    let sexo = document.getElementById("sexo").value;
    let atividade = parseFloat(document.getElementById("atividade").value);
    let bf = parseFloat(document.getElementById("bf")?.value);

    let resultado = document.getElementById("resultado");

    if (!peso || !altura || !idade || peso <= 0 || altura <= 0 || idade <= 0) {
        resultado.innerHTML = "<span style='color:var(--text-muted);font-size:0.9rem;'>Preencha todos os campos obrigatórios.</span>";
        return;
    }

    let tmb;

    if (!isNaN(bf) && bf > 0 && bf < 100) {
        let massaMagra = peso * (1 - bf / 100);
        tmb = 370 + (21.6 * massaMagra);
    } else {
        tmb = (sexo === "masculino")
            ? (10 * peso) + (6.25 * altura) - (5 * idade) + 5
            : (10 * peso) + (6.25 * altura) - (5 * idade) - 161;
    }

    let tdee = tmb * atividade;
    let cutting = tdee - 500;
    let bulking = tdee + 500;

    let classificacao = tdee < 2000 ? "Baixo gasto calórico"
        : tdee < 2800 ? "Gasto moderado"
        : "Alto gasto calórico";

    // Salvar
    localStorage.setItem("tdee", tdee);
    localStorage.setItem("peso", peso);
    localStorage.setItem("altura", altura);
    localStorage.setItem("idade", idade);
    localStorage.setItem("sexo", sexo);
    localStorage.setItem("atividade", atividade);
    if (bf) localStorage.setItem("bf", bf);

    resultado.innerHTML = `
        <strong>${Math.round(tdee)} kcal</strong>
        <span style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:var(--text-muted);font-family:'Barlow Condensed',sans-serif;">${classificacao}</span>

        <div style="margin-top:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);border-radius:6px;overflow:hidden;border:1px solid var(--border);">
            <div style="background:#0a0a0a;padding:16px;text-align:center;">
                <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.4rem;font-weight:900;color:#ff6b6b;">${Math.round(cutting)}</div>
                <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-top:2px;">Cutting <a href="macronutrientes.html" class="usar-link" onclick="setObjetivo('cutting')">usar</a></div>
            </div>
            <div style="background:#0a0a0a;padding:16px;text-align:center;border-left:1px solid var(--border);border-right:1px solid var(--border);">
                <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.4rem;font-weight:900;color:var(--accent);">${Math.round(tdee)}</div>
                <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-top:2px;">Manutenção <a href="macronutrientes.html" class="usar-link" onclick="setObjetivo('manutencao')">usar</a></div>
            </div>
            <div style="background:#0a0a0a;padding:16px;text-align:center;">
                <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.4rem;font-weight:900;color:#60a5fa;">${Math.round(bulking)}</div>
                <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-top:2px;">Bulking <a href="macronutrientes.html" class="usar-link" onclick="setObjetivo('bulking')">usar</a></div>
            </div>
        </div>

        <div style="margin-top:14px;font-size:0.8rem;color:var(--text-muted);">
            TMB: ${Math.round(tmb)} kcal ${bf ? `&nbsp;·&nbsp; Gordura corporal: ${bf}%` : ""}
        </div>
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
        document.getElementById("resultado").innerHTML = `
            <div class="alerta">
                <p>Calcule seu TDEE primeiro.</p>
                <a href="tdee-calculadora.html" class="btn-link">Calcular TDEE</a>
            </div>`;
        return;
    }

    let calorias = tdee - deficit;
    document.getElementById("resultado").innerHTML =
        `<strong>${Math.round(calorias)} kcal</strong>
        <span style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:var(--text-muted);font-family:'Barlow Condensed',sans-serif;">Calorias para Cutting</span>`;
}

// ==============================
// BULKING
// ==============================
function calcularBulking() {
    let tdee = parseFloat(localStorage.getItem("tdee"));
    let superavit = parseFloat(document.getElementById("superavit").value);

    if (!tdee) {
        document.getElementById("resultado").innerHTML = `
            <div class="alerta">
                <p>Calcule seu TDEE primeiro.</p>
                <a href="tdee-calculadora.html" class="btn-link">Calcular TDEE</a>
            </div>`;
        return;
    }

    let calorias = tdee + superavit;
    document.getElementById("resultado").innerHTML =
        `<strong>${Math.round(calorias)} kcal</strong>
        <span style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:var(--text-muted);font-family:'Barlow Condensed',sans-serif;">Calorias para Bulking</span>`;
}

// ==============================
// MACROS
// ==============================
function calcularMacros() {
    let tdee = parseFloat(localStorage.getItem("tdee"));
    let peso = parseFloat(localStorage.getItem("peso"));

    if (!tdee || !peso) {
        document.getElementById("resultado").innerHTML = `
        <div class="alerta">
            <p>Calcule seu TDEE primeiro.</p>
            <a href="tdee-calculadora.html" class="btn-link">Calcular TDEE</a>
        </div>`;
        return;
    }

    let objetivo = document.getElementById("objetivo").value;
    let intensidade = document.getElementById("intensidade")?.value;

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

    let calorias = tdee + ajuste;
    let proteina = peso * (objetivo === "cutting" ? 2 : 1.8);
    let gordura = peso * (objetivo === "bulking" ? 1 : 0.8);
    let carbo = Math.max(0, (calorias - (proteina * 4 + gordura * 9)) / 4);

    let estimativa = ajuste !== 0
        ? (objetivo === "cutting"
            ? `Perda estimada: ${((Math.abs(ajuste) * 7) / 7700).toFixed(2)} kg/semana`
            : `Ganho estimado: ${((ajuste * 7) / 7700).toFixed(2)} kg/semana`)
        : "Manutenção de peso";

    document.getElementById("resultado").innerHTML = `
        <strong>${Math.round(calorias)} kcal</strong>
        <span style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:var(--text-muted);font-family:'Barlow Condensed',sans-serif;">${estimativa}</span>

        <div style="margin-top:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);border-radius:6px;overflow:hidden;border:1px solid var(--border);">
            <div style="background:#0a0a0a;padding:16px;text-align:center;">
                <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.6rem;font-weight:900;color:#60a5fa;">${Math.round(proteina)}g</div>
                <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-top:2px;">Proteína</div>
            </div>
            <div style="background:#0a0a0a;padding:16px;text-align:center;border-left:1px solid var(--border);border-right:1px solid var(--border);">
                <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.6rem;font-weight:900;color:var(--accent);">${Math.round(carbo)}g</div>
                <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-top:2px;">Carboidratos</div>
            </div>
            <div style="background:#0a0a0a;padding:16px;text-align:center;">
                <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.6rem;font-weight:900;color:#f59e0b;">${Math.round(gordura)}g</div>
                <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-top:2px;">Gordura</div>
            </div>
        </div>
    `;

    // Gráfico
    const canvas = document.getElementById("graficoMacros");
    if (!canvas) return;
    if (window.grafico) window.grafico.destroy();

    const totalMacros = proteina + carbo + gordura;
    const ctx = canvas.getContext("2d");

    window.grafico = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Proteína", "Carboidrato", "Gordura"],
            datasets: [{
                data: [proteina, carbo, gordura],
                backgroundColor: ["#60a5fa", "#C8FF00", "#f59e0b"],
                borderWidth: 0,
                borderRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: "65%",
            animation: { duration: 600, easing: "easeOutQuart" },
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { color: "#999", padding: 16, font: { family: "'Barlow', sans-serif", size: 12 } }
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

// Alias so onchange="toggleIntensidade()" in HTML still works
function toggleIntensidade() { atualizarIntensidade(); }

// ==============================
// DOMContentLoaded
// ==============================
document.addEventListener("DOMContentLoaded", function () {
    let tdee = localStorage.getItem("tdee");
    let objetivoSalvo = localStorage.getItem("objetivo");

    let tdeeEl = document.getElementById("tdee");
    if (tdeeEl && tdee) tdeeEl.innerText = Math.round(tdee) + " kcal";

    let tdeeMacro = document.getElementById("tdee-macro");
    if (tdeeMacro && tdee) tdeeMacro.innerText = Math.round(tdee);

    let objetivoSelect = document.getElementById("objetivo");
    if (objetivoSelect && objetivoSalvo) objetivoSelect.value = objetivoSalvo;

    function atualizarIntensidade() {
        let container = document.getElementById("intensidade-container");
        if (!container || !objetivoSelect) return;
        container.style.display =
            (objetivoSelect.value === "cutting" || objetivoSelect.value === "bulking") ? "block" : "none";
    }

    if (objetivoSelect) {
        objetivoSelect.addEventListener("change", atualizarIntensidade);
        atualizarIntensidade();
    }
});
