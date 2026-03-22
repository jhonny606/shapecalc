// ====================== TDEE ======================
function calcularTDEE() {
    let peso = document.getElementById("peso").value;
    let altura = document.getElementById("altura").value;
    let idade = document.getElementById("idade").value;
    let sexo = document.getElementById("sexo").value;
    let atividade = document.getElementById("atividade").value;

    let tmb;
    if (sexo === "masculino") {
        tmb = (10 * peso) + (6.25 * altura) - (5 * idade) + 5;
    } else {
        tmb = (10 * peso) + (6.25 * altura) - (5 * idade) - 161;
    }

    let tdee = tmb * atividade;

    // salvar no navegador
    localStorage.setItem("tdee", tdee);

    document.getElementById("resultado").innerText =
        "TMB: " + Math.round(tmb) + " kcal | TDEE: " + Math.round(tdee) + " kcal";
}

// ====================== Cutting ======================
function calcularCutting() {
    let tdee = localStorage.getItem("tdee");
    let deficit = document.getElementById("deficit").value;

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
    let tdee = localStorage.getItem("tdee");
    let superavit = document.getElementById("superavit").value;

    if (!tdee) {
        document.getElementById("resultado").innerText =
            "Calcule seu TDEE primeiro!";
        return;
    }

    let calorias = parseInt(tdee) + parseInt(superavit);
    document.getElementById("resultado").innerText =
        "Calorias para bulking: " + Math.round(calorias) + " kcal";
}

// ====================== Macronutrientes ======================
function calcularMacros() {
    let tdee = localStorage.getItem("tdee");
    let objetivo = document.getElementById("objetivo-macro").value;
    let resultadoEl = document.getElementById("resultado-macro");

    if (!tdee) {
        resultadoEl.innerText = "Calcule seu TDEE primeiro!";
        return;
    }

    let proteina, carbo, gordura;

    if (objetivo === "manutencao") {
        proteina = 0.3 * tdee / 4;
        carbo = 0.4 * tdee / 4;
        gordura = 0.3 * tdee / 9;
    } else if (objetivo === "cutting") {
        proteina = 0.35 * tdee / 4;
        carbo = 0.35 * tdee / 4;
        gordura = 0.3 * tdee / 9;
    } else if (objetivo === "bulking") {
        proteina = 0.25 * tdee / 4;
        carbo = 0.50 * tdee / 4;
        gordura = 0.25 * tdee / 9;
    }

    resultadoEl.innerText =
        `Proteínas: ${Math.round(proteina)} g | Carboidratos: ${Math.round(carbo)} g | Gordura: ${Math.round(gordura)} g`;
}

// ====================== DOMContentLoaded ======================
document.addEventListener("DOMContentLoaded", function () {
    let tdee = localStorage.getItem("tdee");

    if (tdee) {
        console.log("TDEE carregado:", Math.round(tdee), "kcal");
        // Apenas atualiza o TDEE visível se o elemento existir
        let tdeeElement = document.getElementById("tdee");
        if (tdeeElement) {
            tdeeElement.innerText = Math.round(tdee) + " kcal";
        }
    }
});
