with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'Total lines: {len(lines)}')
results = []
for i, line in enumerate(lines):
    l = line.strip()
    if len(l) > 300:
        continue
    markers = ['<section ', '</section', '<!-- SECTION', '<!-- ==', '<footer', '</footer', '<!-- MAIN', 'id="eda"', 'id="ml"', 'id="database"']
    for m in markers:
        if m in l:
            results.append(f'{i+1}: {l[:120]}')
            break

with open('structure_output.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(results))

print('Written to structure_output.txt')
print('\n'.join(results))
