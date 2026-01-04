import re

file_path = '/home/ubuntu/indian_chef_system/client/src/lib/data.ts'

with open(file_path, 'r') as f:
    content = f.read()

# Pattern to find MenuItem objects in the array
# We look for objects starting with { and containing id: '...'
# This is a simple regex approach, might need refinement if data.ts structure is complex
# But given the file content we've seen, it's a list of objects.

# We will iterate through the file and inject 'number: X,' after 'id: ...,'

lines = content.split('\n')
new_lines = []
counter = 1
in_menu_items = False

for line in lines:
    if 'export const MENU_ITEMS: MenuItem[] = [' in line:
        in_menu_items = True
    
    if in_menu_items and 'id:' in line and 'category:' not in line: # Simple check for start of item
        # Check if it's inside a comment or something (unlikely given structure)
        # Inject number
        indent = line.split('id:')[0]
        new_lines.append(line)
        new_lines.append(f"{indent}number: {counter},")
        counter += 1
    else:
        new_lines.append(line)

with open(file_path, 'w') as f:
    f.write('\n'.join(new_lines))

print(f"Assigned numbers from 1 to {counter-1}")
