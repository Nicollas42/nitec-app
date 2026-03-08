# 📖 Dicionário de Dados - NitecSystem (Tenants)

Este documento mapeia a estrutura do banco de dados isolado de cada cliente (Tenant) e as regras de negócio utilizadas para a extração de inteligência (BI - Business Intelligence). Tabelas padrão do framework Laravel foram omitidas.

---

## 🗺️ Mapa de Relacionamentos (Arquitetura Core)
A espinha dorsal do sistema roda em torno da **Comanda** e do **Estoque**. 
* Uma `Mesa` pode ter várias `Comandas`.
* Uma `Comanda` possui vários `Comanda_Itens`.
* Cada `Comanda_Item` congela o preço do `Produto` no momento da venda.
* **[NOVO]** O `Produto` pode sofrer baixas não financeiras gerando registros na tabela `estoque_perdas`.

---

## 🗄️ Estrutura das Tabelas

### 👤 1. Tabela: `users` (Equipe, Temporários e Dono)
| Coluna | Tipo | Descrição / Regra de Negócio |
| :--- | :--- | :--- |
| `id` | PK | Identificador único do utilizador. |
| `name` | String | Nome de exibição do funcionário. |
| `email` | String | E-mail de login (Único). |
| `telefone` | String | WhatsApp / Contato do funcionário. |
| `password` | String | Senha criptografada. |
| `tipo_usuario`| String | `dono`, `caixa` ou `garcom`. |
| `status_conta`| String | `ativo`, `inativo` ou `demitido` (Arquivamento lógico para proteção do BI). |
| `tipo_contrato`| String | `fixo` ou `temporario`. |
| `expiracao_acesso`| DateTime| **[Timer]** Desativa automaticamente o login de temporários. |

### 🪑 2. Tabela: `mesas` (Infraestrutura do Salão)
| Coluna | Tipo | Descrição / Regra de Negócio |
| :--- | :--- | :--- |
| `id` | PK | Identificador único. |
| `nome_mesa` | String | Nome visual (Ex: "Mesa 01"). |
| `status_mesa` | String | `livre` ou `ocupada`. |
| `capacidade_pessoas`| Integer | Lugares disponíveis. |

### 👥 3. Tabela: `clientes` (Fidelização)
| Coluna | Tipo | Descrição / Regra de Negócio |
| :--- | :--- | :--- |
| `id` | PK | Identificador único. |
| `nome_cliente`| String | Nome do cliente. |
| `telefone` | String | WhatsApp. |

### 📦 4. Tabela: `produtos` (Catálogo e Estoque)
| Coluna | Tipo | Descrição / Regra de Negócio |
| :--- | :--- | :--- |
| `id` | PK | Identificador único. |
| `nome_produto`| String | Nome comercial. |
| `categoria` | String | **[BI]** Agrupamento para relatórios. |
| `codigo_barras`| String | Leitura via scanner. |
| `preco_venda` | Decimal| Preço cobrado ao cliente. |
| `preco_custo` | Decimal| **[BI]** Custo de aquisição. Base do cálculo de lucro. |
| `estoque_atual`| Integer | Saldo físico atual. |
| `data_validade`| Date | **[NOVO]** Opcional. Data de vencimento do lote atual. |
| `deleted_at` | Date | SoftDelete: Oculta o produto sem quebrar o BI antigo. |

### 🗑️ 5. Tabela: `estoque_perdas` (Controle de Desperdício) [NOVA]
Registra tudo o que saiu do estoque mas não gerou dinheiro (Quebras, Vencimentos, Consumo Interno).
| Coluna | Tipo | Descrição / Regra de Negócio |
| :--- | :--- | :--- |
| `id` | PK | Identificador único. |
| `produto_id` | FK | Qual produto foi perdido. |
| `usuario_id` | FK | Quem registrou a perda. |
| `quantidade` | Integer | Quantas unidades foram descartadas. |
| `motivo` | String | Ex: "Quebra", "Vencimento", "Defeito", "Consumo Interno". |
| `custo_total_perda`| Decimal| **[BI]** `quantidade` x `preco_custo` no momento do descarte. Mostra quanto dinheiro o restaurante "queimou". |

### 📝 6. Tabela: `comandas` e 🛒 7. `comanda_itens`
*(Mantidas as estruturas anteriores detalhadas de relacionamento de vendas, abertura/fechamento e congelamento de preços unitários).*

---

## 📈 Motores de Inteligência de Negócios (Como o BI calcula os KPIs)
* **Tempo Médio de Permanência:** `AVG(TIMESTAMPDIFF(MINUTE, abertura, fechamento))`.
* **Ranking de Ocupação de Mesas:** `JOIN` comandas/mesas `SUM(valor_total)`.
* **Mapa de Calor de Horários:** Agrupamento por `HOUR(data_hora_lancamento)`.
* **Curva ABC (Lucratividade Real):** `(preco_unitario cobrado - preco_custo atual) * quantidade`.
* **Raio-X de Equipe (Alta Performance):**
  * **Ticket Médio:** Receita / Mesas atendidas.
  * **Lucro Gerado:** Faturamento do garçom subtraído dos custos dos produtos que ele vendeu.
  * **Esforço Físico:** Soma bruta da quantidade de itens que o funcionário transportou.
  * **O Especialista:** Item de maior volume vendido individualmente pelo garçom.