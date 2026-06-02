// ============================================================
// SISTEMA DE CÓDIGOS DE ACESSO — ShapeCalc
// ============================================================
// Adicione este bloco no server.js do shapecalc-admin
// Logo após os requires existentes, antes do app.listen
// ============================================================

const crypto = require('crypto');

// Token secreto do Hotmart (aba Autenticação do webhook)
const HOTMART_TOKEN = process.env.HOTMART_TOKEN || '9PKtKHGVRPtbe8ntZNBRkbp0RB83rT89780090';

// Armazenamento em memória dos códigos
// Formato: { 'SC-XXXXX': { used: false, email: '...', createdAt: Date } }
// NOTA: No plano gratuito do Render, o servidor reinicia ocasionalmente.
// Para persistência total, salve os códigos no GitHub como arquivo JSON.
const codigosValidos = new Map();

// Gera código único no formato SC-XXXXX
function gerarCodigo() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'SC-';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    // Garante unicidade
    if (codigosValidos.has(code)) return gerarCodigo();
    return code;
}

// ── WEBHOOK: Recebe notificação de compra aprovada ────────────────────────────
app.post('/webhook/hotmart', express.raw({ type: 'application/json' }), (req, res) => {
    try {
        // Validar token do Hotmart
        const tokenRecebido = req.headers['x-hotmart-webhook-token'] || req.headers['hottok'];
        if (tokenRecebido !== HOTMART_TOKEN) {
            console.log('Webhook: token inválido:', tokenRecebido);
            return res.status(401).json({ error: 'Token inválido' });
        }

        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const event = body.event || body.data?.event;
        console.log('Webhook Hotmart recebido:', event);

        // Só processa compras aprovadas
        if (event !== 'PURCHASE_APPROVED' && event !== 'purchase.approved') {
            return res.status(200).json({ ok: true, skipped: true });
        }

        // Pega email do comprador
        const email = body.data?.buyer?.email
            || body.buyer?.email
            || body.data?.purchase?.buyer?.email
            || 'unknown';

        // Gera código único
        const codigo = gerarCodigo();
        codigosValidos.set(codigo, {
            used: false,
            email,
            createdAt: new Date().toISOString()
        });

        console.log(`✓ Código gerado: ${codigo} para ${email}`);

        // O Hotmart vai enviar o código por email automaticamente
        // via "Conteúdo do produto" que você configurar na página do produto
        // O código ficará disponível também em /admin/codigos

        res.status(200).json({ ok: true, codigo });
    } catch (e) {
        console.error('Webhook error:', e);
        res.status(500).json({ error: e.message });
    }
});

// ── VALIDAR CÓDIGO: Chamado pelo site antes de gerar a planilha ───────────────
app.post('/api/validar-codigo', express.json(), (req, res) => {
    const { codigo } = req.body;

    if (!codigo) {
        return res.status(400).json({ valid: false, error: 'Código não informado' });
    }

    const upper = codigo.trim().toUpperCase();
    const entry = codigosValidos.get(upper);

    if (!entry) {
        return res.status(404).json({ valid: false, error: 'Código inválido ou inexistente' });
    }

    if (entry.used) {
        return res.status(403).json({ valid: false, error: 'Este código já foi utilizado' });
    }

    // Marca como usado
    codigosValidos.set(upper, { ...entry, used: true, usedAt: new Date().toISOString() });

    console.log(`✓ Código ${upper} validado e marcado como usado`);
    res.json({ valid: true, message: 'Código válido! Gerando sua planilha...' });
});

// ── LISTAR CÓDIGOS (admin) ────────────────────────────────────────────────────
app.get('/admin/codigos', requireAuth, (req, res) => {
    const lista = Array.from(codigosValidos.entries()).map(([code, data]) => ({
        codigo: code,
        email: data.email,
        used: data.used,
        createdAt: data.createdAt,
        usedAt: data.usedAt || null
    }));

    // Ordenar por mais recente
    lista.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
        total: lista.length,
        usados: lista.filter(c => c.used).length,
        disponiveis: lista.filter(c => !c.used).length,
        codigos: lista
    });
});

// ── GERAR CÓDIGO MANUALMENTE (admin — para testes) ────────────────────────────
app.post('/admin/gerar-codigo', requireAuth, (req, res) => {
    const { email = 'manual' } = req.body;
    const codigo = gerarCodigo();
    codigosValidos.set(codigo, {
        used: false,
        email,
        createdAt: new Date().toISOString()
    });
    console.log(`✓ Código manual gerado: ${codigo}`);
    res.json({ codigo });
});

// ── DOWNLOAD COM VALIDAÇÃO DE CÓDIGO ─────────────────────────────────────────
// Esta rota substitui o app.get('/download/planilha', gerarPlanilha) existente
// O código é validado via query param após ser verificado pelo /api/validar-codigo
// Para segurança, usamos um token temporário de sessão

const tokensTemporarios = new Map(); // token → { expires, params }

app.post('/api/liberar-download', express.json(), (req, res) => {
    const { codigo, peso, altura, idade, sexo, bf, atividade, objetivo, refeicoes } = req.body;

    if (!codigo) return res.status(400).json({ error: 'Código obrigatório' });

    const upper = codigo.trim().toUpperCase();
    const entry = codigosValidos.get(upper);

    if (!entry) return res.status(404).json({ valid: false, error: 'Código inválido' });
    if (entry.used) return res.status(403).json({ valid: false, error: 'Código já utilizado' });

    // Marca como usado
    codigosValidos.set(upper, { ...entry, used: true, usedAt: new Date().toISOString() });

    // Gera token temporário válido por 5 minutos
    const tempToken = crypto.randomBytes(20).toString('hex');
    tokensTemporarios.set(tempToken, {
        expires: Date.now() + 5 * 60 * 1000,
        params: { peso, altura, idade, sexo, bf, atividade, objetivo, refeicoes }
    });

    // Limpa tokens expirados
    for (const [t, data] of tokensTemporarios.entries()) {
        if (Date.now() > data.expires) tokensTemporarios.delete(t);
    }

    console.log(`✓ Download liberado para código ${upper}`);
    res.json({ valid: true, token: tempToken });
});

// Rota de download com token temporário (substitui a rota sem proteção)
app.get('/download/planilha', async (req, res) => {
    const { token } = req.query;

    // Se tem token temporário, valida e gera
    if (token) {
        const data = tokensTemporarios.get(token);
        if (!data || Date.now() > data.expires) {
            return res.status(403).send('Token expirado ou inválido. Volte ao site e tente novamente.');
        }
        tokensTemporarios.delete(token); // token de uso único
        // Injeta params na req.query e chama o gerador
        req.query = { ...data.params };
        return gerarPlanilha(req, res);
    }

    // Sem token — bloqueia
    res.status(403).send('Acesso negado. Utilize o site para baixar sua planilha.');
});
