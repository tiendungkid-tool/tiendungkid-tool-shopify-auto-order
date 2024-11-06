const sleep = (delay) =>
    new Promise((resolve) => setTimeout(resolve, delay))

const UpPromoteIndexedDB = {
    dbName: 'UpPromote',
    collections: {
        profiles: 'profiles',
    },
    database: null,
    getProfiles: null,
    deleteProfile: null,
    findProfile: null,
    createOrUpdateProfile: null,
    initial: async () => {
        let loop = 0
        while (
            loop < 100 &&
            !UpPromoteIndexedDB.database &&
            !UpPromoteIndexedDB.getProfiles
        ) {
            loop++
            await sleep(100)
        }

        return true
    },
}

const initDB = function (ev) {
    UpPromoteIndexedDB.database = ev.target.result
    UpPromoteIndexedDB.database.createObjectStore(
        UpPromoteIndexedDB.collections.profiles,
        {
            autoIncrement: true,
        },
    )
}

const onConnectedDB = function (ev) {
    UpPromoteIndexedDB.database = ev.target.result

    UpPromoteIndexedDB.getProfiles = () => {
        return UpPromoteIndexedDB.database
            .transaction(UpPromoteIndexedDB.collections.profiles, 'readwrite')
            .objectStore(UpPromoteIndexedDB.collections.profiles)
            .getAll()
    }

    UpPromoteIndexedDB.createProfile = (profile) => {
        UpPromoteIndexedDB.database
            .transaction(UpPromoteIndexedDB.collections.profiles, 'readwrite')
            .objectStore(UpPromoteIndexedDB.collections.profiles)
            .add(profile, profile.id)
        return true
    }

    UpPromoteIndexedDB.findProfile = (profileId) => {
        return UpPromoteIndexedDB.database
            .transaction(UpPromoteIndexedDB.collections.profiles, 'readwrite')
            .objectStore(UpPromoteIndexedDB.collections.profiles)
            .get(profileId)
    }

    UpPromoteIndexedDB.deleteProfile = (profileId) => {
        UpPromoteIndexedDB.database
            .transaction(UpPromoteIndexedDB.collections.profiles, 'readwrite')
            .objectStore(UpPromoteIndexedDB.collections.profiles)
            .delete(profileId)
        return true
    }
    
    UpPromoteIndexedDB.createOrUpdateProfile = (profile) => {
        return UpPromoteIndexedDB.database
            .transaction(UpPromoteIndexedDB.collections.profiles, 'readwrite')
            .objectStore(UpPromoteIndexedDB.collections.profiles)
            .put(profile, profile.id)
    }
}

const request = window.indexedDB.open(UpPromoteIndexedDB.dbName, 3)
request.onerror = (error) => {
    console.log(error)
}

request.onupgradeneeded = initDB
request.onsuccess = onConnectedDB


UpPromoteIndexedDB.initial()