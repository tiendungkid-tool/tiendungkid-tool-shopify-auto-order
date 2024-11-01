const saveBtn = document.getElementById('save-profile')

function getSavingProfile() {
    const profileId = 'profile-' + Date.now();
    return {
        id: profileId,
        name: document.getElementById('name')?.value,
        first_name: document.getElementById('first_name')?.value,
        last_name: document.getElementById('last_name')?.value,
        email: document.getElementById('email')?.value,
        postal_code: document.getElementById('postal_code')?.value,
        variants: document.getElementById('variants')?.value,
        discount: document.getElementById('discount')?.value
    }
}

function detachVariants(variantIds) {
    try {
        const variants = variantIds.split(',')
        return variants.map((variant) => {
            const variantAndQuantity = variant.split(':')
            return {
                variant_id: Number(variantAndQuantity[0].trim()),
                quantity: Number(variantAndQuantity[1].trim())
            }
        })
    } catch (e) {
        alert('Invalid variants')
        return false
    }
}

function clearInput() {
    const elements = [...document.querySelectorAll('.add-profile input')]
    elements.forEach(elm => elm.value = '')
}

function validProfile() {
    const nullableProfileField = ['discount']
    const elements = [...document.querySelectorAll('.add-profile input')]
    elements.forEach(e => e.classList.remove('is-danger'))

    const invalidElements = elements.filter(e => {
        if (nullableProfileField.includes(e.id)) {
            return false
        }
        return !Boolean(e.value)
    })

    invalidElements.forEach(e => e.classList.add('is-danger'))
    return invalidElements.length == 0
}

function saveProfile() {
    if (!validProfile()) {
        return
    }

    const profile = getSavingProfile()
    profile.variants = detachVariants(profile.variants)

    if (!profile.variants) {
        return
    }

    UpPromoteIndexedDB.createProfile(profile)
    clearInput()
    alert('Saved')
    changeTab('profiles')
    loadSavedProfiles()
}


saveBtn.addEventListener('click', saveProfile)