const fs = require('fs');

let content = fs.readFileSync('src/app/buat-undangan/page.jsx', 'utf8');

// 1. Add showExitModal state
content = content.replace(
  "const [currentStage, setCurrentStage] = useState(searchParams.get('stage') ? parseInt(searchParams.get('stage'), 10) : 1);",
  "const [currentStage, setCurrentStage] = useState(searchParams.get('stage') ? parseInt(searchParams.get('stage'), 10) : 1);\n  const [showExitModal, setShowExitModal] = useState(false);"
);

// 2. Extract buildOrderPayload logic
const orderPayloadRegex = /const orderId = `ORD-DA-\$\{Date\.now\(\)\.toString\(\)\.slice\(-6\)\}`;[\s\S]*?status: 'diproses',[\s\S]*?\};/;
const orderPayloadMatch = content.match(orderPayloadRegex);
if (orderPayloadMatch) {
  let orderPayloadBlock = orderPayloadMatch[0];
  // Convert status to parameter
  orderPayloadBlock = orderPayloadBlock.replace(/status: 'diproses',/g, "status: status,");

  const buildOrderFunc = `const buildOrderPayload = (status) => {\n      ${orderPayloadBlock.replace(/\n/g, '\n      ')}\n      return orderPayload;\n    };`;

  content = content.replace(
    "const handleExecutePayment = () => {",
    `${buildOrderFunc}\n\n  const handleExecutePayment = () => {`
  );

  content = content.replace(orderPayloadMatch[0], "const orderPayload = buildOrderPayload('diproses');");
}

// 3. Add handleExitSave and handleExitDiscard
const handleExitFuncs = `
  const handleExitSave = () => {
    try {
      const orderPayload = buildOrderPayload('ditunda');
      const existingOrders = JSON.parse(localStorage.getItem('dearadore_orders') || '[]');
      localStorage.setItem('dearadore_orders', JSON.stringify([orderPayload, ...existingOrders]));
      localStorage.removeItem('dearadore_order_draft');
    } catch (err) {
      console.error(err);
    }
    router.push('/akun');
  };

  const handleExitDiscard = () => {
    localStorage.removeItem('dearadore_order_draft');
    router.push('/akun');
  };
`;
content = content.replace(
  "const handleExecutePayment = () => {",
  `${handleExitFuncs}\n  const handleExecutePayment = () => {`
);

// 4. Change X button onClick to setShowExitModal(true)
content = content.replace(
  "onClick={() => router.push('/akun')}",
  "onClick={() => setShowExitModal(true)}"
);

// 5. Add Modal JSX to the render tree
const modalJsx = `
      {/* EXIT MODAL */}
      {showExitModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: '12px', width: '90%', maxWidth: '360px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>Simpan Perubahan?</h2>
            <p style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              Project ini belum disimpan. Apakah Anda ingin menyimpan ke antrean (Ditunda) atau membuangnya?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button onClick={handleExitSave} style={{ background: '#111827', color: '#FFF', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Simpan & Keluar
              </button>
              <button onClick={handleExitDiscard} style={{ background: '#FEE2E2', color: '#EF4444', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Buang Project
              </button>
              <button onClick={() => setShowExitModal(false)} style={{ background: 'transparent', color: '#4B5563', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(
  "{/* HEADER ROW WITH EXIT BUTTON */}",
  `${modalJsx}\n      {/* HEADER ROW WITH EXIT BUTTON */}`
);

fs.writeFileSync('src/app/buat-undangan/page.jsx', content);
