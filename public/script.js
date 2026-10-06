// script.js
// Envia o número e o id_token do Google para /api/desenho e exibe o SVG.
// O e-mail da assinatura é decidido pelo servidor, a partir do token.

const CLIENT_ID = "1053606741739-08grbsdtaafvvlo3h0lrm1k3j14i3o28.apps.googleusercontent.com";

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const statusLogin = document.getElementById("status");
const botaoBaixar = document.getElementById("baixar");

let idToken = null;
let svgAtual = "";

function aoLogar(resposta) {
  idToken = resposta.credential;
  statusLogin.textContent = "Login com o Google realizado.";
  mensagem.textContent = "";
}

window.addEventListener("load", () => {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: aoLogar,
  });
  google.accounts.id.renderButton(document.getElementById("login"), {
    theme: "outline",
    size: "large",
  });
});

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagem.textContent = "";

  if (!idToken) {
    mensagem.textContent = "Entre com o Google antes de desenhar.";
    return;
  }

  const numero = Number(campoNumero.value);

  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + idToken,
      },
      body: JSON.stringify({ numero }),
    });

    if (resposta.status === 400) {
      mensagem.textContent = "Erro 400: digite um inteiro entre 1 e 100.";
      return;
    }
    if (resposta.status === 401) {
      mensagem.textContent =
        "Erro 401: não autorizado. Entre novamente com o Google.";
      idToken = null;
      statusLogin.textContent = "";
      return;
    }
    if (!resposta.ok) {
      mensagem.textContent = "Erro inesperado (" + resposta.status + ").";
      return;
    }

    svgAtual = await resposta.text();
    area.innerHTML = svgAtual;
    botaoBaixar.hidden = false;
  } catch {
    mensagem.textContent = "Falha de rede ao chamar o servidor.";
  }
});

botaoBaixar.addEventListener("click", () => {
  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = "exemplo.svg";
  link.click();
  URL.revokeObjectURL(url);
});
