import re

files = [
    'src/app/akun/page.jsx',
    'src/app/katalog/page.jsx',
    'src/app/katalog/[slug]/page.jsx'
]

props_to_remove = [
    r'initial=\{.*?\}',
    r'animate=\{.*?\}',
    r'exit=\{.*?\}',
    r'transition=\{.*?\}',
    r'whileHover=\{.*?\}',
    r'whileTap=\{.*?\}',
    r'\slayout\s',
    r'\slayout$'
]

# We need to handle nested brackets if they exist. But typically they are `initial={{ ... }}`.
# So a regex like `initial=\{\{.*?\}\}` or `initial=\{.*?\}` could work.
# Let's use a simpler approach: `(initial|animate|exit|transition|whileHover|whileTap)=\{\{.*?\}\}`
# and `(initial|animate|exit|transition|whileHover|whileTap)=\{.*?\}`

def remove_props(content):
    # Remove props with double brackets e.g. initial={{ opacity: 0 }}
    content = re.sub(r'(initial|animate|exit|transition|whileHover|whileTap)=\{\{.*?\}\}', '', content, flags=re.DOTALL)
    # Remove props with single brackets
    content = re.sub(r'(initial|animate|exit|transition|whileHover|whileTap)=\{.*?\}', '', content, flags=re.DOTALL)
    content = re.sub(r'\slayout(?=[\s>])', '', content)
    content = re.sub(r'<\/?AnimatePresence(?:.*?)>', '', content, flags=re.DOTALL)
    return content

for file in files:
    try:
        with open(file, 'r') as f:
            content = f.read()
        
        content = content.replace('<motion.div', '<div')
        content = content.replace('</motion.div>', '</div>')
        content = content.replace('<motion.span', '<span')
        content = content.replace('</motion.span>', '</span>')
        content = content.replace('<motion.button', '<button')
        content = content.replace('</motion.button>', '</button>')
        
        content = remove_props(content)
        
        with open(file, 'w') as f:
            f.write(content)
        print(f'Cleaned {file}')
    except Exception as e:
        print(f'Error processing {file}: {e}')
