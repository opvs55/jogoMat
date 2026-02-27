# The Precision Lander (O Pousador de Precisão)

Aplicação educacional em React + SVG onde o aluno controla um módulo lunar ajustando funções matemáticas em tempo real.

## O que já está implementado

- Simulação 2D com física própria (sem Matter.js).
- Controles para parâmetros de função:
  - **Linear** (`ax + b`) para vento.
  - **Quadrática** para trajetória vertical sob gravidade.
  - **Trigonométrica** (`sen/cos`) para decompor empuxo por ângulo.
  - **Exponencial** (`e^x`) para aquecimento do motor.
- Painel de telemetria com feedback pedagógico: velocidade, erro angular, aceleração, combustível e temperatura.
- Modo de aula com explicações por tópico matemático e previsão de altura via equação quadrática.

## Regras de pouso

Você vence quando encosta na plataforma verde com:
- velocidade total abaixo do limite,
- erro angular abaixo do limite,
- sem superaquecer o motor.

## Rodando localmente

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
npm run preview
```

## Estrutura principal

- `src/App.jsx`: física, regras de pouso, UI educativa e simulação SVG.
- `src/styles.css`: layout responsivo e estilo visual.

## Próximos passos sugeridos

- Persistir leaderboard e fases em Supabase.
- Adicionar editor de fases por fórmulas.
- Criar trilhas pedagógicas guiadas para sala de aula.
