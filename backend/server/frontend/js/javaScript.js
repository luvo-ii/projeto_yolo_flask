document.addEventListener("DOMContentLoaded", () => {
    const botoes = document.querySelectorAll('#abasCel button');
    const abas = document.querySelectorAll('.abaCelular');

    function mostrarAba(indice) {
        abas.forEach((aba, i) => {
            aba.style.display = i === indice ? 'flex' : 'none';
        });

        botoes.forEach((btn, i) => {
            if (i === indice) {
                btn.classList.add('ativo');
            } else {
                btn.classList.remove('ativo');
            }
        });
    }

    // Adiciona evento a cada botão
    botoes.forEach((botao, indice) => {
        botao.addEventListener('click', () => {
            mostrarAba(indice);
        });
    });

    // Mostrar apenas a primeira aba inicialmente
    mostrarAba(0);
});
