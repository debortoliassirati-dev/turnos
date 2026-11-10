# Turnos: passo a passo (do zero, sem programar)

## 1. Criar o Firebase (banco de dados)
1. Entre em https://console.firebase.google.com com sua conta Google e clique em **Criar projeto** (nome: `turnos`; pode desligar o Google Analytics).
2. No menu da esquerda: **Build → Realtime Database → Criar banco de dados**. Escolha qualquer região e **modo de teste**.
3. Na aba **Regras**, apague tudo, cole o conteúdo do arquivo `database.rules.json` e clique em **Publicar**.
4. Na engrenagem ⚙ → **Configurações do projeto → Seus aplicativos → ícone `</>`** (Web). Dê um nome e registre. Vai aparecer um bloco `firebaseConfig`.
5. Abra `js/config.js` e substitua cada `COLE_AQUI` pelos valores correspondentes. Se não aparecer `databaseURL`, copie o endereço que está no topo da página do Realtime Database (começa com `https://`).

## 2. Colocar no ar (Vercel, sem instalar nada)
1. Crie uma conta grátis em https://github.com. Clique em **New repository**, nome `turnos`, e depois em **uploading an existing file**.
2. Arraste **todo o conteúdo da pasta `turnos`** (arquivos e pastas `js` e `css`) e clique em **Commit changes**.
3. Crie uma conta em https://vercel.com entrando com o GitHub. Clique em **Add New → Project**, escolha o repositório `turnos` e clique em **Deploy**.
4. A Vercel te dá um endereço, por exemplo `https://turnos-xxxx.vercel.app`.

## 3. Usar
- **iPhone:** abra no Safari `https://SEU-ENDERECO/?mode=mobile` → botão Compartilhar → **Adicionar à Tela de Início**. Abra sempre por esse ícone.
- **Android da TV:** abra no Chrome `https://SEU-ENDERECO/?mode=tv`, **toque uma vez na tela** para ativar o som e deixe o aparelho ligado na tomada.
- O iPhone mostra **TV OFFLINE** se a TV ficar mais de 90 s sem sinal.

## Regras implementadas
Manhã 9h–14h (meta 30) e tarde 15h–19h (meta 24) a 6 leads/hora; atraso cobrado em dobro e sem desconto na meta; guilhotina no limite (1 lead faltante = 10 min); faltar ao turno = perda total; ronda de 20 min só na prospecção, com mini-lote de 3 extras (teto 12) quando responder 0 no modo resposta; +1 com 30 s mínimos; configurações travadas no turno e válidas só no dia seguinte; dívida paga no fim de semana das 19h às 23h a 12 leads/hora (falhou: resto +50%); tudo zera no dia 3.
