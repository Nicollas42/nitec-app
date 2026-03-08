# 📖 Dicionário de Dados - NitecSystem (Tenants)

Este documento mapeia a estrutura do banco de dados de cada cliente (Tenant) e as regras de negócio utilizadas para a extração de inteligência (BI - Business Intelligence). Tabelas de sistema do Laravel (migrations, cache, sessions, personal_access_tokens) foram omitidas por serem padrão.

---

## 🗺️ Mapa de Relacionamentos (Arquitetura Core)
A espinha dorsal do sistema roda em torno da **Comanda**. 
* Uma `Mesa` pode ter várias `Comandas` (contas individuais ou gerais).
* Uma `Comanda` pertence a 1 `Mesa`, a 1 `Cliente` (opcional) e foi aberta por 1 `User` (Atendente).
* Uma `Comanda` possui vários `Comanda_Itens`.
* Cada `Comanda_Item` é a fotografia de 1 `Produto` no momento da venda (congela o preço daquela hora).

---

## 🗄️ Estrutura das Tabelas

### 👤 1. Tabela: `users` (Funcionários e Dono)
Guarda as pessoas que têm acesso ao painel do sistema para aquele cliente específico.
| Coluna | Tipo | Descrição / Regra de Negócio |
| :--- | :--- | :--- |
| `id` | PK | Identificador único do utilizador. |
| `name` | String | Nome de exibição do funcionário. |
| `email` | String | E-mail de login (Único). |
| `password` | String | Senha criptografada (Hash). |
| `tipo_usuario`| String | Define as permissões. Padrão: `funcionario`. Pode ser `dono`, `caixa`, `garcom`. |

### 🪑 2. Tabela: `mesas` (Gestão de Salão)
Representa o mapa físico do estabelecimento.
| Coluna | Tipo | Descrição / Regra de Negócio |
| :--- | :--- | :--- |
| `id` | PK | Identificador único da mesa. |
| `nome_mesa` | String | Nome visual (Ex: "Mesa 01", "Bistrô A"). (Único). |
| `status_mesa` | String | Controle de cor no mapa: `livre` ou `ocupada`. |
| `capacidade_pessoas`| Integer | Quantidade de lugares na mesa (Padrão: 4). |

### 👥 3. Tabela: `clientes` (Fidelização)
Clientes finais que frequentam o bar/restaurante.
| Coluna | Tipo | Descrição / Regra de Negócio |
| :--- | :--- | :--- |
| `id` | PK | Identificador único do cliente. |
| `nome_cliente`| String | Nome do cliente (Usado para dividir contas na mesa). |
| `telefone` | String | WhatsApp para envio de promoções ou cupom digital (Opcional). |

### 📦 4. Tabela: `produtos` (Catálogo e Estoque)
Itens disponíveis para venda. Usa SoftDeletes.
| Coluna | Tipo | Descrição / Regra de Negócio |
| :--- | :--- | :--- |
| `id` | PK | Identificador único do produto. |
| `nome_produto`| String | Nome comercial (Ex: "Cerveja IPA"). |
| `categoria` | String | Agrupamento para relatórios de vendas. |
| `codigo_barras`| String | Código para leitura via scanner no PDV. |
| `preco_venda` | Decimal| Preço base atual (Pode diferir do cobrado na comanda se foi alterado hoje). |
| `preco_custo` | Decimal| Custo de aquisição. |
| `estoque_atual`| Integer | Saldo físico de unidades. |
| `deleted_at` | Date | SoftDelete para manter histórico financeiro intacto. |

### 📝 5. Tabela: `comandas` (A Conta do Cliente)
O coração financeiro e operacional do restaurante.
| Coluna | Tipo | Descrição / Regra de Negócio |
| :--- | :--- | :--- |
| `id` | PK | Identificador único e número visual da comanda. |
| `mesa_id` | FK | FK para a tabela `mesas`. |
| `cliente_id` | FK | FK para a tabela `clientes`. |
| `usuario_id` | FK | FK para a tabela `users`. (Quem fez o atendimento). |
| `status_comanda`| String | Estado atual: `aberta` ou `fechada`. |
| `tipo_conta` | String | `geral` (mesa inteira) ou `individual` (sub-conta). |
| `valor_total` | Decimal| Somatório de todos os itens da comanda. |
| `data_hora_abertura`| Time | Momento em que o cliente ocupou a mesa. |
| `data_hora_fechamento`| Time| Momento do pagamento final. |

### 🛒 6. Tabela: `comanda_itens` (Consumo Detalhado)
Cada pedido feito para a cozinha/bar dentro de uma comanda.
| Coluna | Tipo | Descrição / Regra de Negócio |
| :--- | :--- | :--- |
| `id` | PK | Identificador único do lançamento. |
| `comanda_id` | FK | A qual comanda este pedido pertence. |
| `produto_id` | FK | Qual produto foi vendido. |
| `quantidade` | Integer | Quantas unidades saíram naquele exato clique. |
| `preco_unitario`| Decimal| **Histórico congelado:** Preço pago no momento exato do pedido. |
| `data_hora_lancamento`| Time| Hora do clique no sistema (Alimenta o Mapa de Calor). |

---

## 📈 Motores de Inteligência de Negócios (Como o BI funciona)
O nosso Dashboard cruza ativamente os dados acima para gerar métricas de alto valor:

* **Tempo Médio de Permanência:** Extraído da média (`AVG`) da diferença em minutos (`TIMESTAMPDIFF`) entre a `data_hora_abertura` e a `data_hora_fechamento` das `comandas`.
* **Faturamento por Dia da Semana:** Agrupamento das comandas concluídas usando a função nativa do banco de dados `DAYOFWEEK(data_hora_fechamento)` (Onde 1 = Domingo e 7 = Sábado).
* **Ranking de Ocupação de Mesas:** `JOIN` entre `comandas` e `mesas` para descobrir qual espaço físico gera a maior soma de `valor_total` e calcular o *Ticket Médio por Mesa*.
* **Mapa de Calor de Horários:** Agrupamento usando a função `HOUR(data_hora_lancamento)` da tabela `comanda_itens`. Permite saber não só os picos de volume geral, mas os picos individuais de cada produto vendido.
* **Curva ABC (Lucratividade Real):** O cálculo mais valioso do sistema. Subtrai o `preco_custo` da tabela de `produtos` do `preco_unitario` (preço de venda real congelado) da tabela `comanda_itens`, multiplicando pela `quantidade`. Determina o Lucro Líquido final para o dono.
* **Performance da Equipe (Upsell):** `JOIN` entre `users` e `comandas`. Calcula a quantidade de mesas atendidas, o total faturado e o **Ticket Médio** que cada funcionário consegue fazer o cliente gastar.
* **Alerta de Estoque Encalhado:** Subquery que isola todos os itens da tabela `produtos` com `estoque_atual > 0` que **NÃO** tiveram o seu `id` registado na tabela `comanda_itens` no período filtrado.