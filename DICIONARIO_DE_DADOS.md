📖 Dicionário de Dados - NitecSystem (Tenants)
Este documento mapeia a estrutura do banco de dados de cada cliente (Tenant). Tabelas de sistema do Laravel (migrations, cache, sessions, personal_access_tokens) foram omitidas por serem padrão do framework.

🗺️ Mapa de Relacionamentos (Arquitetura Core)
A espinha dorsal do sistema roda em torno da Comanda.

Uma Mesa pode ter várias Comandas (contas individuais ou gerais).

Uma Comanda pertence a 1 Mesa, a 1 Cliente (opcional) e foi aberta por 1 User (Atendente).

Uma Comanda possui vários Comanda_Itens.

Cada Comanda_Item é a fotografia de 1 Produto no momento da venda (congela o preço daquela hora).

👤 1. Tabela: users (Funcionários e Dono)
Guarda as pessoas que têm acesso ao painel do sistema para aquele cliente específico.
| Coluna | Tipo | Descrição / Regra de Negócio |
| :--- | :--- | :--- |
| id | PK | Identificador único do utilizador. |
| name | String | Nome de exibição do funcionário. |
| email | String | E-mail de login (Único). |
| password | String | Senha criptografada (Hash). |
| tipo_usuario| String | Define as permissões. Padrão: funcionario. Pode ser dono. |

🪑 2. Tabela: mesas (Gestão de Salão)
Representa o mapa físico do estabelecimento.
| Coluna | Tipo | Descrição / Regra de Negócio |
| :--- | :--- | :--- |
| id | PK | Identificador único da mesa. |
| nome_mesa | String | Nome visual (Ex: "Mesa 01", "Bistrô A"). (Único). |
| status_mesa | String | Controle de cor no mapa: livre ou ocupada. |
| capacidade_pessoas| Integer | Quantidade de lugares na mesa (Padrão: 4). |

👥 3. Tabela: clientes (Fidelização e Sub-contas)
Clientes finais que frequentam o bar/restaurante.
| Coluna | Tipo | Descrição / Regra de Negócio |
| :--- | :--- | :--- |
| id | PK | Identificador único do cliente. |
| nome_cliente| String | Nome do cliente (Usado para dividir contas na mesa). |
| telefone | String | WhatsApp para envio de promoções ou cupom digital (Opcional). |

📦 4. Tabela: produtos (Catálogo e Estoque)
Itens disponíveis para venda. Usa SoftDeletes para proteger o BI.
| Coluna | Tipo | Descrição / Regra de Negócio |
| :--- | :--- | :--- |
| id | PK | Identificador único do produto. |
| nome_produto| String | Nome comercial (Ex: "Cerveja IPA"). |
| categoria | String | [BI] Agrupamento para relatórios de vendas (Ex: "Bebidas", "Pratos"). |
| codigo_barras| String | Código para leitura via scanner no PDV (Único, Opcional). |
| preco_venda | Decimal| Preço cobrado ao cliente final. |
| preco_custo | Decimal| [BI] Custo de aquisição. Usado para calcular Lucro Líquido. |
| estoque_atual| Integer | Saldo de unidades. Desconta automaticamente na venda. |
| deleted_at | Date | [BI] Se preenchido, o produto foi "apagado", mas o histórico é mantido. |

📝 5. Tabela: comandas (A Conta do Cliente)
O coração operacional do restaurante. Liga o cliente, a mesa e o dinheiro.
| Coluna | Tipo | Descrição / Regra de Negócio |
| :--- | :--- | :--- |
| id | PK | Identificador único e número visual da comanda. |
| mesa_id | FK | FK para a tabela mesas. Pode ser nulo se for venda balcão. |
| cliente_id | FK | FK para a tabela clientes. Nulo se for cliente anônimo. |
| usuario_id | FK | FK para a tabela users. Quem iniciou o atendimento. |
| status_comanda| String | Estado atual: aberta (em consumo) ou fechada (paga). |
| tipo_conta | String | geral (conta inteira da mesa) ou individual (sub-comanda). |
| valor_total | Decimal| Somatório dinâmico de todos os itens lançados. |
| data_hora_abertura| Time | [BI] Momento exato em que o cliente sentou/iniciou o pedido. |
| data_hora_fechamento| Time| [BI] Momento do pagamento. Usado para calcular Tempo de Permanência. |
| deleted_at | Date | [BI] SoftDelete para proteção de dados fiscais/históricos. |

🛒 6. Tabela: comanda_itens (Consumo Detalhado)
O que foi pedido dentro de uma comanda.
| Coluna | Tipo | Descrição / Regra de Negócio |
| :--- | :--- | :--- |
| id | PK | Identificador único do lançamento. |
| comanda_id | FK | A qual comanda este pedido pertence. (Cascade Delete). |
| produto_id | FK | Qual produto foi vendido. (Cascade Delete). |
| quantidade | Integer | Quantas unidades foram pedidas no clique. |
| preco_unitario| Decimal| Histórico congelado: Guarda o preço do produto no dia da venda, para que mudanças futuras no catálogo não alterem contas antigas. |
| data_hora_lancamento| Time| [BI] Hora exata do clique no PDV. Útil para descobrir horários de pico por produto. |