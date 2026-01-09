import re

# Dictionary for common translations to ensure consistency
translations = {
    'es': {
        'pollo': 'chicken', 'cordero': 'lamb', 'gambas': 'prawns', 'pescado': 'fish',
        'queso': 'cheese', 'espinacas': 'spinach', 'patatas': 'potatoes', 'cebolla': 'onion',
        'tomate': 'tomato', 'arroz': 'rice', 'pan': 'bread', 'mantequilla': 'butter',
        'nata': 'cream', 'picante': 'spicy', 'salsa': 'sauce', 'verduras': 'vegetables',
        'frutos secos': 'nuts', 'ajo': 'garlic', 'jengibre': 'ginger', 'lentejas': 'lentils',
        'garbanzos': 'chickpeas', 'vino': 'wine', 'tinto': 'red', 'blanco': 'white',
        'rosado': 'rose', 'cerveza': 'beer', 'agua': 'water', 'cafe': 'coffee',
        'leche': 'milk', 'postre': 'dessert', 'helado': 'ice cream'
    },
    'fr': {
        'pollo': 'poulet', 'cordero': 'agneau', 'gambas': 'crevettes', 'pescado': 'poisson',
        'queso': 'fromage', 'espinacas': 'épinards', 'patatas': 'pommes de terre', 'cebolla': 'oignon',
        'tomate': 'tomate', 'arroz': 'riz', 'pan': 'pain', 'mantequilla': 'beurre',
        'nata': 'crème', 'picante': 'épicé', 'salsa': 'sauce', 'verduras': 'légumes',
        'frutos secos': 'fruits secs', 'ajo': 'ail', 'jengibre': 'gingembre', 'lentejas': 'lentilles',
        'garbanzos': 'pois chiches', 'vino': 'vin', 'tinto': 'rouge', 'blanco': 'blanc',
        'rosado': 'rosé', 'cerveza': 'bière', 'agua': 'eau', 'cafe': 'café',
        'leche': 'lait', 'postre': 'dessert', 'helado': 'glace'
    }
}

# This is a placeholder script. In a real scenario, we would use a translation API.
# For now, we will just add placeholder fields to the data.ts file so the structure is ready.
# The user can then fill in the translations or we can do it progressively.

import os

file_path = '/home/ubuntu/indian_chef_system/client/src/lib/data.ts'

with open(file_path, 'r') as f:
    content = f.read()

# Regex to find menu items and inject translation fields
# Pattern looks for: name: '...', then description: '...', then adds name_en, name_fr, etc.

# We will use a simpler approach: Read line by line and inject fields after 'name' and 'description'
new_lines = []
lines = content.split('\n')

for line in lines:
    new_lines.append(line)
    if "name: '" in line and "name_en" not in content: # Avoid double insertion if run multiple times
        # Extract name to try to provide a basic translation or just placeholder
        pass 
        # Actually, let's just add the fields with empty strings or TODO markers for now
        # to avoid breaking the syntax. 
        # Better strategy: We will use the 'edit' tool to replace the whole MENU_ITEMS array 
        # with a version that has the fields. But the file is too big.
        
        # Let's try to inject just for the first few items to test, or use a smarter regex replacement.

# Since I cannot easily translate 100 items with a simple script without an external API,
# I will modify the plan to update the data.ts file with *some* translations manually 
# for demonstration and leave the rest for the user or a later bulk update.
# However, to make the language switcher work immediately, I need at least the fields to exist.

# I will use sed/regex to add the optional fields to all items in data.ts
# Pattern: name: 'Value', -> name: 'Value', name_en: 'Value', name_fr: 'Value',
# Pattern: description: 'Value', -> description: 'Value', description_en: 'Value', description_fr: 'Value',

# This is a bit risky with simple regex. 
# I will write a robust python script to parse the JS object (loosely) and add the fields.

pass
