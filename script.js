document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById("searchInput");
    const typeFiltersContainer = document.getElementById("typeContainer");
    const gallery = document.getElementById("gallery");
    const collectedCheckbox = document.getElementById("collectedFilter");
    const errorBox = document.getElementById("error");

    let allPokemon = [];
    let selectedTypes = [];
    let collected = new Set();

    async function fetchPokemon() {
        try {
            gallery.textContent = "Loading Pokémon...";
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1008`);
            const data = await response.json();

            const promises = data.results.map(async (pokemon) => {
                const res = await fetch(pokemon.url);
                return await res.json();
            })

            errorBox.textContent = "";
            errorBox.classList.add("hidden");

            allPokemon = await Promise.all(promises);
            renderTypeFilters();

            renderGallery(allPokemon);

        } catch (err) {
            console.error('Failed to fetch pokemon', err);
            errorBox.textContent = "Could not load Pokémon. Please try again later.";
            errorBox.classList.remove("hidden");
        }
    }

    function renderGallery(allPokemon) {
        gallery.textContent = "";

        if (allPokemon.length === 0) {
            const msg = document.createElement("p");
            msg.textContent = "No Pokemon found.";
            gallery.appendChild(msg);
            return;
        }

        allPokemon.map((pokemon) => {
            const card = document.createElement("div");
            card.className = "pokemon_card";

            const img = document.createElement("img");
            img.src = pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default;
            img.alt = pokemon.name;

            const name = document.createElement("h3");
            name.textContent = pokemon.name;

            const types = document.createElement("div");
            types.classList.add("pokemon_types");

            pokemon.types.forEach(t => {
                const typeBadge = document.createElement("span");
                typeBadge.classList.add("type_badge", t.type.name);
                typeBadge.textContent = t.type.name;
                types.appendChild(typeBadge);
            });

            const button = document.createElement("button");
            if (collected.has(pokemon.name)) {
                button.textContent = "Collected";
            } else {
                button.textContent = "Mark as Collected";
            }
            button.addEventListener("click", () => toggleCollected(pokemon.name, button));

            card.append(name, img, types, button);
            gallery.appendChild(card);
        })
    }

    function toggleCollected(pokemonName, button) {
        if (collected.has(pokemonName)) {
            collected.delete(pokemonName);
            button.textContent = "Mark as Collected";
            button.classList.remove("collected");
        } else {
            collected.add(pokemonName);
            button.textContent = "Collected";
            button.classList.add("collected");
        }

        if (collectedCheckbox.checked) {
            updateDisplayedPokemon();
        }
    }


    function renderTypeFilters() {
        const typeSet = new Set();

        allPokemon.forEach(pokemon => {
            pokemon.types.forEach(t => {
                typeSet.add(t.type.name);
            })
        })

        const allTypes = [];
        for (const type of typeSet) {
            allTypes.push(type);
        }

        typeFiltersContainer.textContent = "";

        allTypes.forEach(type => {
            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = type;
            checkbox.addEventListener("change", handleFilterChange);

            label.append(checkbox, document.createTextNode(" " + type));
            label.setAttribute("value", type);
            typeFiltersContainer.appendChild(label);
        })
    }

    function handleFilterChange(e) {
        const type = e.target.value;

        if (e.target.checked) {
            selectedTypes.push(type);
        } else {
            selectedTypes = selectedTypes.filter(t => t !== type);
        }

        updateDisplayedPokemon();
    }

    function updateDisplayedPokemon() {
        const searchTerm = searchInput.value.toLowerCase();

        let filtered = allPokemon.filter((p) => p.name.toLowerCase().includes(searchTerm));

        if (selectedTypes.length > 0) {
            filtered = filtered.filter((p) => p.types.some((t) => selectedTypes.includes(t.type.name)));
        }

        if (collectedCheckbox.checked) {
            filtered = filtered.filter((p) => collected.has(p.name));
        }

        renderGallery(filtered);
    }

    fetchPokemon();
    searchInput.addEventListener("input", updateDisplayedPokemon);
    collectedCheckbox.addEventListener("change", updateDisplayedPokemon);
})