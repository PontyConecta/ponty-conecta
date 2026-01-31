# Central de Padrões Visuais - Ponty

## 📋 Visão Geral
Sistema de design centralizado para garantir consistência visual em toda a aplicação Ponty.

---

## 🎨 Paleta de Cores - Variáveis CSS

### Tema Light (Padrão)
```
--bg-primary: #f8fafc      Fundo principal da página
--bg-secondary: #ffffff     Fundo de cards/elementos
--text-primary: #0f172a     Texto principal
--text-secondary: #64748b   Texto secundário
--border-color: #e2e8f0     Bordas
--accent-primary: #4f46e5   Accent (Indigo)
```

### Tema Dark
```
--bg-primary: #0a0e27       Fundo principal
--bg-secondary: #1a1f3a     Fundo de cards
--text-primary: #f0f4f8     Texto principal
--text-secondary: #a0aac0   Texto secundário
--border-color: #ffffff     Bordas
--accent-primary: #7c3aed   Accent (Violeta)
```

### Tema Musk
```
--bg-primary: #1a1624       Fundo principal
--bg-secondary: #2d1f3a     Fundo de cards
--text-primary: #f5f1f8     Texto principal
--text-secondary: #b8a5c4   Texto secundário
--border-color: #ffffff     Bordas
--accent-primary: #d946ef   Accent (Magenta)
```

---

## 🎯 Cores Funcionais (Status & Estados)

| Tipo | Cores | Uso |
|------|-------|-----|
| **Sucesso** | `emerald-500` (#10b981) | Aprovado, Completo |
| **Alerta** | `amber-500` (#f59e0b) | Pendente, Atenção |
| **Erro** | `red-500` (#ef4444) | Rejeitado, Falha |
| **Info** | `blue-500` (#3b82f6) | Informação, Default |
| **Brand** | `indigo-500/600` (#4f46e5) | UI para Marcas |
| **Creator** | `orange-500` (#f97316) | UI para Criadores |

---

## ✅ Padrões Obrigatórios

### 1️⃣ Cores de Texto
```jsx
// ✅ CORRETO - Use variáveis CSS
<p style={{ color: 'var(--text-primary)' }}>Texto principal</p>
<p style={{ color: 'var(--text-secondary)' }}>Texto secundário</p>

// ❌ ERRADO - Não use cores fixas
❌ <p className="text-slate-900">Texto</p>
❌ <p style={{ color: '#0f172a' }}>Texto</p>
```

### 2️⃣ Cores de Fundo
```jsx
// ✅ CORRETO
<div style={{ backgroundColor: 'var(--bg-primary)' }}>Página</div>
<div style={{ backgroundColor: 'var(--bg-secondary)' }}>Card</div>

// Fundos translúcidos
<div style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>Leve</div>
<div style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>Moderado</div>
```

### 3️⃣ Cores Funcionais (Badges, Status)
```jsx
// ✅ Use Tailwind para cores funcionais
<Badge className="bg-emerald-100 text-emerald-700 border-0">Aprovado</Badge>
<Badge className="bg-amber-100 text-amber-700 border-0">Pendente</Badge>
<Badge className="bg-red-100 text-red-700 border-0">Rejeitado</Badge>
```

### 4️⃣ Cores de Bordas
```jsx
// ✅ CORRETO
<div style={{ borderColor: 'var(--border-color)', borderWidth: '1px' }}>
  Conteúdo
</div>
```

---

## 📦 Componentes Padrão

### Info Box (Azul)
```jsx
<div style={{ 
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  borderColor: 'rgba(59, 130, 246, 0.3)',
  borderWidth: '1px',
  padding: '1rem',
  borderRadius: '0.75rem'
}}>
  <p style={{ color: 'rgb(37, 99, 235)' }}>Mensagem informativa</p>
</div>
```

### Success Box (Verde)
```jsx
<div style={{ 
  backgroundColor: 'rgba(16, 185, 129, 0.1)',
  borderColor: 'rgba(16, 185, 129, 0.3)',
  borderWidth: '1px'
}}>
  <p style={{ color: 'rgb(5, 150, 105)' }}>Sucesso!</p>
</div>
```

### Alert Box (Âmbar)
```jsx
<div style={{ 
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  borderColor: 'rgba(245, 158, 11, 0.3)',
  borderWidth: '1px'
}}>
  <p style={{ color: 'rgb(180, 83, 9)' }}>Atenção</p>
</div>
```

### Dialog/Modal
```jsx
<AlertDialogContent style={{ 
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)'
}}>
  <AlertDialogTitle style={{ color: 'var(--text-primary)' }}>
    Título
  </AlertDialogTitle>
  <AlertDialogDescription style={{ color: 'var(--text-secondary)' }}>
    Descrição
  </AlertDialogDescription>
</AlertDialogContent>
```

---

## 🚀 Checklist de Implementação

- ✅ Use `var(--text-primary)` para textos principais
- ✅ Use `var(--text-secondary)` para subtítulos
- ✅ Use `var(--bg-primary)` para fundos de página
- ✅ Use `var(--bg-secondary)` para cards
- ✅ Use `var(--border-color)` para bordas
- ✅ Use `rgba(0, 0, 0, 0.05-0.1)` para fundos leves
- ✅ Use Tailwind para cores funcionais (status, badges)
- ✅ Teste em todos os 3 temas (light, dark, musk)
- ❌ Nunca hardcode cores hex em estilos

---

**Última atualização**: 31 de janeiro de 2026 | **Versão**: 1.0