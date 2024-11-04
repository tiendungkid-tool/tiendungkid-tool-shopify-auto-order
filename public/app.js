function createProfileCard(profile) {
    return `
        <header class="card-header">
            <p class="card-header-title">${profile.name}</p>
            <button class="card-header-icon icon-delete" aria-label="Run" data-id="${profile.id}">
                <span class="icon">
                    <i class="fa-solid fa-trash"></i>
                </span>
            </button>
            <button class="card-header-icon icon-run" aria-label="Run" data-id="${profile.id}">
                <span class="icon">
                    <i class="fa-solid fa-play"></i>
                </span>
            </button>
        </header>
        <div class="card-content">
            <div class="content">
                <div>ID: <b>${profile.id}</b></div>
                <div>Shop: <b>${profile.shop}</b></div>
                <div>Store password: <b>${profile.store_password}</b></div>
                ${profile.discount ? `<div>Discount code: <b>${profile.discount}</b></div>` : ''}
                ${profile.variants.map(e => `Variant: ${e.variant_id}, Quantity: ${e.quantity}`).join('<br/>')}
            </div>
        </div>
    `
}

function addProfileListener() {
    const deleteIcons = [...document.querySelectorAll('.icon-delete')]
    
    deleteIcons.forEach(e => {
        e.addEventListener('click', () => deleteProfile(e.dataset.id))
    })

    const runIcons = [...document.querySelectorAll('.icon-run')]
    runIcons.forEach(e => {
        e.addEventListener('click', () => runProfile(e.dataset.id))
    })
}

function clearContainer() {
    const container = document.getElementById('profiles-container')
    container.innerHTML = ''
}

function renderProfileCards(profiles) {
    const container = document.getElementById('profiles-container')

    profiles.forEach(profile => {
        
        const cardContainer = document.createElement('div')
        cardContainer.classList.add('card')
        const card = createProfileCard(profile)
        cardContainer.innerHTML = card
        container.append(cardContainer)
    })

    addProfileListener()
}

function loadSavedProfiles() {
    clearContainer()
    const result = UpPromoteIndexedDB.getProfiles()
    result.onsuccess = (event) => renderProfileCards(event.target.result)
}

function deleteProfile(profileId) {
    if (confirm('Are you sure?')) {
        UpPromoteIndexedDB.deleteProfile(profileId)
        loadSavedProfiles()
    }
}

function runProfile(profileId) {
    const profile = UpPromoteIndexedDB.findProfile(profileId)
    profile.onsuccess = (ev) => {
        run(ev.target.result)
    }

    const run = (profile) => {
        fetch('/run', {
            method: 'POST',
            body: JSON.stringify(profile),
            headers: {
                'Content-type': 'application/json'
            }
        })
        .then(response => {
            console.log(response)
        })
        .catch(err => {
            console.log(err)
        })
    }
    
}

loadSavedProfiles()