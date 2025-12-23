async function getSightings() {
    try {
        const data = await fetch("/api")
        const response = await data.json()
        renderCards(response)
    } catch (err) {
        console.log(err)
    }
}

async function getSighting(uuid) {
    const res = await fetch(`/api/${uuid}`)
    return await res.json()
}

function renderCards(cardsData) {
    const container = document.querySelector(".cards-container")
    let cardsHTML = ""

    cardsData.forEach((card, i) => {
        const displayDate = (card.timeStamp && !isNaN(Date.parse(card.timeStamp)))
            ? new Date(card.timeStamp).toLocaleString('en-GB', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
            : (card.timeStamp || '')

        cardsHTML += `
<article class="sighting-card" tabindex="0" aria-labelledby="sighting-title-${i}" data-article-id="${card.uuid}">
    <div class="sighting-wrapper">
        <div>
            <p class="card-details">${displayDate}, ${card.location}</p>
            <h3 id="sighting-title-${i}">${card.title}</h3>
            <div class="sighting-text-wrapper">
                <p class="sighting-text">${card.text}</p>
            </div>
            <button class="read-more-btn" aria-expanded="false">Read in full</button>
        </div>
        <i class="fa-solid fa-trash-can delete" id="${card.uuid}"></i>
    </div>
</article>
  `
    })

    container.innerHTML = cardsHTML
}

// handle card expand/collapse
document.querySelector(".cards-container").addEventListener("click", (e) => {
    if (!e.target.classList.contains("read-more-btn")) return

    e.stopPropagation()

    const button = e.target
    const sightingCard = button.closest(".sighting-card")
    const isExpanded = sightingCard.classList.toggle("expanded")

    button.setAttribute("aria-expanded", isExpanded ? "true" : "false")
    button.textContent = isExpanded ? "Show less" : "Read in full"
})

async function deleteSighting(uuid) {
    try {
        await fetch(`/api/${uuid}`, { method: 'DELETE' })
    } catch (err) {
        console.log(err)
    }
}

function openEditFormWithSighting(sighting) {
    const form = document.getElementById('editEventForm')
    if (!form) return

    form.classList.add('modal')
    document.body.classList.add('modal-open')

    // populate fields
    const title = document.getElementById('title')
    const details = document.getElementById('details')
    const location = document.getElementById('location')
    const datetime = document.getElementById('datetime')

    if (title) title.value = sighting.title || ''
    if (details) details.value = sighting.text || ''
    if (location) location.value = sighting.location || ''

    if (datetime) {
        const ts = sighting.timeStamp
        let iso = ''
        if (ts) {
            // try robust parsing for several possible formats
            const tryParse = (input) => {
                if (!input) return null
                // 1) ISO or browser-parsable
                let d = new Date(input)
                if (!isNaN(d.getTime())) return d

                // 2) Format: "21 December 2025, 14:00" or short-month like "7 Jan 2025 at 10:00"
                const m = input.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:,|\s+at\s+)?\s*(\d{1,2}):(\d{2})/i)
                if (m) {
                    const day = parseInt(m[1], 10)
                    const monthName = m[2].toLowerCase()
                    const year = parseInt(m[3], 10)
                    const hour = parseInt(m[4], 10)
                    const minute = parseInt(m[5], 10)
                    const monthsMap = {
                        jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
                        apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
                        aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9,
                        nov: 10, november: 10, dec: 11, december: 11
                    }
                    const key = monthName.slice(0, 3)
                    const monthIndex = (monthsMap[key] !== undefined) ? monthsMap[key] : monthsMap[monthName]
                    if (monthIndex !== undefined && monthIndex >= 0) return new Date(year, monthIndex, day, hour, minute)
                }

                // 3) Format: dd/mm/yyyy HH:MM or dd-mm-yyyy HH:MM
                const m2 = input.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})[, ]+?(\d{1,2}):(\d{2})/)
                if (m2) {
                    const day = parseInt(m2[1], 10)
                    const month = parseInt(m2[2], 10)
                    const year = parseInt(m2[3], 10)
                    const hour = parseInt(m2[4], 10)
                    const minute = parseInt(m2[5], 10)
                    return new Date(year < 100 ? 2000 + year : year, month - 1, day, hour, minute)
                }

                return null
            }

            const d = tryParse(ts)
            console.log('openEditFormWithSighting — raw timeStamp:', ts, 'parsed:', d)
            if (d && !isNaN(d.getTime())) {
                const pad = n => String(n).padStart(2, '0')
                iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
            } else {
                console.warn('Could not parse timeStamp for sighting:', ts)
            }
        }
        datetime.value = iso
    }

    // bring focus to first input
    if (title) title.focus()

    // Set up edit submit handler for this sighting
    if (sighting && sighting.uuid) {
        updateSighting(sighting.uuid)
    }
}

function closeEditForm() {
    const form = document.getElementById('editEventForm')
    if (!form) return
    form.classList.remove('modal')
    document.body.classList.remove('modal-open')
    form.reset()
}

// close via Escape key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeEditForm()
})


function updateSighting(id) {
    const form = document.getElementById("editEventForm")
    // try to find a message element in the form; if not present, fallback to console
    const formMessageText = document.getElementsByClassName("form-message-text")[0] || null

    // Store current editing id on the form
    form.dataset.editing = id

    // Replace submit handler so it's not attached multiple times
    form.onsubmit = async function (event) {
        event.preventDefault()

        const location = document.getElementById("location").value
        const text = document.getElementById("details").value
        const title = document.getElementById("title").value

        if (!location || !text || !title) {
            if (formMessageText) formMessageText.textContent = `Please complete all fields!`
            else console.warn('Please complete all fields!')
            return
        }

        const isoDateString = document.getElementById("datetime").value

        if (!isoDateString) {
            if (formMessageText) formMessageText.textContent = "Please select a date and time!"
            else console.warn('Please select a date and time!')
            return
        }
        // Convert the string to a JavaScript Date object
        const date = new Date(isoDateString)
        const iso = date.toISOString()

        const formData = {
            location: location,
            // store ISO so inputs can use it; display is formatted in the UI
            timeStamp: iso,
            text: text,
            title: title,
        }

        try {
            // Send form data using fetch API
            if (formMessageText) formMessageText.textContent = ""
            const response = await fetch(`./api/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData),
            })
            if (response.ok) {
                // refresh list and close modal
                getSightings()
                closeEditForm()
                if (formMessageText) formMessageText.innerHTML = `Your sighting was edited.`
                else console.log('Sighting edited')
            } else {
                if (formMessageText) formMessageText.textContent = `The server Ghosted you(!). Please try again.`
                console.error("Server Error:", response.statusText)
            }
        } catch (error) {
            if (formMessageText) formMessageText.textContent = `Serious ghouls! Please try again.`
            console.error("Error:", error)
        }
    }
}

document.body.addEventListener('click', async event => {
    if (event.target.closest('.delete')) {
        await deleteSighting(event.target.id)
        getSightings()
    } else if (event.target.closest('.read-more-btn')) {
        // read-more handled by cards-container handler; ignore here
        return
    } else if (event.target.closest('.sighting-card')) {
        const article = event.target.closest('.sighting-card')
        const { articleId } = article.dataset
        try {
            const sighting = await getSighting(articleId)
            if (!sighting || !sighting.uuid) {
                console.error('Sighting not found:', articleId)
                return
            }
            openEditFormWithSighting(sighting)
        } catch (err) {
            console.error('Error fetching sighting:', err)
        }
    } else if (!event.target.closest('#editEventForm')) {
        closeEditForm()
    }

})

getSightings()