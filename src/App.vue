<template>
  <router-view></router-view>
</template>

<script setup>

// Vacina contra perda de foco em inputs (Especialmente para PWAs e Wrappers)
window.addEventListener('click', (evento) => {
    // Se o elemento clicado for um campo de texto, força o foco nativo nele
    if (evento.target.tagName === 'INPUT' || evento.target.tagName === 'TEXTAREA') {
        window.focus(); // Acorda a janela do Sistema Operacional
        evento.target.focus(); // Acorda o campo HTML
    }
});

// Remove o foco preso se a janela for minimizada e maximizada
window.addEventListener('focus', () => {
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        document.activeElement.blur();
    }
});

</script>