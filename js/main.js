// ====================== TDEE ======================
function calcularTDEE() {
    let peso = parseFloat(document.getElementById("peso").value);
    let altura = parseFloat(document.getElementById("altura").value);
    let idade = parseInt(document.getElementById("idade").value);
    let sexo = document.getElementById("sexo").value;
    let atividade = parseFloat(document.getElementById("atividade").value);

    let tmb;
    if (sexo === "masculino") {
        tmb = (10 * peso) + (6.25 * altura) - (5 * idade) + 5;
    } else {
        tmb = (10 * peso) + (6.25 * altura) - (5 * idade) - 161;
    }

    let tdee = tmb * atividade;

    // salvar no navegador
    localStorage.setItem("tdee", tdee);
    localStorage.setItem("peso", peso);
    localStorage.setItem("altura", altura);
    localStorage.setItem("idade", idade);
    localStorage.setItem("sexo", sexo);
    localStorage.setItem("atividade", atividade);

    document.getElementById("resultado").innerText =
        "TMB: " + Math.round(tmb) + " kcal | TDEE: " + Math.round(tdee) + " kcal";

    atualizarTDEEVisual();
}

// ====================== Cutting ======================
function calcularCutting() {
    let tdee = parseFloat(localStorage.getItem("tdee"));
    let deficit = parseFloat(document.getElementById("deficit").value);

    if (!tdee) {
        document.getElementById("resultado").innerText =
            "Calcule seu TDEE primeiro!";
        return;
    }

    let calorias = tdee - deficit;
    document.getElementById("resultado").innerText =
        "Calorias para cutting: " + Math.round(calorias) + " kcal";
}

// ====================== Bulking ======================
function calcularBulking() {
    let tdee = parseFloat(localStorage.getItem("tdee"));
    let superavit = parseFloat(document.getElementById("superavit").value);

    if (!tdee) {
        document.getElementById("resultado").innerText =
            "Calcule seu TDEE primeiro!";
        return;
    }

    let calorias = tdee + superavit;
    document.getElementById("resultado").innerText =
        "Calorias para bulking: " + Math.round(calorias) + " kcal";
}

// ====================== Macronutrientes ======================
function calcularMacros() {
    let tdee = parseFloat(localStorage.getItem("tdee"));
    let peso = parseFloat(localStorage.getItem("peso"));

    if (!tdee || !peso) {
        document.getElementById("resultado").innerText = "Calcule seu TDEE primeiro!";
        return;
    }

    let objetivo = document.getElementById("objetivo").value;
    let intensidade = document.getElementById("intensidade")?.value;

    // Mostrar ou esconder select de intensidade
    let intensidadeContainer = document.getElementById("intensidade-container");
    intensidadeContainer.style.display = (objetivo === "cutting" || objetivo === "bulking") ? "block" : "none";

    let proteina, gordura, carbo, deficit = 0, superavit = 0;
    let estimativa = "";

    if(objetivo === "cutting") {
        proteina = peso * 2;      // g/kg
        gordura  = peso * 0.8;    // g/kg

        // Déficit baseado na intensidade
        if(intensidade === "leve") deficit = 250;
        else if(intensidade === "moderado") deficit = 500;
        else if(intensidade === "agressivo") deficit = 750;

        carbo = (tdee - deficit - (proteina*4 + gordura*9)) / 4;
        let perdaKg = (deficit * 7) / 7700;
        estimativa = `Estimativa de perda de peso: ${perdaKg.toFixed(2)} kg/semana`;

    } else if(objetivo === "bulking") {
        proteina = peso * 1.8;    // g/kg
        gordura  = peso * 1;      // g/kg

        // Superávit baseado na intensidade
        if(intensidade === "leve") superavit = 250;
        else if(intensidade === "moderado") superavit = 500;
        else if(intensidade === "agressivo") superavit = 750;

        carbo = (tdee + superavit - (proteina*4 + gordura*9)) / 4;
        let ganhoKg = (superavit * 7) / 7700;
        estimativa = `Estimativa de ganho de peso: ${ganhoKg.toFixed(2)} kg/semana`;

    } else { // manutenção
        proteina = peso * 1.8;     
        gordura  = peso * 0.9;     
        carbo = (tdee - (proteina*4 + gordura*9)) / 4;
        estimativa = "Objetivo: manutenção de peso";
    }

    carbo = Math.max(0, carbo);

    document.getElementById("resultado").innerText =
        `Proteínas: ${Math.round(proteina)} g | Gordura: ${Math.round(gordura)} g | Carboidratos: ${Math.round(carbo)} g\n${estimativa}`;
}

// ====================== Atualizar TDEE visível ======================
function atualizarTDEEVisual() {
    let tdee = parseFloat(localStorage.getItem("tdee"));
    if(tdee){
        // Cutting/Bulking
        let tdeeCutting = document.getElementById("tdee");
        if(tdeeCutting){
            tdeeCutting.innerText = Math.round(tdee) + " kcal";
        }

        // Macronutrientes
        let tdeeMacro = document.getElementById("tdee-macro");
        if(tdeeMacro){
            tdeeMacro.innerText = Math.round(tdee) + " kcal";
        }
    }
}

// ====================== Mostrar/esconder intensidade ao mudar objetivo ======================
document.addEventListener("DOMContentLoaded", function () {
    let objetivoSelect = document.getElementById("objetivo");
    if(objetivoSelect){
        objetivoSelect.addEventListener("change", function() {
            let intensidadeContainer = document.getElementById("intensidade-container");
            intensidadeContainer.style.display = (this.value === "cutting" || this.value === "bulking") ? "block" : "none";
        });
    }

    // Atualiza TDEE ao carregar qualquer página
    atualizarTDEEVisual();
});
