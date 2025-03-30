GLUTEN_BROOD = "Gluten (brood)"
GLUTEN_PASTA = "Gluten (pasta)"
GLUTEN_FRIET = "Gluten (friet)"
GLUTEN_STOKBROOD = "Gluten (stokbrood)"
MELK_GOUDSE_KAAS = "Melk (goudse kaas)"

allergen_list = {
    # Burgers
    "Kenitra Classic": [
        GLUTEN_BROOD, 
        "Melk (cheddar)", 
        "Mosterd (in huisgemaakte saus)"
    ],
    "Homestyle Crispy Chicken": [
        GLUTEN_BROOD, 
        "Melk (cheddar)", 
        "Ei (in honing-mosterdsaus)", 
        "Mosterd"
    ],
    "Cheesy Deluxe": [
        GLUTEN_BROOD, 
        "Melk (cheddar)", 
        "Ei (in saus)", 
        "Mosterd (in huisgemaakte saus)"
    ],
    "Bacon Lover": [
        GLUTEN_BROOD, 
        "Melk (cheddar)", 
        "Ei (in BBQ saus)"
    ],
    "Bleu Royale": [
        GLUTEN_BROOD, 
        "Melk (blauwe kaas)"
    ],
    "Double Trouble": [
        GLUTEN_BROOD, 
        "Melk (cheddar)", 
        "Ei (in saus)", 
        "Mosterd (in huisgemaakte saus)", 
        GLUTEN_PASTA
    ],

    # Pasta's
    "Pasta Bolognese": [
        GLUTEN_PASTA, 
        "Melk (parmezaanse kaas)"
    ],
    "Pasta Carbonara": [
        GLUTEN_PASTA, 
        "Melk (parmezaanse kaas)", 
        "Ei", 
        "Kalfsvlees (bacon)"
    ],
    "Pasta Arrabbiata": [
        GLUTEN_PASTA, 
        "Melk (optionele kaas)", 
        "Noten (pijnboompitten in pesto)"
    ],
    "Pasta Chicken Pesto": [
        GLUTEN_PASTA, 
        "Melk (parmezaanse kaas)", 
        "Noten (pijnboompitten)"
    ],
    "Pasta Scampi Curry": [
        GLUTEN_PASTA, 
        "Schaaldieren (garnalen)", 
        "Melk (optionele kaas)"
    ],

    # Broodjes
    "Grilled Cheese Deluxe": [
        GLUTEN_BROOD, 
        "Melk (goudse kaas, cheddar)"
    ],
    "Grilled Cheese Tuna Melt": [
        GLUTEN_BROOD, 
        "Melk (goudse kaas, cheddar)", 
        "Vis (tonijn)"
    ],
    "Köfte Sandwich": [
        GLUTEN_BROOD
    ],
    "Hot Chicken Sandwich": [
        GLUTEN_BROOD
    ],
    "Club Sandwich": [
        GLUTEN_BROOD, 
        "Melk (goudse kaas)", 
        "Ei", 
        "Kalfsvlees (bacon)", 
        GLUTEN_FRIET
    ],

    # Kapsalon
    "Kapsalon Shoarma": [
        GLUTEN_FRIET, 
        MELK_GOUDSE_KAAS
    ],
    "Kapsalon Kipfilet": [
        GLUTEN_FRIET, 
        MELK_GOUDSE_KAAS
    ],

    # Sides
    "Franse Friet": [
        GLUTEN_FRIET
    ],
    "Mini Loempia's": [
        "Gluten", 
        "Soja"
    ],
    "Kaasbitterballen": [
        "Gluten", 
        "Melk (oude kaas)"
    ],
    "Mixed Bar Bites": [
        "Gluten (in nuggets, loempia's)", 
        "Soja"
    ],

    # Desserts
    "Crème Brûlée": [
        "Melk", 
        "Ei"
    ],
    "Cheesecake": [
        "Gluten (koekbodem)", 
        "Melk", 
        "Ei"
    ],
    "Milkshake": [
        "Soja (in Oreo variant)"
    ],
    "Smashed Taco's": [
        "Melk (in saus)", 
        "Ei (in saus)"
    ]
}

# Additional Warnings
additional_warnings = {
    "Vegetarische Opties": [
        "Pasta Arrabbiata",
        "Grilled Cheese Deluxe",
        "Milkshake"
    ],
    "Halal Opties": [
        "Bacon Lover (Halal Bacon)",
        "Club Sandwich (Halal Bacon)"
    ],
    "Kan Kruisbesmetting Bevatten": [
        "Alle gerechten kunnen sporen bevatten van: ",
        "- Noten",
        "- Pinda's",
        "- Sesamzaad",
        "- Schaaldieren",
        "- Vis",
        "- Soja",
        "- Ei"
    ]
}

def get_allergens_for_item(item_name):
    """
    Haal allergenen op voor een specifiek menu-item.
    
    :param item_name: Naam van het menu-item
    :return: Lijst met allergenen of None als het item niet bestaat
    """
    return allergen_list.get(item_name, None)

def print_all_allergens():
    """
    Print alle allergenen voor elk menu-item.
    """
    print("Allergenlijst voor Eetcafe Kenitra:")
    for item, allergens in allergen_list.items():
        print(f"\n{item}:")
        for allergen in allergens:
            print(f"  - {allergen}")
    
    print("\nAanvullende Waarschuwingen:")
    for category, items in additional_warnings.items():
        print(f"\n{category}:")
        for item in items:
            print(f"  - {item}")

if __name__ == "__main__":
    print_all_allergens()