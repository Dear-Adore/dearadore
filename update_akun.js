const fs = require('fs');

let content = fs.readFileSync('src/app/akun/page.jsx', 'utf8');

// 1. Add LogOut button near "Buat Undangan" / "Lihat Katalog"
const logOutBtn = `
          <button
            type="button"
            className="account-action-pill"
            style={{
              textDecoration: 'none',
              padding: '0.65rem 1.15rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: '#FEE2E2',
              color: '#EF4444',
              border: '1px solid #FCA5A5',
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
            onClick={() => {
              if(confirm('Apakah Anda yakin ingin keluar?')) {
                // handle signout
                window.location.href = '/';
              }
            }}
          >
            <LogOut size={15} />
            <span>Keluar</span>
          </button>
`;
content = content.replace(
  '          </Link>\n        </div>',
  '          </Link>' + logOutBtn + '\n        </div>'
);

// Add LogOut to lucide-react imports
if (!content.includes('LogOut')) {
  content = content.replace('Zap,\n} from \'lucide-react\';', 'Zap,\n  LogOut,\n  Download,\n} from \'lucide-react\';');
}

// 2. Add Favorit to statusTabs
content = content.replace(
  "  { id: 'selesai', label: 'Selesai' },\n];",
  "  { id: 'selesai', label: 'Selesai' },\n  { id: 'favorit', label: 'Favorit' },\n];"
);

// Add default favorit to defaultProjects
if (content.includes('selesai: [')) {
  content = content.replace(
    '  selesai: [\n',
    '  favorit: [],\n  selesai: [\n'
  );
}

// Ensure allProjects update logic handles favorit (setAllProjects)
content = content.replace(
  '            setAllProjects({\n              ditunda: [...dynamicDitunda, ...defaultProjects.ditunda],\n              proses: [...dynamicProses, ...defaultProjects.proses],\n              selesai: [...dynamicSelesai, ...defaultProjects.selesai],\n            });',
  `            const savedWishlistStr = localStorage.getItem('dearadore_wishlist');
            let dynamicFavorit = [];
            if (savedWishlistStr) {
               try {
                 dynamicFavorit = JSON.parse(savedWishlistStr);
               } catch(e) {}
            }
            setAllProjects({
              ditunda: [...dynamicDitunda, ...defaultProjects.ditunda],
              proses: [...dynamicProses, ...defaultProjects.proses],
              selesai: [...dynamicSelesai, ...defaultProjects.selesai],
              favorit: dynamicFavorit,
            });`
);

// Wait, the above replacement might fail if the whitespace doesn't match perfectly. Let's make it more robust using regex.
const setAllProjectsRegex = /setAllProjects\(\{\s*ditunda: \[\.\.\.dynamicDitunda, \.\.\.defaultProjects\.ditunda\],\s*proses: \[\.\.\.dynamicProses, \.\.\.defaultProjects\.proses\],\s*selesai: \[\.\.\.dynamicSelesai, \.\.\.defaultProjects\.selesai\],\s*\}\);/;
content = content.replace(setAllProjectsRegex, `const savedWishlistStr = localStorage.getItem('dearadore_wishlist');
            let dynamicFavorit = [];
            if (savedWishlistStr) {
               try {
                 const wl = JSON.parse(savedWishlistStr);
                 // Assuming wishlist contains minimal project objects
                 dynamicFavorit = wl;
               } catch(e) {}
            }
            setAllProjects({
              ditunda: [...dynamicDitunda, ...defaultProjects.ditunda],
              proses: [...dynamicProses, ...defaultProjects.proses],
              selesai: [...dynamicSelesai, ...defaultProjects.selesai],
              favorit: dynamicFavorit,
            });`);


// 3. Add Unduh Invoice in Modal Rincian
const invoiceBtn = `
              <button 
                type="button" 
                className="account-action-pill"
                onClick={() => alert('Fitur unduh invoice PDF sedang dalam pengembangan.')}
                style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', flex: 1, padding: '0.65rem', justifyContent: 'center' }}
              >
                <Download size={14} />
                <span>Unduh Invoice</span>
              </button>
`;

content = content.replace(
  '            <div style={{ display: \'flex\', gap: \'0.75rem\', marginTop: \'1.5rem\' }}>',
  `            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
${invoiceBtn}`
);


// 4. In case the user views favorit tab, the button should be "Lihat Tema" instead of "Continue" / "Salin"
content = content.replace(
  "{activeTab === 'ditunda' ? (",
  `{activeTab === 'favorit' ? (
                      <Link
                        href={\`/katalog/\${project.themeId || 'theme-01'}\`}
                        className="account-action-pill primary"
                        style={{ width: '100%', textDecoration: 'none', justifyContent: 'center' }}
                      >
                        <span>Lihat Tema</span>
                        <ArrowUpRight size={13} />
                      </Link>
                    ) : activeTab === 'ditunda' ? (`
);

fs.writeFileSync('src/app/akun/page.jsx', content);
