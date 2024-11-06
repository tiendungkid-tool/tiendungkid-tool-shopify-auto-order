function createProfileCard(profile) {
    return `
        <header class="card-header">
            <p class="card-header-title">${profile.name}</p>
            <button class="card-header-icon icon-edit" aria-label="Run" data-id="${profile.id}">
                <span class="icon">
                    <i class="fa-solid fa-pencil"></i>
                </span>
            </button>
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
    const editIcons = [...document.querySelectorAll('.icon-edit')]
    editIcons.forEach(e => {
        e.addEventListener('click', () => editProfile(e.dataset.id))
    })

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
        console.log(profile);
        
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

function editProfile(profileId) {
    const profileResult = UpPromoteIndexedDB.findProfile(profileId)
    profileResult.onsuccess = (ev) => {
        run(ev.target.result)
    }

    const run = (profile) => {
        const fillAttrs = [
            {
                selector: '#profile_id',
                value: profile.id
            },
            {
                selector: '#name',
                value: profile.name
            },
            {
                selector: '#shop',
                value: profile.shop
            },
            {
                selector: '#store_password',
                value: profile.store_password
            },
            {
                selector: '#store_password',
                value: profile.store_password
            },
            {
                selector: '#ref_code',
                value: profile.ref_code
            },
            {
                selector: '#email',
                value: profile.email
            },
            {
                selector: '#first_name',
                value: profile.first_name
            },
            {
                selector: '#last_name',
                value: profile.last_name
            },
            {
                selector: '#address',
                value: profile.address
            },
            {
                selector: '#country',
                value: profile.country
            },
            {
                selector: '#city',
                value: profile.city
            },
            {
                selector: '#state',
                value: profile.state
            },
            {
                selector: '#postal_code',
                value: profile.postal_code
            },
            {
                selector: '#variants',
                value: profile.variants.map(e => `${e.variant_id}:${e.quantity}`).join(',')
            },
            {
                selector: '#discount',
                value: profile.discount.join(',')
            },
            {
                selector: '#tip',
                value: profile.tip
            }
        ]

        fillAttrs.forEach(e => {
            const inputElement = document.querySelector(e.selector);
            if (inputElement) {
                inputElement.value = e.value
            }
        })

        changeTab('add-profile')
    }
}

loadSavedProfiles()