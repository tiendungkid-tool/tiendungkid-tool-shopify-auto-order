const tabHeadings = [...document.querySelectorAll(`.tabs ul li`)]
tabHeadings.forEach(elm => elm.addEventListener('click', toggleActive))


function toggleActive() {
    const target = this;
    tabHeadings.forEach(elm => elm.classList.remove('is-active'))
    target.classList.add('is-active')

    const targetTabContent = target.dataset.target
    const targetTabs = [...document.querySelectorAll('.tab-content div')]

    targetTabs.forEach(elm => {
        elm.classList.remove('is-active-tab')
        if (elm.classList.contains(targetTabContent)) {
            elm.classList.add('is-active-tab')
        }
    })
}


function changeTab(tabId) {
    const tabLi = document.querySelector(`li[data-target=${tabId}]`)
    tabLi && tabLi.click()
}