# Ponty — Backend API Reference

> **Regra de ouro:** O frontend é 100% read-only.  
> Toda mutação (create / update / delete) passa por uma backend function.

---

## Contrato de Resposta

### Sucesso (2xx)
```json
{ "success": true, ...payload }
```
`payload` pode incluir `profile`, `campaign`, etc. dependendo da function.

### Erro (4xx / 5xx)
```json
{ "error": "Mensagem legível", "code": "ERROR_CODE" }
```

---

## Tabela de Error Codes

| Code | HTTP | Significado |
|---|---|---|
| `UNAUTHORIZED` | 401 | Usuário não autenticado |
| `FORBIDDEN` | 403 | Sem permissão (ownership / role) |
| `NOT_FOUND` | 404 | Entidade não encontrada |
| `MISSING_FIELDS` | 400 | Campos obrigatórios ausentes |
| `INVALID_INPUT` | 400 | Valor inválido (enum, tipo, formato) |
| `INVALID_STEP` | 400 | Step de onboarding fora de range |
| `INVALID_TRANSITION` | 400 | Transição de status proibida |
| `INVALID_RATE_RANGE` | 400 | rate_cash_min > rate_cash_max |
| `INVALID_ACTION` | 400 | Action não reconhecida |
| `MISSING_PROOF` | 400 | Prova de delivery obrigatória |
| `VALIDATION_ERROR` | 400 | Regra de negócio violada |
| `NO_CHANGES` | 400 | Nenhum campo válido para atualizar |
| `INTERNAL_ERROR` | 500 | Erro inesperado no servidor |

---

## Functions — Mapa de Responsabilidades

| # | Function | Responsabilidade | Entities Afetadas |
|---|---|---|---|
| 1 | `selectProfile` | Cria Brand ou Creator na escolha inicial de perfil | Brand, Creator |
| 2 | `onboardingSaveStep` | Salva dados de cada step do onboarding (1-4) | Brand, Creator |
| 3 | `onboardingFinalize` | Marca account_state=ready e dispara missões | Brand, Creator |
| 4 | `updateProfile` | Atualiza perfil após onboarding (whitelist + sanitização) | Brand, Creator, AuditLog |
| 5 | `manageCampaign` | Create / Update / Update Status de campanhas | Campaign |
| 6 | `manageApplication` | Withdraw (creator) / Reject (brand) de applications | Application |
| 7 | `submitDelivery` | Submit de proof de delivery pelo creator | Delivery |
| 8 | `manageNotification` | Mark read / Mark all read / Dismiss notificações | Notification |
| 9 | `resolveDispute` | Admin resolve disputa e atualiza delivery/application | Dispute, Delivery, Application, Creator, AuditLog |

---

## Template Padrão (todas as 9 functions seguem)

```
Auth → Validate Input → Ownership Check → Sanitize → Execute → (Audit) → Respond
```

### Guardrails de Segurança
- **Whitelist de campos:** só campos explicitamente permitidos são aceitos
- **Protected fields:** `is_verified`, `subscription_status`, `plan_level`, `account_state`, etc. são silenciosamente descartados
- **Ownership:** toda mutação verifica `user_id` do perfil vs. token autenticado
- **State machine:** transições de status seguem mapa válido (VALID_STATUS_TRANSITIONS)
- **Sanitização tipada:** strings, números, URLs, arrays, objetos aninhados — cada tipo tem sanitizer dedicado

---

## Uso no Frontend

```js
import { invokeBackend } from '@/components/utils/invokeBackend';

const { data } = await invokeBackend('manageCampaign', {
  action: 'create',
  data: { title: 'Minha Campanha', ... }
});
```

> **PROIBIDO no frontend:** `base44.entities.*.create()`, `.update()`, `.delete()`, `.bulkCreate()`  
> Apenas `.list()`, `.filter()`, `.schema()` e `.subscribe()` são permitidos.