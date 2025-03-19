allergen_list = {
    # Burgers
    "Kenitra Classic": [
        "Gluten (brood)", 
        "Melk (cheddar)", 
        "Ei (in saus)", 
        "Mosterd (in huisgemaakte saus)"
    ],
    "Homestyle Crispy Chicken": [
        "Gluten (brood)", 
        "Melk (cheddar)", 
        "Ei (in honing-mosterdsaus)", 
        "Mosterd"
    ],
    "Cheesy Deluxe": [
        "Gluten (brood)", 
        "Melk (cheddar)", 
        "Ei (in saus)", 
        "Mosterd (in huisgemaakte saus)"
    ],
    "Bacon Lover": [
        "Gluten (brood)", 
        "Melk (cheddar)", 
        "Ei (in BBQ saus)"
    ],
    "Bleu Royale": [
        "Gluten (brood)", 
        "Melk (blauwe kaas)"
    ],
    "Double Trouble": [
        "Gluten (brood)", 
        "Melk (cheddar)", 
        "Ei (in saus)", 
        "Mosterd (in huisgemaakte saus)"
    ],

    # Pasta's
    "Pasta Bolognese": [
        "Gluten (pasta)", 
        "Melk (parmezaanse kaas)"
    ],
    "Pasta Carbonara": [
        "Gluten (pasta)", 
        "Melk (parmezaanse kaas)", 
        "Ei", 
        "Varkensvlees (bacon)"
    ],
    "Pasta Vegetarian": [
        "Gluten (pasta)", 
        "Melk (optionele kaas)", 
        "Noten (pijnboompitten in pesto)"
    ],
    "Pasta Chicken Pesto": [
        "Gluten (pasta)", 
        "Melk (parmezaanse kaas)", 
        "Noten (pijnboompitten)"
    ],
    "Pasta Scampi Curry": [
        "Gluten (pasta)", 
        "Schaaldieren (garnalen)", 
        "Melk (optionele kaas)"
    ],
    "Pasta Puttanesca": [
        "Gluten (pasta)", 
        "Vis (ansjovis)", 
        "Melk (optionele kaas)"
    ],

    # Broodjes
    "Grilled Cheese Deluxe": [
        "Gluten (brood)", 
        "Melk (goudse kaas, cheddar)"
    ],
    "Grilled Cheese Tuna Melt": [
        "Gluten (brood)", 
        "Melk (goudse kaas, cheddar)", 
        "Vis (tonijn)"
    ],
    "Köfte Sandwich": [
        "Gluten (brood)"
    ],
    "Hot Chicken Sandwich": [
        "Gluten (brood)"
    ],
    "Club Sandwich": [
        "Gluten (brood)", 
        "Melk (goudse kaas)", 
        "Ei", 
        "Varkensvlees (bacon)"
    ],

    # Kapsalon
    "Kapsalon Shoarma": [
        "Gluten (friet)", 
        "Melk (goudse kaas)"
    ],
    "Kapsalon Kipfilet": [
        "Gluten (friet)", 
        "Melk (goudse kaas)"
    ],

    # Sides
    "Garlic Bread": [
        "Gluten (stokbrood)", 
        "Melk (kaas)", 
        "Knoflook"
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
    ]
}

# Additional Warnings
additional_warnings = {
    "Vegetarische Opties": [
        "Pasta Vegetarian"
    ],
    "Halal Opties": [
        "Bacon Lover (Halal Bacon)",
        "Club Sandwich (Halal Bacon)"
    ],
    "Kan Kruisbesmetting Bevatten": [
        "Alle gerechten kunnen sporen bevatten van: 
        - Noten
        - Pinda's
        - Sesamzaad
        - Schaaldieren
        - Vis
        - Soja
        - Ei"
    ]
}

def get_allergens_for_item(item_name):
    """
    Retrieve allergens for a specific menu item.
    
    :param item_name: Name of the menu item
    :return: List of allergens or None if item not found
    """
    return allergen_list.get(item_name, None)

def print_all_allergens():
    """
    Print all allergens for each menu item.
    """
    print("Allergen List for Eetcafe Kenitra:")
    for item, allergens in allergen_list.items():
        print(f"\n{item}:")
        for allergen in allergens:
            print(f"  - {allergen}")
    
    print("\nAdditional Warnings:")
    for category, items in additional_warnings.items():
        print(f"\n{category}:")
        for item in items:
            print(f"  - {item}")

if __name__ == "__main__":
    print_all_allergens() 