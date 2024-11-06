const saveBtn = document.getElementById('save-profile')

function getSavingProfile() {
    const profileId = 'profile-' + Date.now();
    return {
        id: document.getElementById('profile_id')?.value || profileId,
        name: document.getElementById('name')?.value,
        shop: document.getElementById('shop')?.value,
        store_password: document.getElementById('store_password')?.value,
        ref_code: document.getElementById('ref_code')?.value,
        email: document.getElementById('email')?.value,
        first_name: document.getElementById('first_name')?.value,
        last_name: document.getElementById('last_name')?.value,
        address: document.getElementById('address')?.value,
        country: document.getElementById('country')?.value,
        state: document.getElementById('state')?.value,
        city: document.getElementById('city')?.value,
        postal_code: document.getElementById('postal_code')?.value,
        variants: document.getElementById('variants')?.value,
        discount: document.getElementById('discount')?.value,
        tip: document.getElementById('tip')?.value
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
    const nullableProfileField = ['discount', 'country', 'state', 'tip', 'profile_id']
    const elements = [...document.querySelectorAll('.add-profile input')]
    elements.forEach(e => e.classList.remove('is-danger'))

    const invalidElements = elements.filter(e => {
        if (nullableProfileField.includes(e.id)) {
            return false
        }

        if (e.id == 'shop') {
            return !e.value.endsWith('.myshopify.com')
        }

        return !Boolean(e.value)
    })

    invalidElements.forEach(e => e.classList.add('is-danger'))
    return invalidElements.length == 0
}

function detachDiscount(discount) {
    if (!discount) {
        return []
    }

    return discount.split(',').map(e => e.trim())
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
    profile.discount = detachDiscount(profile.discount)
    const result = UpPromoteIndexedDB.createOrUpdateProfile(profile)
    result.onsuccess = () => {
        clearInput()
        alert('Saved')
        changeTab('profiles')
        loadSavedProfiles()
    }
}


saveBtn.addEventListener('click', saveProfile)